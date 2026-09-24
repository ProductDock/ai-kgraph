"use client";

import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  DataTexture,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  InstancedInterleavedBuffer,
  InstancedMesh,
  InterleavedBufferAttribute,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Sphere,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import {
  HUB_TOKEN,
  HUE_COUNT,
  hueToken,
  NODE_TERMINATOR,
  TINT_CEILING,
} from "@/lib/graph/colour";
import { familyShade } from "@/lib/graph/colour-metrics";
import { nodeHref, nodeIdFromAddress } from "@/lib/graph/paths";
import type { GraphScene, GraphSceneNode } from "@/lib/graph/types";
import { useGraphViewStore } from "@/stores/graph-view-store";
import {
  declutter,
  GraphLabels,
  labelOffsetPx,
  selectLabelled,
  type GraphLabelsHandle,
} from "./graph-labels";
import { GraphStatsPanel } from "./graph-stats-panel";
import {
  NodeHoverCard,
  type CardAnchor,
  type NodeHoverCardHandle,
} from "./node-hover-card";
import {
  createSpringField,
  rubberBand,
  stepSpring,
} from "./spring";
import { createTween, prefersReducedMotion, tweenDuration } from "./tween";
import { UnsupportedNotice } from "./unsupported-notice";

/**
 * Tuning values, not invariants. These are the numbers that looked right on screen;
 * the properties they have to satisfy are asserted in the tests, which do not
 * depend on which numbers these are.
 */
/**
 * Wide on purpose. Perspective convergence - the thing that makes a still frame
 * read as a space rather than as a diagram - is a function of fov, and at the 50
 * this started on the graph is far enough away that near and far nodes are drawn
 * at almost the same scale. Past about 70 the edges of the frame start to stretch.
 */
const CAMERA_FOV = 62;
/** Breathing room left around the graph once it has been fitted to the frame. */
const OVERVIEW_MARGIN = 1.06;
/**
 * How many times the overview re-centres and re-fits. Target and distance depend on
 * each other, so the solve is iterative; see `overviewFraming`, which records where
 * three came from.
 */
const OVERVIEW_CENTRING_PASSES = 3;
/**
 * Fog and label fade are multiples of how far the camera currently is from what it
 * is looking at, not of the scene radius. The scene radius is fixed, but the view
 * distance is not: it differs between a desktop and a portrait tablet (the fit in
 * `overviewDistance`) and again every time the viewer dollies. Keyed to the scene
 * radius, the whole graph fell inside the fade band on a tablet and dissolved into
 * the page - visible only by looking, which is why §9.6 left these to be retuned.
 */
const FOG_NEAR = 0.75;
const FOG_FAR = 2.2;
const LABEL_NEAR = 0.55;
const LABEL_FAR = 1.8;
/**
 * The ground plane under the graph (`intent/graph-depth-on-first-load/`). A still
 * frame of unlit circles on a flat page is a 2D diagram until you drag it: nothing
 * in it converges, so nothing says there is a third axis. A polar grid drawn on one
 * horizontal plane says it in perspective alone - its circles are ellipses and its
 * spokes converge - and it says it without touching a node colour, which a lit
 * material would (see the note on `nodeMaterial`).
 *
 * Polar rather than square because the layout is a hub and a ring: the circles are
 * the shells and the spokes meet at the hub, so the grid reads as the graph's own
 * floor rather than as graph paper it happens to sit on.
 */
const FLOOR_RINGS = 6;
const FLOOR_SPOKES = 16;
const FLOOR_SEGMENTS = 128;
/** How much wider than its node a floor mark is drawn. */
const SHADOW_SPREAD = 1.35;
/** How far the floor reaches past the outermost node, and how far it sits below. */
const FLOOR_MARGIN = 1.18;
const FLOOR_DROP = 0.22;
/**
 * Edges are arcs, not chords (§7.4 kept the geometry open). A straight line between
 * two spheres is the one mark in the scene with no thickness, no shading and no
 * perspective of its own: three points on it project to three points on the screen
 * whatever the camera does, so it reads as a line drawn *on* the frame rather than
 * as a link lying *in* it. Bowing it away from the floor gives it a plane - the arc
 * foreshortens as the camera comes down, flattens as it rises - and it separates
 * the pair of edges between nodes that happen to line up behind one another.
 *
 * The bow is a fraction of the edge's own length, so short leaf links stay nearly
 * straight and only the long ring spans sweep. It is lifted along the component of
 * world up perpendicular to the edge, which means a near-vertical edge bows
 * sideways instead of collapsing onto itself.
 */
const EDGE_BOW = 0.09;
const EDGE_SEGMENTS = 14;
/** Two per chord: `LineSegments` does not share vertices between segments. */
const EDGE_VERTICES = EDGE_SEGMENTS * 2;
/**
 * The opening sweep. The floor makes the scene *look* three-dimensional in a still
 * frame; a few degrees of azimuth on load makes it *behave* three-dimensional -
 * parallax between the near and far halves of the tree is the cue nothing static
 * can give. It ends on exactly the framing the overview would have had, so this
 * changes where the camera starts, never where it settles, and a viewer who grabs
 * the canvas takes over mid-sweep.
 */
/**
 * The lighting, calibrated rather than chosen: `AMBIENT + KEY === 1`, so the point
 * of a node facing the key light comes out at *exactly* its token colour and the
 * shading only ever darkens from there, bottoming out at `NODE_TERMINATOR` of it on
 * the terminator - a palette number, which is why it lives in `lib/graph/colour.ts`
 * and is checked by `palette.contract.test.ts` at both ends. That is what makes this compatible with the palette the ramp
 * validator passed (spec §7.4): the hue never moves, the brightest region of each
 * circle is the validated value, and every shaded pixel moves *away* from the page
 * in both themes, so contrast only improves. Without it the nodes are flat discs
 * and no amount of backdrop makes the scene read as 3D.
 */
/**
 * The tint maths works on a six-digit hex and throws on anything else, and what a
 * token resolves to is a stylesheet's business - so a hue declared some other way
 * is drawn flat rather than taking the scene down with it.
 */
const HEX = /^#[0-9a-f]{6}$/i;

const AMBIENT = NODE_TERMINATOR;
const KEY = 1 - AMBIENT;
/**
 * Lambert's BRDF divides by pi, and three's lights carry no compensating factor
 * since the legacy lighting path was removed - so intensities that sum to 1 render
 * every node at 1/pi of its albedo. Measured off a screenshot before this was
 * here: the hub's #2a78d6 came out #244f77, its yellow #c98500 came out #86601e.
 * Not a tuning value. It is the number that makes AMBIENT + KEY mean what the
 * comment above says it means.
 */
const LAMBERT_PI = Math.PI;
/**
 * What makes a node read as a ball rather than a shaded disc: a soft highlight
 * where the key light glints toward the camera, and a rim that darkens toward the
 * silhouette. The 24% of shading `NODE_TERMINATOR` allows is not enough on its own.
 *
 * Both are marks *outside* the palette contract, taken knowingly, like the focus
 * glow: the body of every node is still drawn exactly as calibrated above (Phong's
 * diffuse term is the same Lambert BRDF), and the highlight and rim cover a small
 * band at its centre and edge. `palette.contract.test.ts` does not cover them.
 */
const SPECULAR = 0x8c8c8c;
const SHININESS = 28;
/** How dark the very edge of a node is, as a fraction of its lit colour. */
const RIM_FLOOR = 0.62;
/** How tightly the rim hugs the silhouette; higher is a thinner band. */
const RIM_POWER = 2.4;
/** Nudges the key off the view axis, so the terminator is never a concentric ring. */
const KEY_OFFSET = new Vector3(-0.35, 0, 0.2);

const INTRO_MS = 2400;
const INTRO_SWEEP = (16 * Math.PI) / 180;
/**
 * The polar band the camera is fenced into (spec FR-6, NFR-2, §9.3): always looking
 * somewhat down onto the ring. `MIN_POLAR` keeps it away from the ring's axis, where
 * every topic lines up behind the hub; `MAX_POLAR` stops short of level with the
 * ring, so a viewer can never end up under it looking at the back of everything.
 * Azimuth stays unrestricted - turning the whole graph around is the part of the old
 * freedom the intent keeps.
 */
const MIN_POLAR = Math.PI * 0.18;
const MAX_POLAR = Math.PI * 0.36;
/** Inside the band, tilted rather than parked at either edge of it (spec §9.4). */
const OPENING_POLAR = Math.PI * 0.3;
/**
 * How close the camera may ever get to the origin, in world units. An absolute
 * number rather than a multiple of the ring's radius: the tighter-spacing change
 * shrank the ring, and a fence derived from it would have shrunk too, letting the
 * viewer back inside the middle the fence exists to keep them out of (FR-7). This
 * is the value that derivation produced before the tree was tightened, kept.
 */
const MIN_ORBIT_DISTANCE = 23;
/** How long a node's scale takes to reach its target - the focus bump. */
const SCALE_MS = 120;
const FOCUS_SCALE = 1.2;
/**
 * The focus emphasis: clicking a node dims everything that is not it or one of its
 * children, and marches dashes down each edge that hangs off it. It holds until the
 * viewer clicks somewhere else - another node re-targets it, empty space or Escape
 * releases it - so it is the drawn form of "this is where you are", not a flourish
 * that plays once.
 *
 * The dim is a mix toward the backdrop rather than toward grey: a node mixed to
 * grey is still a mark competing for attention, one mixed toward what is behind it
 * recedes.
 */
const DIM_IN_MS = 220;
const DIM_OUT_MS = 420;
/** How far a dimmed mark travels toward the backdrop; 1 would erase it entirely. */
const DIM_STRENGTH = 0.8;
/**
 * The dashes that march out to the children, measured in world units *along the
 * arc*. They used to be fractions of each edge's own length, which gave every edge
 * the same dash count but also made each edge its own speed: one edge per beat
 * whatever its length, so the dot riding them jumped speed at every child it
 * passed through - measured, edges run 7.2 to 12 units, a change of up to a
 * third at a junction, and it read as the animation catching. In world units the
 * trail is one even flow and the dash density is the same everywhere. The range
 * is narrow enough that the shortest edge still carries about thirteen dashes.
 */
const DASH_PERIOD = 0.55;
/** Of each dash-plus-gap period, how much is drawn. */
const DASH_DUTY = 0.3;
/**
 * How fast the flow runs, in world units per millisecond - dashes and dot alike.
 * About one typical edge every 900ms, which is the beat the per-edge timing had.
 */
const FLOW_SPEED = 9 / 1000;
/** Dashes fade in and out rather than appearing mid-edge. */
const DASH_FADE_MS = 200;
/**
 * The travelling dot. One leaves the clicked node per path and runs outward to a
 * leaf, and it moves at exactly the dashes' speed - `FLOW_SPEED`, measured along
 * the same arc length - so it reads as the head of the flow the dashes are the
 * trail of, rather than as a second animation at its own speed.
 *
 * Paths that share their first edge carry a dot each, exactly in phase, so they
 * overlap into one dot that visibly *splits* at the child and runs on to each
 * grandchild. That is the reason the dots are per path and not per edge.
 */
const DOT_RADIUS = 0.18;
/**
 * The lit edges are drawn with `LineSegments2`, which is a strip of camera-facing
 * quads rather than GL lines - because `linewidth` on a GL line is ignored by every
 * platform that matters, so the ordinary edges are hairlines whatever is asked for.
 * At one pixel the dashes are thinner than the dot riding them and they alias badly
 * against the dimmed graph; at this width the trail reads as a channel with
 * something moving in it. In CSS pixels, so a dash is the same weight on a phone as
 * on a desktop - which is also why the material needs the viewport size
 * (`resolution`) and has to be told about it on every resize.
 */
const FLOW_WIDTH_PX = 1.9;
/**
 * While the dashes are the *only* thing moving, frames are capped at this interval
 * rather than drawn on every display refresh. The scene renders on demand (R-11)
 * and a held emphasis is the one animation with no end of its own, so uncapped it
 * would be a 120 or 144fps loop on a high-refresh screen for as long as a node
 * stays focused - on a page nobody is touching.
 *
 * The cap is 60, not the 30 it used to be, and it is kept on refresh boundaries
 * (`paceEmphasisFrame`) rather than by a timer. Both halves were visible: the
 * camera flies to the node at full rate and the flow then dropped to 30, so the
 * scene visibly got choppier the moment it landed; and a 33ms timer against a
 * 16.7ms refresh lands frames 33 and 50ms apart in turn, which a dot moving at a
 * constant speed shows as a stutter. Anything else that moves - the camera,
 * damping, a hover - takes the normal path and is not capped by it.
 */
const EMPHASIS_FRAME_MS = 1000 / 60;
/**
 * How early a refresh may land and still count as due. Without it, jitter of a
 * fraction of a millisecond makes a 60Hz screen miss every other refresh - the
 * 30fps the cap exists to get away from. Sized to sit between the two cases it
 * has to tell apart: a 60Hz refresh (16.7ms, due) and a 120Hz one (8.3ms, not),
 * with a couple of milliseconds of jitter either side.
 */
const EMPHASIS_FRAME_SLACK_MS = 6;
/**
 * The focus glow: a soft halo in each node's own colour, behind the clicked node,
 * its children and the node it hangs off. Drawn as camera-facing sprites in the
 * scene rather than as a bloom pass, for two reasons that are both about the
 * palette. A bloom pass brightens every pixel over a threshold, so it moves the
 * *nodes'* colours off the values `palette.contract.test.ts` validated; a halo
 * only adds a new mark around them and leaves every node pixel alone. And the
 * canvas is transparent over a CSS backdrop, which a composer's render targets
 * would have to be taught to preserve.
 *
 * `HALO_SPREAD` is the halo's radius as a multiple of the node's drawn radius. The
 * strengths are peak opacities, strongest on the node you clicked, and the parent
 * is the faintest because the dim has already sent its body toward the backdrop -
 * its halo is the one place it keeps its hue, which is the "you came from here".
 */
const HALO_SPREAD = 2.1;
const HALO_FOCUSED = 0.55;
const HALO_CHILD = 0.3;
const HALO_PARENT = 0.22;
/** Texture resolution for the halo's falloff; it is only ever drawn a few dozen pixels wide. */
const HALO_TEXTURE_SIZE = 64;
/**
 * How much of a drag each generation below the dragged node follows. The node
 * itself tracks the pointer; its children are pulled 70% of the way, their
 * children 70% of that, all through springs, so a branch trails behind the node
 * like something with weight rather than moving as one rigid piece.
 */
const DRAG_FOLLOW = 0.7;
/** Enough movement between press and release to have been an orbit, not a click. */
const CLICK_SLOP_PX = 5;
/**
 * How long a finger has to stay down on a node before it raises the card instead of
 * being a tap. A tuning value, sized by eye: long enough that a tap meant to fly the
 * camera never trips it, short enough that nobody wonders whether it worked. The
 * gesture is cancelled the moment the finger moves past `CLICK_SLOP_PX`, so this is
 * only ever measured against a finger holding still (spec §9.2, FR-7).
 */
const LONG_PRESS_MS = 450;
/**
 * How long a desktop card outlives the pointer leaving its node (node-content-pages
 * plan, "Hover gap"). Without it the card closes the instant the pointer crosses
 * the gap towards it - and entering the "Open page" link itself fires the canvas's
 * `pointerleave` - so the one link on it could never be clicked. Node-to-node stays
 * instant, and a drag still closes the card at once (FR-11). A tuning value.
 */
const CARD_CLOSE_GRACE_MS = 200;
const LABEL_INTERVAL_MS = 1000 / 30;

const WORLD_UP = new Vector3(0, 1, 0);

/**
 * Every token the scene reads, fixed and module-scope. `useThemeTokens` keys a
 * `useCallback` on this array's identity, so building it per render - from the nodes,
 * say - would re-run the hook every frame.
 */
const SCENE_TOKENS = [
  HUB_TOKEN,
  ...Array.from({ length: HUE_COUNT }, (_, slot) => hueToken(slot)),
  "--graph-edge",
  "--graph-floor",
  "--graph-shadow",
  "--graph-space-near",
] as const;

/**
 * The whole scene, imperative, in one effect (spec §7.6). React owns the canvas
 * element, the focused node id and nothing else: node positions, label positions
 * and label opacity are written to refs, because sixty state updates a second would
 * re-render the tree continuously.
 *
 * Nothing here runs on a loop. A frame is rendered only when something invalidates
 * it - an orbit change, a tween step, a theme change, a hover - which is the
 * difference between a warm tablet and a cool one. Every animation source therefore
 * has to call `invalidate()` itself; with vanilla three there is no frameloop
 * setting that does it for us.
 *
 * The teardown is the part to be careful with (R-12, V-19). It fails silently: no
 * error, just a browser that has run out of WebGL contexts after a few navigations.
 */
export function GraphSceneCanvas({ scene }: { scene: GraphScene }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<GraphLabelsHandle>(null);
  const cardRef = useRef<NodeHoverCardHandle>(null);
  const [contextLost, setContextLost] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Mirrors of React state and props that the effect reads without re-running:
  // rebuilding the scene to change a colour would throw away the camera.
  const focusedIdRef = useRef<string | null>(null);
  const tokensRef = useRef<Record<string, string>>({});
  const applyTokensRef = useRef<(() => void) | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);
  /** What the card's link reports back into the effect, published the same way. */
  const cardLinkRef = useRef<{
    hold: () => void;
    release: () => void;
    navigate: () => void;
  } | null>(null);

  const tokens = useThemeTokens(SCENE_TOKENS);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { nodes, edges } = scene;
    const indexById = new Map(nodes.map((node, index) => [node.id, index]));
    const sceneRadius = scene.radius || 1;
    // The ring, for the opening azimuth only - `lib/graph` keeps its numbers to
    // itself and the client only ever received positions (spec §7.6).
    const ringNodes = nodes.filter((node) => node.depth === 1);

    // ---- renderer, camera, controls -------------------------------------------
    // Transparent, so the container's CSS gradient is the scene's backdrop. A
    // solid clear colour is the one thing that cannot give the frame depth: every
    // pixel that is not a node comes out the same.
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.touchAction = "none";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const world = new Scene();
    // Range is set per frame from the view distance; these are placeholders.
    const fog = new Fog(0xffffff, sceneRadius, sceneRadius * 3);
    world.fog = fog;

    const camera = new PerspectiveCamera(
      CAMERA_FOV,
      1,
      sceneRadius / 100,
      sceneRadius * 12,
    );
    // Halfway between two ring topics rather than facing one head-on: with the
    // topics evenly spaced that is the only azimuth where none of them starts out
    // hidden behind another (spec FR-7, §9.4). Derived from the positions, so a
    // fifth topic moves this angle instead of invalidating it.
    const firstRing = ringNodes[0];
    const openingAzimuth = firstRing
      ? Math.atan2(firstRing.position[2], firstRing.position[0]) +
        Math.PI / ringNodes.length
      : 0;
    const openingDirection = new Vector3(
      Math.sin(OPENING_POLAR) * Math.cos(openingAzimuth),
      Math.cos(OPENING_POLAR),
      Math.sin(OPENING_POLAR) * Math.sin(openingAzimuth),
    );

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    // Higher than the 0.05 default: damping decays exponentially and every frame
    // of the tail is a rendered frame, so the default leaves the GPU busy for
    // about three seconds after the viewer has let go.
    controls.dampingFactor = 0.12;
    // Panning is not in the intent and it is the fastest way to lose the graph
    // off-screen (FR-6).
    controls.enablePan = false;
    // Fixed rather than keyed to the scene's size, so "cannot fly into the middle"
    // stays put when the layout is tightened (spec NFR-3, §9.3).
    controls.minDistance = MIN_ORBIT_DISTANCE;
    controls.maxDistance = sceneRadius * 5;
    controls.minPolarAngle = MIN_POLAR;
    controls.maxPolarAngle = MAX_POLAR;

    // ---- lights ---------------------------------------------------------------
    // A key light that rides the camera, offset up and to the left of it. Fixed in
    // world space, half the graph faces away and comes back evenly lit - flat
    // discs again, just darker ones - and which half depends on where the viewer
    // has orbited to. Riding the camera means every node shows a terminator from
    // every angle. Its position is written per frame, in `renderFrame`.
    const ambientLight = new AmbientLight(0xffffff, AMBIENT * LAMBERT_PI);
    const keyLight = new DirectionalLight(0xffffff, KEY * LAMBERT_PI);
    world.add(ambientLight, keyLight);

    // ---- nodes: one InstancedMesh, one draw call (NFR-2) ----------------------
    // Lit, not basic: see AMBIENT/KEY above for why shading this does not move a
    // node's body off the value the ramp validator passed (spec §7.4). Phong
    // rather than Lambert only for the highlight, and the rim is patched in
    // before fog so a far node's edge fades with the rest of it - see SPECULAR.
    const nodeGeometry = new SphereGeometry(1, 32, 24);
    const nodeMaterial = new MeshPhongMaterial({
      fog: true,
      specular: SPECULAR,
      shininess: SHININESS,
    });
    nodeMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `float rimFacing = saturate(dot(normal, normalize(vViewPosition)));
        outgoingLight *= mix(${RIM_FLOOR.toFixed(3)}, 1.0, 1.0 - pow(1.0 - rimFacing, ${RIM_POWER.toFixed(3)}));
        #include <opaque_fragment>`,
      );
    };
    const nodeMesh = new InstancedMesh(
      nodeGeometry,
      nodeMaterial,
      nodes.length,
    );
    world.add(nodeMesh);

    const dummy = new Object3D();
    /** Current and target scale multipliers, for the focus bump. */
    const scales = new Float32Array(nodes.length).fill(1);
    const scaleTargets = new Float32Array(nodes.length).fill(1);
    const animatingScales = new Set<number>();

    /**
     * How far each node currently sits from its layout position - the drag and the
     * spring back from it (`spring.ts`). Zero for every node at rest, which is
     * nearly always, and then everything below draws exactly the layout.
     */
    const springs = createSpringField(nodes.length);
    /** Nodes whose offset is still moving; the only ones a frame rewrites. */
    const springing = new Set<number>();

    /** Where node `index` is drawn: its layout position plus its spring offset. */
    function livePosition(index: number, out: Vector3): Vector3 {
      const node = nodes[index]!;
      const base = index * 3;
      return out.set(
        node.position[0] + springs.offsets[base]!,
        node.position[1] + springs.offsets[base + 1]!,
        node.position[2] + springs.offsets[base + 2]!,
      );
    }

    function writeMatrix(index: number) {
      const node = nodes[index]!;
      livePosition(index, dummy.position);
      dummy.scale.setScalar(node.radius * scales[index]!);
      dummy.updateMatrix();
      nodeMesh.setMatrixAt(index, dummy.matrix);
    }
    nodes.forEach((_, index) => writeMatrix(index));
    nodeMesh.instanceMatrix.needsUpdate = true;

    // ---- edges: one LineSegments, one draw call -------------------------------
    // Each edge is a quadratic arc sampled into EDGE_SEGMENTS chords - see the note
    // on EDGE_BOW. Still one geometry and one draw call; the cost is vertices, not
    // batches.
    const edgeFrom = new Vector3();
    const edgeTo = new Vector3();
    const edgeDirection = new Vector3();
    const edgeLift = new Vector3();
    const edgeControl = new Vector3();
    const edgeHere = new Vector3();
    const edgeThere = new Vector3();

    /** The point at `t` along the arc, written into `out`. */
    function arcPoint(out: Vector3, t: number) {
      const inverse = 1 - t;
      return out
        .copy(edgeFrom)
        .multiplyScalar(inverse * inverse)
        .addScaledVector(edgeControl, 2 * inverse * t)
        .addScaledVector(edgeTo, t * t);
    }

    const edgeVertices = new Float32Array(edges.length * EDGE_SEGMENTS * 6);
    /**
     * Each arc's three control points, kept so a point at an arbitrary `t` can be
     * found later. The line geometry above is the arc already flattened into chords
     * and cannot be read back at a `t` that falls between two of them.
     */
    const edgeArcs = new Float32Array(edges.length * 9);
    /**
     * How far along its arc each of an edge's EDGE_SEGMENTS + 1 samples sits, in
     * world units; the last is the arc's whole length. What lets the flow move at
     * one speed in the world rather than one edge per beat, and lets the dot be
     * placed by distance rather than by `t` - which a quadratic does not advance
     * evenly.
     */
    const edgeArcDistances = new Float32Array(
      edges.length * (EDGE_SEGMENTS + 1),
    );
    /** Each edge's two node indices, parent first. */
    const edgeEnds = new Int32Array(edges.length * 2);
    /** Every edge touching a node, so a moved node knows which arcs to rebuild. */
    const edgesOfNode = new Map<number, number[]>();
    edges.forEach((edge, index) => {
      const source = indexById.get(edge.sourceId)!;
      const target = indexById.get(edge.targetId)!;
      edgeEnds[index * 2] = source;
      edgeEnds[index * 2 + 1] = target;
      for (const end of [source, target]) {
        const touching = edgesOfNode.get(end);
        if (touching) touching.push(index);
        else edgesOfNode.set(end, [index]);
      }
    });

    /**
     * Samples edge `index`'s arc between its two nodes' *live* positions into the
     * chord buffer, the stored control points and the arc distances. Run for every
     * edge once at build time and again, per frame, only for the edges of a node a
     * spring is moving - so a dragged node's links stretch and bow with it.
     */
    function buildEdge(index: number) {
      livePosition(edgeEnds[index * 2]!, edgeFrom);
      livePosition(edgeEnds[index * 2 + 1]!, edgeTo);
      const length = edgeFrom.distanceTo(edgeTo);
      edgeDirection.subVectors(edgeTo, edgeFrom).normalize();
      // World up, with the part of it that runs along the edge removed: what is
      // left is perpendicular to the edge, so the arc always bows *across* it.
      edgeLift
        .copy(WORLD_UP)
        .addScaledVector(edgeDirection, -WORLD_UP.dot(edgeDirection));
      // Parallel to up, so there is no perpendicular to bow along: leave it
      // straight rather than picking an arbitrary direction that would make one
      // edge in the tree lean for no reason the viewer can see.
      if (edgeLift.lengthSq() < 1e-6) edgeLift.set(0, 0, 0);
      else edgeLift.normalize();
      // A quadratic sits half way to its control point at the midpoint, so the
      // control point is lifted twice the bow the arc should actually have.
      edgeControl
        .addVectors(edgeFrom, edgeTo)
        .multiplyScalar(0.5)
        .addScaledVector(edgeLift, 2 * EDGE_BOW * length);

      edgeArcs.set(edgeFrom.toArray(), index * 9);
      edgeArcs.set(edgeControl.toArray(), index * 9 + 3);
      edgeArcs.set(edgeTo.toArray(), index * 9 + 6);

      const base = index * EDGE_SEGMENTS * 6;
      const arcBase = index * (EDGE_SEGMENTS + 1);
      let along = 0;
      arcPoint(edgeHere, 0);
      for (let step = 0; step < EDGE_SEGMENTS; step += 1) {
        arcPoint(edgeThere, (step + 1) / EDGE_SEGMENTS);
        edgeVertices.set(edgeHere.toArray(), base + step * 6);
        edgeVertices.set(edgeThere.toArray(), base + step * 6 + 3);
        along += edgeHere.distanceTo(edgeThere);
        edgeArcDistances[arcBase + step + 1] = along;
        edgeHere.copy(edgeThere);
      }
    }
    for (let index = 0; index < edges.length; index += 1) buildEdge(index);
    const edgeGeometry = new BufferGeometry();
    // A plain `BufferAttribute`, not `Float32BufferAttribute`: the latter copies the
    // array it is handed, and a dragged node rewrites `edgeVertices` in place.
    const edgePositions = new BufferAttribute(edgeVertices, 3);
    edgeGeometry.setAttribute("position", edgePositions);
    const edgeMaterial = new LineBasicMaterial({ fog: true });
    const edgeLines = new LineSegments(edgeGeometry, edgeMaterial);
    // Its bounds are computed once, from the layout; a dragged edge can leave them.
    edgeLines.frustumCulled = false;
    world.add(edgeLines);

    // ---- floor: the depth cue, one more draw call -----------------------------
    // Sized from the node positions, not from the layout's constants: `lib/graph`
    // keeps those to itself, so tightening the tree moves the floor with it.
    let floorY = 0;
    let floorRadius = 0;
    for (const node of nodes) {
      floorY = Math.min(floorY, node.position[1] - node.radius);
      floorRadius = Math.max(
        floorRadius,
        Math.hypot(node.position[0], node.position[2]) + node.radius,
      );
    }
    floorY -= sceneRadius * FLOOR_DROP;
    floorRadius *= FLOOR_MARGIN;

    const floorVertices: number[] = [];
    for (let ring = 1; ring <= FLOOR_RINGS; ring += 1) {
      const radius = (floorRadius * ring) / FLOOR_RINGS;
      for (let step = 0; step < FLOOR_SEGMENTS; step += 1) {
        const from = (step / FLOOR_SEGMENTS) * Math.PI * 2;
        const to = ((step + 1) / FLOOR_SEGMENTS) * Math.PI * 2;
        floorVertices.push(
          Math.cos(from) * radius,
          floorY,
          Math.sin(from) * radius,
          Math.cos(to) * radius,
          floorY,
          Math.sin(to) * radius,
        );
      }
    }
    for (let spoke = 0; spoke < FLOOR_SPOKES; spoke += 1) {
      const angle = (spoke / FLOOR_SPOKES) * Math.PI * 2;
      floorVertices.push(
        0,
        floorY,
        0,
        Math.cos(angle) * floorRadius,
        floorY,
        Math.sin(angle) * floorRadius,
      );
    }
    // A stem from the hub and from each ring topic down to the floor. Five lines,
    // and they are what turns the floor from a backdrop into a plane the graph is
    // standing *on*: the height they measure is only visible in perspective.
    const hubNode = nodes.find((node) => node.parentId === null);
    const stemNodes = hubNode ? [hubNode, ...ringNodes] : ringNodes;
    /** Where the stems start in the floor buffer, in floats; they are its tail. */
    const stemsAt = floorVertices.length;
    /** Node index -> which stem it stands on, for the few nodes that have one. */
    const stemOf = new Map(
      stemNodes.map((node, stem) => [indexById.get(node.id)!, stem]),
    );
    for (const node of stemNodes) {
      floorVertices.push(
        node.position[0],
        node.position[1],
        node.position[2],
        node.position[0],
        floorY,
        node.position[2],
      );
    }

    const floorGeometry = new BufferGeometry();
    const floorPositions = new Float32BufferAttribute(floorVertices, 3);
    floorGeometry.setAttribute("position", floorPositions);

    /** Moves node `index`'s stem with it; a no-op for a node that has none. */
    function writeStem(index: number): boolean {
      const stem = stemOf.get(index);
      if (stem === undefined) return false;
      livePosition(index, edgeHere);
      const at = stemsAt + stem * 6;
      const data = floorPositions.array;
      data[at] = edgeHere.x;
      data[at + 1] = edgeHere.y;
      data[at + 2] = edgeHere.z;
      data[at + 3] = edgeHere.x;
      data[at + 5] = edgeHere.z;
      return true;
    }
    const floorMaterial = new LineBasicMaterial({ fog: true });
    const floorLines = new LineSegments(floorGeometry, floorMaterial);
    // The floor is decoration, not content: it must never be what a screen reader
    // or the picker finds, and the picker only ever tests `nodeMesh`.
    floorLines.renderOrder = -1;
    world.add(floorLines);

    // A disc on the floor under every node. Of all the cues here this is the one
    // that carries the most: the grid says "there is a plane", and the discs say
    // how far above it each node is - the gap between a node and its own mark is
    // height, and it is readable without moving the camera. Unlit and flat, so it
    // costs one draw call and no shadow map.
    const shadowGeometry = new CircleGeometry(1, 24);
    // Built facing +Y once, rather than rotating 148 instance matrices.
    shadowGeometry.rotateX(-Math.PI / 2);
    const shadowMaterial = new MeshBasicMaterial({ fog: true });
    const shadowMesh = new InstancedMesh(
      shadowGeometry,
      shadowMaterial,
      nodes.length,
    );
    /** Node `index`'s floor mark, straight under wherever the node is drawn. */
    function writeShadow(index: number) {
      livePosition(index, dummy.position).setY(floorY);
      // Wider than the node: a hard disc the size of the sphere reads as a second
      // node lying on the floor rather than as the mark one casts.
      dummy.scale.setScalar(nodes[index]!.radius * SHADOW_SPREAD);
      dummy.updateMatrix();
      shadowMesh.setMatrixAt(index, dummy.matrix);
    }
    nodes.forEach((_, index) => writeShadow(index));
    shadowMesh.instanceMatrix.needsUpdate = true;
    shadowMesh.frustumCulled = false;
    shadowMesh.renderOrder = -1;
    world.add(shadowMesh);

    // ---- focus emphasis: dashes marching out to the children -------------------
    /** The edges hanging *off* each node; `sourceId` is always the parent. */
    const childEdges = new Map<string, number[]>();
    /** The one edge each node hangs *from*, keyed by the child's id. */
    const parentEdgeOf = new Map<string, number>();
    edges.forEach((edge, index) => {
      const hanging = childEdges.get(edge.sourceId);
      if (hanging) hanging.push(index);
      else childEdges.set(edge.sourceId, [index]);
      parentEdgeOf.set(edge.targetId, index);
    });

    /** Edge `index`'s whole arc length, in world units. */
    function arcLength(index: number): number {
      return edgeArcDistances[index * (EDGE_SEGMENTS + 1) + EDGE_SEGMENTS]!;
    }

    /**
     * The token colours, kept apart from what is drawn. The emphasis mixes *from*
     * these, so the animation ending and the theme changing under it both land back
     * on exactly the value the palette contract validated - there is no accumulated
     * drift to reset.
     */
    const baseNodeColours = new Float32Array(nodes.length * 3);
    const baseEdgeColour = new Color(0x808080);
    /** What a dimmed mark recedes into: the backdrop at the vanishing point. */
    const backdropColour = new Color(0xffffff);

    /**
     * The flow overlay: the clicked node's own edges, drawn a second time on top of
     * themselves, dashed, with the dashes travelling parent to child.
     *
     * A second object rather than dashing the edge mesh itself, because a dash is a
     * *discarded fragment* - the gaps have to be genuinely absent, not painted in
     * the backdrop colour, or every gap would occlude whatever is behind it. The
     * dimmed solid edge stays underneath, so the link is still legible between the
     * dashes and the animation reads as something running along it rather than as
     * the edge blinking.
     *
     * Sized once for the widest two-level fan-out in the tree and re-filled per
     * click, so clicking never allocates a buffer or touches the GPU's allocator.
     */
    /** Every edge the emphasis would light for a given node, nearest level first. */
    function litEdgesFor(
      node: GraphSceneNode,
    ): { edge: number; level: number }[] {
      const hanging = childEdges.get(node.id) ?? [];
      const lit = hanging.map((edge) => ({ edge, level: 0 }));
      // The hub is the exception (and the only node where it matters): two levels
      // from the root is the ring plus everything hanging off it, which is most of
      // the graph lit at once - the opposite of pointing somewhere.
      if (node.parentId !== null) {
        for (const edge of hanging) {
          for (const below of childEdges.get(edges[edge]!.targetId) ?? []) {
            lit.push({ edge: below, level: 1 });
          }
        }
      }
      return lit;
    }

    let widestFanout = 0;
    for (const node of nodes) {
      widestFanout = Math.max(widestFanout, litEdgesFor(node).length);
    }
    const flowPositionData = new Float32Array(widestFanout * EDGE_VERTICES * 3);
    const flowDistanceData = new Float32Array(widestFanout * EDGE_VERTICES);

    // The buffers are built by hand rather than through `setPositions`/`setColors`,
    // which allocate a fresh `InstancedInterleavedBuffer` per call: the overlay is
    // refilled on every click, and this way the arrays are written in place and
    // only a `needsUpdate` flag is touched. The interleaving is the one those
    // helpers use - a segment's two ends sit side by side in one buffer.
    const flowGeometry = new LineSegmentsGeometry();
    const flowPositionBuffer = new InstancedInterleavedBuffer(
      flowPositionData,
      6,
      1,
    );
    flowGeometry.setAttribute(
      "instanceStart",
      new InterleavedBufferAttribute(flowPositionBuffer, 3, 0),
    );
    flowGeometry.setAttribute(
      "instanceEnd",
      new InterleavedBufferAttribute(flowPositionBuffer, 3, 3),
    );
    // Not `computeLineDistances()`: that runs one tally through every segment in
    // the buffer, so each edge would start where the previous one in the buffer
    // ended. The flow measures from the clicked node instead (`fillFlow`).
    const flowDistanceBuffer = new InstancedInterleavedBuffer(
      flowDistanceData,
      2,
      1,
    );
    flowGeometry.setAttribute(
      "instanceDistanceStart",
      new InterleavedBufferAttribute(flowDistanceBuffer, 1, 0),
    );
    flowGeometry.setAttribute(
      "instanceDistanceEnd",
      new InterleavedBufferAttribute(flowDistanceBuffer, 1, 1),
    );
    flowGeometry.instanceCount = 0;

    const flowMaterial = new LineMaterial({
      fog: true,
      transparent: true,
      opacity: 0,
      dashed: true,
      linewidth: FLOW_WIDTH_PX,
      dashSize: DASH_DUTY * DASH_PERIOD,
      gapSize: (1 - DASH_DUTY) * DASH_PERIOD,
      // The distances are already in the units the pattern is written in.
      dashScale: 1,
    });
    const flowLines = new LineSegments2(flowGeometry, flowMaterial);
    // On top of the solid edge it is lying exactly on.
    flowLines.renderOrder = 1;
    flowLines.visible = false;
    // The geometry is refilled in place and its bounds are never recomputed, so
    // leaving culling on would hide the dashes from whichever click happened to
    // land outside the first fill's bounds.
    flowLines.frustumCulled = false;
    world.add(flowLines);

    /**
     * The dots: one instance per lit path, unlit so they read as something moving
     * along the edge rather than as a very small node. Sized for the same widest
     * fan-out as the dashes, since a path count can never exceed an edge count.
     */
    const dotGeometry = new SphereGeometry(DOT_RADIUS, 10, 8);
    const dotMaterial = new MeshBasicMaterial({
      fog: true,
      transparent: true,
      opacity: 0,
    });
    const dotMesh = new InstancedMesh(
      dotGeometry,
      dotMaterial,
      Math.max(1, widestFanout),
    );
    dotMesh.count = 0;
    dotMesh.visible = false;
    dotMesh.frustumCulled = false;
    world.add(dotMesh);

    // ---- focus glow: a halo behind the clicked node and its family ------------
    // See HALO_SPREAD for why this is sprites and not a post-processing pass.
    //
    // One white falloff texture, tinted per sprite by its material colour. Opaque
    // inside the node's own silhouette - that part sits behind the sphere and is
    // depth-tested away, so what shows is only the ring outside it - then easing
    // to nothing at the sprite's edge. Built from numbers rather than drawn on a
    // 2D canvas, so it needs no DOM.
    const haloData = new Uint8Array(HALO_TEXTURE_SIZE * HALO_TEXTURE_SIZE * 4);
    const haloEdge = 1 / HALO_SPREAD;
    for (let y = 0; y < HALO_TEXTURE_SIZE; y += 1) {
      for (let x = 0; x < HALO_TEXTURE_SIZE; x += 1) {
        const r = Math.hypot(
          ((x + 0.5) / HALO_TEXTURE_SIZE) * 2 - 1,
          ((y + 0.5) / HALO_TEXTURE_SIZE) * 2 - 1,
        );
        const fall =
          r >= 1 ? 0 : r <= haloEdge ? 1 : 1 - (r - haloEdge) / (1 - haloEdge);
        const at = (y * HALO_TEXTURE_SIZE + x) * 4;
        haloData[at] = 255;
        haloData[at + 1] = 255;
        haloData[at + 2] = 255;
        // Squared, so the glow hugs the node and fades out softly rather than
        // ending on a visible rim.
        haloData[at + 3] = Math.round(fall * fall * 255);
      }
    }
    const haloTexture = new DataTexture(
      haloData,
      HALO_TEXTURE_SIZE,
      HALO_TEXTURE_SIZE,
    );
    haloTexture.needsUpdate = true;

    /** Enough sprites for the widest family: the node, its parent, its children. */
    let widestFamily = 1;
    for (const node of nodes) {
      widestFamily = Math.max(
        widestFamily,
        2 + (childEdges.get(node.id)?.length ?? 0),
      );
    }
    const halos = Array.from({ length: widestFamily }, () => {
      const sprite = new Sprite(
        new SpriteMaterial({
          map: haloTexture,
          fog: true,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        }),
      );
      sprite.visible = false;
      // After the nodes, so the depth test has something to hide the centre behind.
      sprite.renderOrder = 1;
      world.add(sprite);
      return sprite;
    });

    /**
     * The paths the dots run, as edge indices: the first edge, then the one it
     * continues into, or -1 where the child is a leaf and the dot stops there.
     */
    const dotPaths = new Int32Array(Math.max(1, widestFanout) * 2).fill(-1);

    const dotPoint = new Vector3();
    const dotFrom = new Vector3();
    const dotControl = new Vector3();
    const dotTo = new Vector3();

    /** The point at `t` along edge `index`, from the stored control points. */
    function arcAt(out: Vector3, index: number, t: number) {
      const base = index * 9;
      dotFrom.fromArray(edgeArcs, base);
      dotControl.fromArray(edgeArcs, base + 3);
      dotTo.fromArray(edgeArcs, base + 6);
      const inverse = 1 - t;
      return out
        .copy(dotFrom)
        .multiplyScalar(inverse * inverse)
        .addScaledVector(dotControl, 2 * inverse * t)
        .addScaledVector(dotTo, t * t);
    }

    /**
     * The point `distance` world units along edge `index`'s arc. Inverts the stored
     * sample distances and interpolates within the segment it falls in; a plain
     * `t = distance / length` would run the dot slightly faster through the middle
     * of the bow than at its ends.
     */
    function arcAtDistance(out: Vector3, index: number, distance: number) {
      const base = index * (EDGE_SEGMENTS + 1);
      let step = 0;
      while (
        step < EDGE_SEGMENTS - 1 &&
        edgeArcDistances[base + step + 1]! < distance
      ) {
        step += 1;
      }
      const from = edgeArcDistances[base + step]!;
      const span = edgeArcDistances[base + step + 1]! - from;
      const within =
        span > 0 ? Math.min(1, Math.max(0, (distance - from) / span)) : 0;
      return arcAt(out, index, (step + within) / EDGE_SEGMENTS);
    }

    type Emphasis = {
      /** When the dashes started their run; reset when the emphasis re-targets. */
      dashStartedAt: number;
      /** When the dim started fading in. Survives a re-target, so moving from one
          node to the next does not flash the scene back up in between. */
      startedAt: number;
      /** When the viewer let go, or null while it is being held. */
      releasedAt: number | null;
      /** How many edges the overlay currently holds. */
      count: number;
      /** Node indices that keep their colour while everything else dims. */
      lit: Set<number>;
      /** The clicked node, for re-filling the overlay when a spring moves it. */
      index: number;
      /** Who gets a halo, and how strong at full emphasis. */
      glow: { index: number; strength: number }[];
    };
    let emphasis: Emphasis | null = null;
    /** How many of the dot instances are in use; `fillFlow` sets it. */
    let dotCount = 0;
    /** 0..1: how far the scene has faded toward the backdrop. */
    let emphasisDim = 0;
    /**
     * The same figure before the smoothstep. Kept because a new emphasis back-dates
     * its own start by it, which is what lets one that arrives mid-fade pick the
     * scene up from where it actually is rather than snapping it bright and dimming
     * it again.
     */
    let emphasisRamp = 0;

    const paintColour = new Color();

    /**
     * The dim, applied from the base colours. Nodes are per-instance; the edges are
     * one material, and dimming that dims the child edges too - deliberately, since
     * the overlay is what carries them while the emphasis is up.
     */
    function paintDim() {
      const lit = emphasis?.lit;
      for (let index = 0; index < nodes.length; index += 1) {
        const base = index * 3;
        paintColour.setRGB(
          baseNodeColours[base]!,
          baseNodeColours[base + 1]!,
          baseNodeColours[base + 2]!,
        );
        if (emphasisDim > 0 && !lit?.has(index)) {
          paintColour.lerp(backdropColour, emphasisDim * DIM_STRENGTH);
        }
        nodeMesh.setColorAt(index, paintColour);
      }
      if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;

      paintColour.copy(baseEdgeColour);
      if (emphasisDim > 0) {
        paintColour.lerp(backdropColour, emphasisDim * DIM_STRENGTH);
      }
      edgeMaterial.color.copy(paintColour);
      // The dashes are the edge ink at full strength while every other edge is
      // dimmed away from it - so the lit ones stand out by *not* receding, and the
      // hue is left to the nodes and the dot. One material colour rather than a
      // colour buffer, which also means a theme change lands on them immediately
      // instead of at the next click.
      flowMaterial.color.copy(baseEdgeColour);
    }

    /** Copies the clicked node's lit edges into the overlay. Returns how many. */
    function fillFlow(index: number): number {
      const hanging = litEdgesFor(nodes[index]!);

      hanging.forEach(({ edge: edgeIndex, level }, slot) => {
        const from = edgeIndex * EDGE_VERTICES * 3;
        const to = slot * EDGE_VERTICES * 3;
        // The arc was sampled once at build time; the overlay is the same vertices.
        flowPositionData.set(
          edgeVertices.subarray(from, from + EDGE_VERTICES * 3),
          to,
        );

        // Written per click, not per frame: the march is a uniform on the material,
        // and this is the fixed part it is added to.
        //
        // Starting a second-level edge at the length of the edge above it is what
        // makes the two levels one continuous run: every vertex is its distance
        // from the clicked node, so a dash appears to leave it, reach a child and
        // carry on past it, rather than two rings of dashes starting at once.
        const start =
          level === 0
            ? 0
            : arcLength(parentEdgeOf.get(edges[edgeIndex]!.sourceId)!);
        const arcBase = edgeIndex * (EDGE_SEGMENTS + 1);
        for (let step = 0; step < EDGE_SEGMENTS; step += 1) {
          const vertex = slot * EDGE_VERTICES + step * 2;
          flowDistanceData[vertex] = start + edgeArcDistances[arcBase + step]!;
          flowDistanceData[vertex + 1] =
            start + edgeArcDistances[arcBase + step + 1]!;
        }
      });

      flowPositionBuffer.needsUpdate = true;
      flowDistanceBuffer.needsUpdate = true;
      flowGeometry.instanceCount = hanging.length * EDGE_SEGMENTS;

      // One path per *destination*: every second-level edge, plus every first-level
      // edge that does not continue into one. A dot that stopped at a child with
      // grandchildren below it would contradict the dashes running past it.
      let paths = 0;
      for (const { edge, level } of hanging) {
        if (level !== 0) continue;
        const onward = hanging.filter(
          (next) =>
            next.level === 1 &&
            edges[next.edge]!.sourceId === edges[edge]!.targetId,
        );
        if (onward.length === 0) {
          dotPaths[paths * 2] = edge;
          dotPaths[paths * 2 + 1] = -1;
          paths += 1;
          continue;
        }
        for (const next of onward) {
          dotPaths[paths * 2] = edge;
          dotPaths[paths * 2 + 1] = next.edge;
          paths += 1;
        }
      }
      dotMesh.count = paths;
      dotCount = paths;

      return hanging.length;
    }

    /**
     * Moves the dots. `elapsed * FLOW_SPEED` is a distance travelled in world units
     * - the same clock the dash offset runs on - wrapped by each path's own arc
     * length, so a dot with further to go takes longer to come round again and the
     * long paths drift out of step with the short ones on their own.
     */
    function stepDots(elapsed: number, fade: number) {
      if (dotCount === 0) return;
      const travelled = elapsed * FLOW_SPEED;

      for (let path = 0; path < dotCount; path += 1) {
        const first = dotPaths[path * 2]!;
        const second = dotPaths[path * 2 + 1]!;
        const firstLength = arcLength(first);
        const total = firstLength + (second < 0 ? 0 : arcLength(second));
        const along = total > 0 ? travelled % total : 0;
        const onFirst = second < 0 || along < firstLength;
        const leg = onFirst ? first : second;
        arcAtDistance(dotPoint, leg, onFirst ? along : along - firstLength);

        dummy.position.copy(dotPoint);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        dotMesh.setMatrixAt(path, dummy.matrix);

        // The colour of whatever it is currently heading for, so a dot that carries
        // on past a child changes into the grandchild's branch shade as it goes.
        const target = indexById.get(edges[leg]!.targetId);
        if (target !== undefined) {
          const base = target * 3;
          paintColour.setRGB(
            baseNodeColours[base]!,
            baseNodeColours[base + 1]!,
            baseNodeColours[base + 2]!,
          );
          dotMesh.setColorAt(path, paintColour);
        }
      }

      dotMesh.instanceMatrix.needsUpdate = true;
      if (dotMesh.instanceColor) dotMesh.instanceColor.needsUpdate = true;
      dotMaterial.opacity = fade;
    }

    /**
     * Marches the dashes, as one uniform: the shader adds `dashOffset` to every
     * vertex's stored distance before cutting the pattern out of it, so sliding the
     * whole flow along is a single number per frame rather than a buffer rewrite.
     */
    function stepFlow(elapsed: number, fade: number) {
      // Negative, so the pattern travels *away* from the parent. Wrapped to one
      // dash-plus-gap period: the pattern is identical either way, and an emphasis
      // held for an hour would otherwise hand the shader a float of four thousand
      // and ask it for a fraction of it.
      flowMaterial.dashOffset = -((elapsed * FLOW_SPEED) % DASH_PERIOD);
      flowMaterial.opacity = fade;
    }

    /**
     * Reduced motion gets neither the dashes nor the dim, rather than an instant
     * version of them: the thing being animated *is* the effect, so a zero-duration
     * version is a flash - the specific thing the setting asks for less of.
     */
    function startEmphasis(index: number) {
      if (prefersReducedMotion()) {
        releaseEmphasis();
        return;
      }
      // Whatever the dashes reach keeps its colour: the dim's job is to clear
      // everything else out of the way of exactly that.
      const lit = new Set<number>([index]);
      for (const { edge } of litEdgesFor(nodes[index]!)) {
        const reached = indexById.get(edges[edge]!.targetId);
        if (reached !== undefined) lit.add(reached);
      }

      const node = nodes[index]!;
      const glow = [{ index, strength: HALO_FOCUSED }];
      for (const edge of childEdges.get(node.id) ?? []) {
        glow.push({ index: edgeEnds[edge * 2 + 1]!, strength: HALO_CHILD });
      }
      const parentIndex =
        node.parentId === null ? undefined : indexById.get(node.parentId);
      if (parentIndex !== undefined) {
        glow.push({ index: parentIndex, strength: HALO_PARENT });
      }

      const now = performance.now();
      // Re-targeting from one node to another continues the dim from wherever it
      // is rather than restarting it: between two clicks the scene is already
      // down, and taking it up and straight back down is a flash, not a
      // transition. Only the dashes restart.
      emphasis = {
        dashStartedAt: now,
        startedAt: now - emphasisRamp * DIM_IN_MS,
        releasedAt: null,
        count: fillFlow(index),
        lit,
        index,
        glow,
      };
      flowLines.visible = emphasis.count > 0;
      dotMesh.visible = dotCount > 0;
      stepFlow(0, 0);
      stepDots(0, 0);
      paintDim();
      invalidate();
    }

    /**
     * Lets go: the dim fades back out and the dashes with it, over `DIM_OUT_MS`.
     * The teardown itself happens in `stepEmphasis`, so there is one place that
     * puts the scene back on its token colours.
     */
    function releaseEmphasis() {
      if (!emphasis || emphasis.releasedAt !== null) return;
      // Back-dated the same way, so letting go part-way through the fade *in*
      // fades out from there instead of jumping to fully dim first.
      emphasis.releasedAt = performance.now() - (1 - emphasisRamp) * DIM_OUT_MS;
      invalidate();
    }

    /**
     * Puts the halos on the emphasised family, every frame. Cheap - a dozen sprites
     * at most - and it has to run every frame anyway, because the focus bump scales
     * a node and a spring moves it, and a halo left behind either reads as a ring
     * drawn on the backdrop. Fades with the dim, so it arrives and leaves with the
     * rest of the emphasis rather than on its own clock.
     */
    function placeHalos() {
      const glow = emphasis && emphasisDim > 0 ? emphasis.glow : [];
      halos.forEach((sprite, slot) => {
        const entry = glow[slot];
        if (!entry) {
          sprite.visible = false;
          return;
        }
        const { index, strength } = entry;
        const base = index * 3;
        sprite.visible = true;
        livePosition(index, sprite.position);
        sprite.scale.setScalar(
          2 * nodes[index]!.radius * scales[index]! * HALO_SPREAD,
        );
        sprite.material.color.setRGB(
          baseNodeColours[base]!,
          baseNodeColours[base + 1]!,
          baseNodeColours[base + 2]!,
        );
        sprite.material.opacity = strength * emphasisDim;
      });
    }

    /**
     * Must not call `invalidate()`: it runs inside a frame, and scheduling from
     * there is the silent 60fps loop the `inFrame` guard exists to prevent. It
     * reports whether it still has work instead, and `renderFrame` schedules.
     */
    function stepEmphasis(now: number): boolean {
      if (!emphasis) return false;
      const { startedAt, releasedAt, count } = emphasis;

      const ramp =
        releasedAt === null
          ? Math.min(1, (now - startedAt) / DIM_IN_MS)
          : Math.max(0, 1 - (now - releasedAt) / DIM_OUT_MS);

      if (releasedAt !== null && ramp <= 0) {
        emphasis = null;
        emphasisRamp = 0;
        emphasisDim = 0;
        flowLines.visible = false;
        dotMesh.visible = false;
        paintDim();
        return false;
      }

      // Smoothstep, for the same reason the intro sweep has one: a linear fade in
      // and out reads as two corners rather than as the scene breathing.
      emphasisRamp = ramp;
      emphasisDim = ramp * ramp * (3 - 2 * ramp);
      if (count > 0) {
        const dashElapsed = now - emphasis.dashStartedAt;
        const fade =
          releasedAt === null
            ? Math.min(1, dashElapsed / DASH_FADE_MS)
            : Math.min(1, ramp);
        stepFlow(dashElapsed, fade);
        stepDots(dashElapsed, fade);
      }
      paintDim();

      // A held emphasis with no children under it is a still picture: the dim has
      // arrived and nothing else about it changes, so it must stop asking for
      // frames. The dashes are the only reason to keep going indefinitely.
      return count > 0 || releasedAt !== null || ramp < 1;
    }

    // ---- colour, re-read from the DOM on every theme change -------------------
    const colour = new Color();
    function applyTokens() {
      const current = tokensRef.current;
      const backdrop = current["--graph-space-near"];
      if (backdrop) {
        // Fog is the backdrop's colour *at the vanishing point* exactly - that is
        // where a node far enough away to be fogged sits on screen - so distant
        // nodes recede into the surface rather than into a haze of some other hue
        // (spec §7.4, R-11). Not the page colour any more: in dark mode the
        // gradient's middle is lighter than the page.
        fog.color.set(backdrop);
      }
      if (backdrop) backdropColour.set(backdrop);
      const edgeColour = current["--graph-edge"];
      if (edgeColour) baseEdgeColour.set(edgeColour);
      const floorColour = current["--graph-floor"];
      if (floorColour) floorMaterial.color.set(floorColour);
      const shadowColour = current["--graph-shadow"];
      if (shadowColour) shadowMaterial.color.set(shadowColour);

      nodes.forEach((node, index) => {
        // The token name, the tint and the turn were all decided once, at build
        // time, rather than re-derived per frame: the node already carries them.
        // They are applied here and not baked into tokens, because each is a step
        // *from* whatever the theme currently declares for that hue.
        const value = current[node.colourToken];
        if (!value) return;
        const family = node.colourTint > 0 || node.colourHueShift !== 0;
        colour.set(
          family && HEX.test(value)
            ? familyShade(
                value,
                node.colourTint,
                node.colourHueShift,
                TINT_CEILING,
              )
            : value,
        );
        baseNodeColours[index * 3] = colour.r;
        baseNodeColours[index * 3 + 1] = colour.g;
        baseNodeColours[index * 3 + 2] = colour.b;
      });
      // The tokens are what the scene is drawn *from*; what it is drawn *as* is
      // whatever the emphasis currently says, so a theme change mid-animation
      // repaints through it rather than over it.
      paintDim();
    }
    applyTokensRef.current = applyTokens;
    applyTokens();

    // ---- the render-on-demand loop --------------------------------------------
    let frame = 0;
    let lastFrameAt = 0;
    let lastLabelsAt = 0;
    let disposed = false;

    type CameraTween = {
      startedAt: number;
      tween: ReturnType<typeof createTween>;
      fromPosition: Vector3;
      toPosition: Vector3;
      fromTarget: Vector3;
      toTarget: Vector3;
    };
    let cameraTween: CameraTween | null = null;

    /**
     * Schedules exactly one frame. The `inFrame` guard is load-bearing:
     * `controls.update()` dispatches "change" when it moves the camera, and the
     * listener below turns that into an `invalidate()`. Without the guard every
     * rendered frame schedules the next one and the scene runs at 60fps forever on
     * a page nobody is touching - which is the whole cost render-on-demand exists
     * to avoid, and it is invisible unless you count frames.
     */
    let inFrame = false;
    function invalidate() {
      if (disposed || frame || inFrame) return;
      frame = requestAnimationFrame(renderFrame);
    }
    invalidateRef.current = invalidate;

    /**
     * The one animation allowed to schedule from inside a frame, and only because
     * it does not do it directly: it waits on display refreshes, which land outside
     * this one, and draws on the first that is due. Everything else goes through
     * the block at the end of `renderFrame`.
     *
     * It draws from inside the refresh callback rather than calling `invalidate()`
     * there, because `invalidate()` would ask for yet another refresh and the frame
     * would land one late every time - on a 60Hz screen, every other refresh.
     */
    let emphasisPace = 0;
    function paceEmphasisFrame() {
      if (emphasisPace) return;
      const tick = (now: number) => {
        emphasisPace = 0;
        // A frame is already on its way - something else invalidated - and it
        // re-paces when it has drawn.
        if (disposed || frame) return;
        if (now - lastFrameAt < EMPHASIS_FRAME_MS - EMPHASIS_FRAME_SLACK_MS) {
          emphasisPace = requestAnimationFrame(tick);
          return;
        }
        renderFrame(now);
      };
      emphasisPace = requestAnimationFrame(tick);
    }

    function stepScales(deltaMs: number): boolean {
      if (animatingScales.size === 0) return false;
      const step = deltaMs / Math.max(1, tweenDuration(SCALE_MS));

      for (const index of [...animatingScales]) {
        const target = scaleTargets[index]!;
        const current = scales[index]!;
        const next =
          step >= 1 || Math.abs(target - current) <= 0.001
            ? target
            : current +
              Math.sign(target - current) *
                Math.min(step, Math.abs(target - current));

        scales[index] = next;
        writeMatrix(index);
        if (next === target) animatingScales.delete(index);
      }
      nodeMesh.instanceMatrix.needsUpdate = true;
      return animatingScales.size > 0;
    }

    /**
     * Advances every moving spring and redraws what hangs off the nodes it moved:
     * their instance matrices, floor marks and stems, and the arcs of every edge
     * touching them. The dragged node itself is not integrated - it is wherever the
     * pointer put it - but it is still redrawn, which is why it sits in `springing`
     * for as long as it is held.
     *
     * Must not call `invalidate()`, for the reason `stepEmphasis` gives; it reports
     * whether anything is still moving and `renderFrame` schedules.
     */
    function stepSprings(deltaMs: number): boolean {
      if (springing.size === 0) return false;
      const touched = new Set<number>();
      let stems = false;

      for (const index of [...springing]) {
          const held = drag?.active === true && drag.index === index;
        const settled = held ? false : stepSpring(springs, index, deltaMs);
        writeMatrix(index);
        writeShadow(index);
        stems = writeStem(index) || stems;
        for (const edge of edgesOfNode.get(index) ?? []) touched.add(edge);
        // A held node is drawn once per pointer move, which re-adds it - so a
        // pointer holding still asks for no frames, only its trailing children do.
        if (settled || held) springing.delete(index);
      }

      for (const edge of touched) buildEdge(edge);
      edgePositions.needsUpdate = true;
      nodeMesh.instanceMatrix.needsUpdate = true;
      // Raycasting and culling both test the mesh's bounding sphere before its
      // instances, and it was computed from the layout. Dropped here, three
      // recomputes it on the next test - a pass over ~150 matrices.
      nodeMesh.boundingSphere = null;
      shadowMesh.instanceMatrix.needsUpdate = true;
      if (stems) floorPositions.needsUpdate = true;
      // The dashes are a copy of the edge chords taken at click time, so a moved
      // edge would leave its dashes floating where it used to be.
      if (emphasis && emphasis.count > 0) fillFlow(emphasis.index);

      return springing.size > 0;
    }

    /**
     * `controls.minDistance` is measured from the orbit target, and the target moves
     * to the clicked node on focus - so on its own it stops guaranteeing anything
     * about the hub as soon as a viewer has flown into a branch, which is exactly
     * the state using the feature puts them in. This is the origin-relative half of
     * FR-6: wherever the target is, the camera stays outside the ring.
     *
     * It is a backstop, not the mechanism: `fenceDistance` folds the same bound into
     * the overview solve, so a framed camera is already outside and this never has to
     * move it - which matters, because moving it here would silently undo the
     * framing. What is left for it is the viewer dollying in by hand.
     *
     * It must not call `invalidate()`. It runs inside a frame, and scheduling from
     * there is the silent 60fps loop the `inFrame` guard exists to prevent.
     */
    function keepOutsideRing() {
      const distance = camera.position.length();
      if (distance >= MIN_ORBIT_DISTANCE) return;
      if (distance === 0) {
        // Unreachable in practice, but scaling a zero-length vector is a NaN
        // camera and a blank canvas, so it is handled rather than trusted.
        camera.position.set(0, MIN_ORBIT_DISTANCE, 0);
        return;
      }
      camera.position.multiplyScalar(MIN_ORBIT_DISTANCE / distance);
    }

    /**
     * The opening sweep. It only ever rotates the *starting* position back onto
     * where the camera was going to be anyway, so the view it lands on is the one
     * `overviewDistance` framed. Cancelled - not reversed - the moment the viewer
     * touches the canvas or a fly-to takes the camera, because two things moving
     * the camera at once is a fight the viewer loses.
     */
    let introStartedAt: number | null = null;
    /**
     * The camera's *offset from the orbit target* at the end of the sweep, not its
     * position. The overview target is no longer the origin, so a sweep written in
     * world positions would rotate the camera around the hub while the controls
     * orbit it around somewhere else, and the two would disagree the moment the
     * viewer took over mid-sweep.
     */
    const introBase = new Vector3();
    /**
     * The sweep starts from a different azimuth, and the graph is wide enough that
     * the distance which frames it from one angle crops it from another - so the
     * distance is fitted at both ends and interpolated, rather than carried over.
     * Both ends are fitted against the *same* target: the sweep turns the camera,
     * it does not re-centre the graph underneath it.
     */
    let introFromDistance = 0;
    let introToDistance = 0;

    function stopIntro() {
      introStartedAt = null;
    }

    function stepIntro(now: number): boolean {
      if (introStartedAt === null) return false;
      const t = Math.min(1, (now - introStartedAt) / INTRO_MS);
      // Smoothstep: the sweep has to start and end at a standstill, or the load
      // reads as a jerk rather than as the scene settling.
      const eased = t * t * (3 - 2 * t);
      // Rotate and re-length the *offset*, then put it back on the target: that is
      // an azimuth orbit about what the camera is looking at, which is what
      // `OrbitControls` would have done with the same drag.
      camera.position
        .copy(introBase)
        .applyAxisAngle(WORLD_UP, INTRO_SWEEP * (eased - 1))
        .setLength(
          introFromDistance + (introToDistance - introFromDistance) * eased,
        )
        .add(controls.target);
      if (t >= 1) introStartedAt = null;
      return introStartedAt !== null;
    }

    function stepCamera(now: number): boolean {
      if (!cameraTween) return false;
      const { progress, done } = cameraTween.tween.sample(
        now - cameraTween.startedAt,
      );
      camera.position.lerpVectors(
        cameraTween.fromPosition,
        cameraTween.toPosition,
        progress,
      );
      controls.target.lerpVectors(
        cameraTween.fromTarget,
        cameraTween.toTarget,
        progress,
      );
      if (done) cameraTween = null;
      return !done;
    }

    /**
     * Which nodes hold a label. Frozen for the duration of a camera move and
     * re-solved when it lands.
     *
     * `selectLabelled` ranks by distance to the camera, and mid-flight that ranking
     * is both meaningless - the viewer is going somewhere, not standing where the
     * ranking is computed - and unstable, reordering every frame. Re-solving it
     * while the camera moves is what puts labels in and out of the pool dozens of
     * times over a 600ms fly-to. Membership is frozen; positions and opacity are
     * still solved every frame, so the labels that are up stay glued to their
     * circles.
     */
    let frozenSelection: GraphSceneNode[] | null = null;

    function updateLabels(
      now: number,
      viewDistance: number,
      cameraMoving: boolean,
    ) {
      // The throttle exists to keep the label layer off the critical path while the
      // scene is idle. During a camera move it is the thing that makes the labels
      // swim: the canvas is drawn at 60fps and the text up to 33ms behind it, so
      // every label visibly slides off its circle and snaps back.
      if (!cameraMoving && now - lastLabelsAt < LABEL_INTERVAL_MS) return;
      lastLabelsAt = now;

      const handle = labelsRef.current;

      const cameraPosition = [
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ] as const;
      const near = viewDistance * LABEL_NEAR;
      const far = viewDistance * LABEL_FAR;
      const { clientWidth: width, clientHeight: height } = container!;
      const projected = new Vector3();

      placeCard(height, width, projected);

      if (!handle) return;
      if (!cameraMoving) frozenSelection = null;
      const selected =
        frozenSelection ??
        selectLabelled(nodes, cameraPosition, focusedIdRef.current);
      if (cameraMoving) frozenSelection = selected;

      handle.apply(
        declutter(
          selected.map((node) => {
            livePosition(indexById.get(node.id)!, projected);
            const distance = projected.distanceTo(camera.position);
            // The radius as *drawn*: the focus bump scales the mesh,
            // and a base-radius offset would let a hovered circle grow into its
            // own label (spec FR-2).
            const drawnRadius = node.radius * scales[indexById.get(node.id)!]!;
            const offset = labelOffsetPx(
              drawnRadius,
              distance,
              height,
              CAMERA_FOV,
            );
            projected.project(camera);

            const behindCamera = projected.z > 1;
            // The hub's name is exempt from the distance fade - it is the label a
            // viewer takes their bearings from, and a hub whose name dissolves as
            // you back away is a dot with a caption again (spec FR-1). Only
            // the fade is exempt: a hub genuinely behind the camera still goes,
            // or its name would float over whatever is in front of it.
            const isRoot = node.parentId === null;
            const opacity = behindCamera
              ? 0
              : isRoot
                ? 1
                : Math.min(1, Math.max(0, (far - distance) / (far - near)));

            return {
              id: node.id,
              text: node.name,
              x: ((projected.x + 1) / 2) * width,
              y: ((1 - projected.y) / 2) * height + offset,
              opacity,
            };
          }),
        ),
      );
    }

    /**
     * The open card's one node, projected the same way a label's is and handed to
     * the card as an anchor. At most one node per frame, and only while a card is
     * open (spec §8): the card layer costs nothing when nothing is open.
     *
     * It rides inside `updateLabels()` deliberately - same throttle, same exemption
     * from it while the camera is moving - so the card tracks its node exactly as
     * tightly as a label does through a fly-to, an orbit, or the damping tail after
     * a long-press (FR-9).
     */
    function placeCard(height: number, width: number, projected: Vector3) {
      if (cardNodeIndex === null) return;
      const node = nodes[cardNodeIndex]!;

      livePosition(cardNodeIndex, projected);
      const distance = projected.distanceTo(camera.position);
      // The same "radius as drawn" a label offsets by, so the card clears the
      // circle at any zoom and under the focus bump.
      const gapPx = labelOffsetPx(
        node.radius * scales[cardNodeIndex]!,
        distance,
        height,
        CAMERA_FOV,
      );
      projected.project(camera);

      // Projecting a point behind the camera mirrors it, which would throw the card
      // to the opposite side of the screen mid-orbit rather than leave it behind.
      if (projected.z > 1) {
        closeCard();
        return;
      }

      const anchor: CardAnchor = {
        nodeX: ((projected.x + 1) / 2) * width,
        nodeY: ((1 - projected.y) / 2) * height,
        gapPx,
        containerWidth: width,
        containerHeight: height,
      };
      cardRef.current?.place(anchor);
    }

    function renderFrame(now: number) {
      frame = 0;
      if (disposed) return;

      const deltaMs = lastFrameAt ? now - lastFrameAt : 16;
      lastFrameAt = now;

      inFrame = true;
      const introMoving = stepIntro(now);
      const cameraMoving = stepCamera(now);
      const scalesMoving = stepScales(deltaMs);
      // Before the emphasis, so the dots are placed on arcs that have already moved.
      const springsMoving = stepSprings(deltaMs);
      const emphasisMoving = stepEmphasis(now);
      placeHalos();
      // Returns true while damping is still settling.
      const dampingMoving = controls.update();
      keepOutsideRing();

      // Only the direction matters for a directional light, so this is a position
      // relative to the target, not a place in the world.
      keyLight.position
        .copy(camera.position)
        .sub(controls.target)
        .normalize()
        .addScaledVector(WORLD_UP, 0.85)
        .add(KEY_OFFSET)
        .add(controls.target);
      keyLight.target.position.copy(controls.target);
      keyLight.target.updateMatrixWorld();

      const viewDistance = camera.position.distanceTo(controls.target);
      fog.near = viewDistance * FOG_NEAR;
      fog.far = viewDistance * FOG_FAR;

      renderer.render(world, camera);
      // The intro sweep counts: it moves the camera the same way a fly-to does, and
      // re-ranking the pool under it churns the labels just as badly.
      // So do the springs: a label a throttled frame behind a node being dragged
      // slides off its circle exactly as it does behind a flying camera.
      updateLabels(
        now,
        viewDistance,
        cameraMoving || introMoving || springsMoving,
      );
      inFrame = false;

      // The only place the next frame is scheduled: whether one is needed is a
      // question about the animations, not about how many events fired.
      if (
        introMoving ||
        cameraMoving ||
        scalesMoving ||
        springsMoving ||
        dampingMoving
      ) {
        invalidate();
      } else if (emphasisMoving) {
        // The dashes, alone, and they hold indefinitely: paced rather than run
        // flat out. See EMPHASIS_FRAME_MS.
        paceEmphasisFrame();
      }
    }

    /** Half-width and half-height of the frustum one world unit ahead of the camera. */
    function frameTangents(): { tanH: number; tanV: number } {
      const { clientWidth: width, clientHeight: height } = container!;
      const aspect = width && height ? width / height : 1;
      const tanV = Math.tan((CAMERA_FOV * Math.PI) / 360);
      return { tanV, tanH: tanV * aspect };
    }

    /**
     * The camera's own axes for a given unit orbit `direction`: `forward` points
     * from the camera at what it is looking at, `right` and `up` span the screen.
     */
    function viewBasis(direction: Vector3) {
      const forward = direction.clone().negate();
      const right = new Vector3().crossVectors(forward, WORLD_UP);
      // The polar fence rules out a view straight down the up axis, so this is
      // only ever degenerate if the fence is removed.
      if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
      right.normalize();
      const up = new Vector3().crossVectors(right, forward).normalize();
      return { forward, right, up };
    }

    /**
     * The smallest target-relative distance at which the camera is still outside the
     * ring, looking from a unit `direction` at `target`.
     *
     * `controls.minDistance` is measured from the target and `keepOutsideRing` from
     * the origin. While the overview target *was* the origin those were the same
     * number; with the target off-centre they are not - a camera a legal 23 from a
     * target 8 off-centre can sit 15 from the hub, and `keepOutsideRing` would then
     * shove it back every frame, off the framing this solve just found. So the fence
     * has to be part of the solve rather than a correction applied after it.
     *
     * Solves `|target + d * direction| = MIN_ORBIT_DISTANCE` for the larger root.
     */
    function fenceDistance(direction: Vector3, target: Vector3): number {
      const along = target.dot(direction);
      const discriminant =
        along * along -
        target.lengthSq() +
        MIN_ORBIT_DISTANCE * MIN_ORBIT_DISTANCE;
      // No root: the line of sight never enters the fence at all, so every distance
      // on it is legal and the fit is free to use its own.
      if (discriminant <= 0) return 0;
      return -along + Math.sqrt(discriminant);
    }

    /**
     * How far back the camera has to sit from `target`, looking from a unit
     * `direction`, for the whole graph to fit the frame.
     *
     * Solved against the actual node positions rather than the bounding sphere,
     * because the graph is far wider than it is tall: a sphere fit frames mostly
     * empty space. And solved per axis, because `PerspectiveCamera`'s fov is the
     * *vertical* one - on a portrait tablet the horizontal extent is what binds,
     * and a fixed multiple of the scene radius crops the sides. The spec assumed
     * distance alone was enough at any screen size (§3 Q5, §9.4); it is not, and
     * this is what makes V-10's tablet check pass rather than be waived.
     */
    function fitDistance(direction: Vector3, target: Vector3): number {
      const { tanH, tanV } = frameTangents();
      const { forward, right, up } = viewBasis(direction);

      const point = new Vector3();
      let distance = MIN_ORBIT_DISTANCE;
      for (const node of nodes) {
        // Relative to the target, which is what the fov opens out from - the
        // offset target is the whole point of the change.
        point.set(...node.position).sub(target);
        // Behind the target counts as negative depth, which correctly *reduces*
        // the distance a near node needs.
        const depth = point.dot(forward);
        distance = Math.max(
          distance,
          (Math.abs(point.dot(right)) + node.radius) / tanH - depth,
          (Math.abs(point.dot(up)) + node.radius) / tanV - depth,
        );
      }
      return Math.max(
        distance * OVERVIEW_MARGIN,
        fenceDistance(direction, target),
      );
    }

    /**
     * Where the overview camera looks, and from how far.
     *
     * The target is not the hub. The hub is at the origin, but the content is not
     * centred on it: the ring splits its azimuth evenly on purpose while the
     * branches hanging off it differ wildly in weight, so from any angle the mass
     * sits to one side of the middle. Framing symmetrically about the origin -
     * which is what `fitDistance` taking `Math.abs` of each screen offset amounts
     * to - reserves as much room on the empty side as the heaviest branch needs on
     * the full one. Measured on the day-one seed at 1728x900, that reserved room is
     * a third of the frame: the graph spanned NDC y [-0.91, 0.40] and filled 41% of
     * the viewport. It is why the opening view led with an empty top third.
     *
     * Target and distance are solved *together*, by iteration, because each depends
     * on the other. Centring the bounding box in world units does not centre it on
     * screen - perspective divides by depth, so the far half of the graph projects
     * smaller than the near half and a world-centred box still lands low. Centring
     * it in NDC instead needs a distance, and the distance that frames it depends on
     * where the target is. So: fit, measure the NDC box, move the target by its
     * centre, refit. Three passes is convergence to two decimal places on both the
     * day-one seed and the 148-node envelope - the second pass already moves the
     * target by under 5% - and the loop is a few hundred dot products that runs on
     * load, on resize-free re-framing and on Escape, never per frame.
     *
     * Measured after: NDC y [-0.76, 0.74], 67% of the viewport, at a distance of
     * 39.5 rather than 49.3.
     */
    function overviewFraming(direction: Vector3): {
      target: Vector3;
      distance: number;
    } {
      // Every solver here is written against a unit direction; `showOverview` hands
      // in the raw camera-to-target vector.
      const unit = direction.clone().normalize();
      const { forward, right, up } = viewBasis(unit);
      const { tanH, tanV } = frameTangents();

      const target = new Vector3();
      let distance = fitDistance(unit, target);
      const point = new Vector3();

      for (let pass = 0; pass < OVERVIEW_CENTRING_PASSES; pass += 1) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const node of nodes) {
          point.set(...node.position).sub(target);
          // `fitDistance` has just guaranteed every node clears the near plane, so
          // this is never zero or behind the camera.
          const depth = distance + point.dot(forward);
          const halfX = node.radius / (depth * tanH);
          const halfY = node.radius / (depth * tanV);
          const across = point.dot(right) / (depth * tanH);
          const along = point.dot(up) / (depth * tanV);
          minX = Math.min(minX, across - halfX);
          maxX = Math.max(maxX, across + halfX);
          minY = Math.min(minY, along - halfY);
          maxY = Math.max(maxY, along + halfY);
        }

        // The box's centre, in NDC, put back into world units at the depth the
        // target itself sits at - which is `distance`, by definition.
        target
          .addScaledVector(right, ((minX + maxX) / 2) * tanH * distance)
          .addScaledVector(up, ((minY + maxY) / 2) * tanV * distance);
        distance = fitDistance(unit, target);
      }

      return { target, distance };
    }

    // ---- camera framing --------------------------------------------------------
    function flyTo(position: Vector3, distance: number) {
      const direction = camera.position
        .clone()
        .sub(controls.target)
        .normalize();
      // Keeps the viewer's current orientation and only changes what is centred -
      // a fly-to that also spins the graph loses them.
      if (direction.lengthSq() === 0) direction.set(0, 0.35, 1).normalize();

      stopIntro();
      cameraTween = {
        startedAt: performance.now(),
        tween: createTween(),
        fromPosition: camera.position.clone(),
        toPosition: position.clone().add(direction.multiplyScalar(distance)),
        fromTarget: controls.target.clone(),
        toTarget: position.clone(),
      };
      invalidate();
    }

    function focusNode(index: number) {
      const node = nodes[index]!;
      const centre = new Vector3(...node.position);

      // Frame the node, its children *and* what it hangs off (spec FR-9): a cluster
      // whose top you cannot see does not tell you where you are in the tree. The
      // root has no parent, so clicking the hub keeps the framing it always had.
      const framed = nodes.filter((child) => child.parentId === node.id);
      const parentIndex =
        node.parentId === null ? undefined : indexById.get(node.parentId);
      if (parentIndex !== undefined) framed.push(nodes[parentIndex]!);

      let extent = node.radius * 4;
      for (const relative of framed) {
        extent = Math.max(
          extent,
          centre.distanceTo(new Vector3(...relative.position)) +
            relative.radius * 2,
        );
      }
      const distance = extent / Math.sin((CAMERA_FOV * Math.PI) / 360);

      markFocused(index);
      flyTo(centre, distance);
    }

    /**
     * Everything focusing a node does except move the camera. Split out so a view
     * restored on Back can put the focus back exactly where the camera already is,
     * without flying anywhere.
     */
    function markFocused(index: number) {
      const node = nodes[index]!;
      const previous = focusedIdRef.current;
      if (previous !== null && previous !== node.id) {
        const previousIndex = indexById.get(previous);
        if (previousIndex !== undefined) setScaleTarget(previousIndex, 1);
      }
      setFocusedId(node.id);
      focusedIdRef.current = node.id;
      setScaleTarget(index, FOCUS_SCALE);
      startEmphasis(index);
    }

    function showOverview() {
      const previous = focusedIdRef.current;
      if (previous !== null) {
        const index = indexById.get(previous);
        if (index !== undefined) setScaleTarget(index, 1);
      }
      setFocusedId(null);
      focusedIdRef.current = null;
      releaseEmphasis();
      const direction = camera.position.clone().sub(controls.target);
      if (direction.lengthSq() === 0) direction.copy(openingDirection);
      const { target, distance } = overviewFraming(direction);
      flyTo(target, distance);
    }

    function setScaleTarget(index: number, target: number) {
      if (scaleTargets[index] === target) return;
      scaleTargets[index] = target;
      animatingScales.add(index);
      invalidate();
    }

    // ---- picking ---------------------------------------------------------------
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    let hoveredIndex: number | null = null;
    /** `hoveredIndex` while the pointer is over the open card rather than a node. */
    const OVER_CARD = -1;
    let pressedAt: { x: number; y: number } | null = null;
    /** Which node's card is open, if any. Read by `placeCard` every frame. */
    let cardNodeIndex: number | null = null;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    /**
     * Set only by a long-press that actually fired, and cleared unconditionally on
     * the next press as well as when it is read. If it ever stuck, every subsequent
     * click would stop focusing the camera - the graph's primary interaction - and
     * it would do it silently.
     */
    let longPressConsumed = false;
    /** A desktop card's pending close, `CARD_CLOSE_GRACE_MS` after its node was left. */
    let cardCloseTimer: ReturnType<typeof setTimeout> | null = null;
    /**
     * The pointer is on the card's link. A flag, not just a cancelled timer: React
     * derives the link's `onPointerEnter` from the `pointerout` that fires *before*
     * the canvas's own `pointerleave`, so the hold arrives first and the leave would
     * otherwise schedule a fresh close straight after it. Measured: without this the
     * card closed 200ms after the pointer came to rest on the link.
     */
    let cardHeld = false;

    /**
     * A press that landed on a node. It is only a drag once it has moved past
     * `CLICK_SLOP_PX` (`active`); until then it is still a click, a long-press or
     * the start of nothing, and every one of those keeps working as it did.
     *
     * The node moves on a plane through where it was grabbed, facing the camera,
     * so it stays under the pointer at the depth it started at rather than sliding
     * off along the view axis.
     */
    type Drag = {
      index: number;
      pointerId: number;
      active: boolean;
      plane: Plane;
      grab: Vector3;
      /** Everything below the dragged node, with how much of the pull it follows. */
      followers: { index: number; gain: number }[];
    };
    let drag: Drag | null = null;
    const dragHit = new Vector3();
    const dragNormal = new Vector3();

    function followersOf(index: number): Drag["followers"] {
      const followers: Drag["followers"] = [];
      let generation = [index];
      let gain = 1;
      while (generation.length > 0) {
        gain *= DRAG_FOLLOW;
        const next: number[] = [];
        for (const parent of generation) {
          for (const edge of childEdges.get(nodes[parent]!.id) ?? []) {
            const child = edgeEnds[edge * 2 + 1]!;
            followers.push({ index: child, gain });
            next.push(child);
          }
        }
        generation = next;
      }
      return followers;
    }

    /**
     * Pulls the dragged node to under the pointer, through the rubber band, and
     * points every follower's spring at its share of the same offset.
     */
    function dragTo(event: PointerEvent) {
      if (!drag) return;
      aim(event);
      if (!raycaster.ray.intersectPlane(drag.plane, dragHit)) return;
      dragHit.sub(drag.grab);
      const pulled = dragHit.length();
      if (pulled > 0) dragHit.multiplyScalar(rubberBand(pulled) / pulled);

      const base = drag.index * 3;
      springs.offsets[base] = springs.targets[base] = dragHit.x;
      springs.offsets[base + 1] = springs.targets[base + 1] = dragHit.y;
      springs.offsets[base + 2] = springs.targets[base + 2] = dragHit.z;
      springs.velocities.fill(0, base, base + 3);
      springing.add(drag.index);

      for (const { index, gain } of drag.followers) {
        const at = index * 3;
        springs.targets[at] = dragHit.x * gain;
        springs.targets[at + 1] = dragHit.y * gain;
        springs.targets[at + 2] = dragHit.z * gain;
        springing.add(index);
      }
      invalidate();
    }

    /**
     * Lets go: every spring the drag touched is pointed back at the layout. Under
     * reduced motion they are put straight back instead of swinging there - the
     * drag itself is direct manipulation and stays, the overshoot is animation.
     */
    function endDrag() {
      if (!drag) return;
      const { index, pointerId, active, followers } = drag;
      drag = null;
      controls.enabled = true;
      if (canvas.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId);
      }
      if (!active) return;

      const snap = prefersReducedMotion();
      for (const moved of [index, ...followers.map((entry) => entry.index)]) {
        const at = moved * 3;
        springs.targets.fill(0, at, at + 3);
        if (snap) {
          springs.offsets.fill(0, at, at + 3);
          springs.velocities.fill(0, at, at + 3);
        }
        springing.add(moved);
      }
      canvas.style.cursor = "grab";
      invalidate();
    }

    function openCard(index: number) {
      const node = nodes[index]!;
      cardNodeIndex = index;
      cardRef.current?.show({
        name: node.name,
        assignee: node.assignee,
        status: node.status,
        // The hub has no page - `/graph` is its page - so its card is its name.
        href: node.parentId === null ? null : nodeHref(node.id),
      });
      // `updateLabels` early-returns wholesale when throttled. On an idle page the
      // `invalidate()` below is the only frame that will ever run, so if one
      // happened to render less than LABEL_INTERVAL_MS ago its pass would return
      // before placing the card - and the card would sit unplaced for good. Forcing
      // the throttle open is what makes this a card that always appears rather than
      // one that appears nineteen times in twenty.
      lastLabelsAt = 0;
      invalidate();
    }

    function closeCard() {
      cancelScheduledClose();
      // A card that goes away takes its link with it, and a removed element never
      // reports the pointer leaving it.
      cardHeld = false;
      if (cardNodeIndex === null) return;
      cardNodeIndex = null;
      cardRef.current?.hide();
    }

    /** Close after the grace period, unless something holds the card open first. */
    function scheduleCloseCard() {
      if (cardNodeIndex === null || cardHeld || cardCloseTimer !== null) return;
      cardCloseTimer = setTimeout(() => {
        cardCloseTimer = null;
        if (disposed) return;
        closeCard();
      }, CARD_CLOSE_GRACE_MS);
    }

    function cancelScheduledClose() {
      if (cardCloseTimer === null) return;
      clearTimeout(cardCloseTimer);
      cardCloseTimer = null;
    }

    /**
     * The view to come back to, saved as "Open page" is clicked and before Next
     * navigates away and this effect tears down (FR-2).
     */
    function saveView() {
      useGraphViewStore.getState().save({
        position: camera.position.toArray(),
        target: controls.target.toArray(),
        focusedId: focusedIdRef.current,
      });
    }

    cardLinkRef.current = {
      hold: () => {
        cardHeld = true;
        cancelScheduledClose();
      },
      release: () => {
        cardHeld = false;
        scheduleCloseCard();
      },
      navigate: saveView,
    };

    function cancelLongPress() {
      if (longPressTimer === null) return;
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    /** The canvas fills the container, so its local pixels are the card's too. */
    function overCard(event: PointerEvent): boolean {
      if (cardNodeIndex === null || !cardRef.current) return false;
      const rect = canvas.getBoundingClientRect();
      return cardRef.current.contains(
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
    }

    /** Points the raycaster from the camera through the pointer. */
    function aim(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
    }

    function pick(event: PointerEvent): number | null {
      aim(event);
      const hit = raycaster.intersectObject(nodeMesh, false)[0];
      return hit?.instanceId ?? null;
    }

    function onPointerMove(event: PointerEvent) {
      if (drag && event.pointerId === drag.pointerId) {
        if (
          !drag.active &&
          pressedAt &&
          Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) >
            CLICK_SLOP_PX
        ) {
          // It is a drag now, so it is no longer a long-press or a hover.
          drag.active = true;
          cancelLongPress();
          closeCard();
          canvas.style.cursor = "grabbing";
        }
        if (drag.active) {
          dragTo(event);
          return;
        }
      }

      // Over the open card, with no button down: the card is see-through to pointer
      // events, so this move reaches the canvas as if the pointer were over empty
      // space - and would close the card as it is being read, or swap it for a node
      // drawn behind it. The card wins until the pointer leaves it. A press still
      // goes straight through to the canvas and orbits (FR-4).
      if (
        event.pointerType !== "touch" &&
        pressedAt === null &&
        overCard(event)
      ) {
        cancelScheduledClose();
        // Not a node index: it only guarantees the next move off the card differs
        // from this one, so the cursor is set again when the pointer leaves.
        hoveredIndex = OVER_CARD;
        canvas.style.cursor = "default";
        return;
      }

      // Hover only changes the cursor and raises the card: the circle keeps its
      // size, so size stays the answer to "is this a group" alone (FR-10).
      const index = pick(event);
      if (index !== hoveredIndex) {
        hoveredIndex = index;
        canvas.style.cursor = index === null ? "grab" : "pointer";
      }

      if (event.pointerType === "touch") {
        // A finger does not hover. Its card comes from the long-press below, and
        // the only thing a move does here is decide the press was a drag.
        if (
          pressedAt &&
          Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) >
            CLICK_SLOP_PX
        ) {
          cancelLongPress();
        }
        return;
      }

      // *Idle* hover, the narrower notion this feature turns on: over a node, with
      // no button down. A button down may already be an orbit drag, and a card
      // appearing in the middle of one is an interruption, not a hint (FR-11).
      if (index !== null && pressedAt === null) {
        cancelScheduledClose();
        if (index !== cardNodeIndex) openCard(index);
      } else if (pressedAt !== null) {
        closeCard();
      } else {
        // Off the node but not dragging: the pointer may be on its way to the
        // card's link, so the card gets a moment rather than vanishing.
        scheduleCloseCard();
      }
    }

    /**
     * Registered in the capture phase, so on the canvas itself it runs before
     * OrbitControls' own `pointerdown`: a press on a node disables the controls
     * before they can start an orbit from it. A press on empty space - or on the
     * hub, which stays the handle for spinning the whole graph - never gets here
     * past the pick, and orbits exactly as before.
     */
    function onPointerDownCapture(event: PointerEvent) {
      if (!event.isPrimary) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const index = pick(event);
      if (index === null || nodes[index]!.parentId === null) return;

      const live = livePosition(index, new Vector3());
      // The point on the sphere that was actually pressed, so the node does not
      // jump to centre itself under the pointer on the first move.
      const at =
        raycaster.ray.intersectSphere(
          new Sphere(live, nodes[index]!.radius * scales[index]!),
          new Vector3(),
        ) ?? live.clone();
      camera.getWorldDirection(dragNormal);
      // Less the offset the node already has, so grabbing one that is still
      // swinging back picks it up where it is rather than snapping it to rest.
      const offset = live.sub(new Vector3(...nodes[index]!.position));
      drag = {
        index,
        pointerId: event.pointerId,
        active: false,
        plane: new Plane().setFromNormalAndCoplanarPoint(dragNormal, at),
        grab: at.clone().sub(offset),
        followers: followersOf(index),
      };
      controls.enabled = false;
      canvas.setPointerCapture(event.pointerId);
    }

    function onPointerDown(event: PointerEvent) {
      stopIntro();
      pressedAt = { x: event.clientX, y: event.clientY };
      longPressConsumed = false;

      if (event.pointerType !== "touch") {
        // Idle hover has ended, whatever happens next (FR-11).
        closeCard();
        return;
      }

      const index = pick(event);
      if (index === null) return;
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        if (disposed) return;
        longPressConsumed = true;
        openCard(index);
      }, LONG_PRESS_MS);
    }

    function onPointerUp(event: PointerEvent) {
      if (drag && event.pointerId === drag.pointerId) endDrag();
      const pressed = pressedAt;
      pressedAt = null;
      cancelLongPress();
      const consumed = longPressConsumed;
      longPressConsumed = false;
      if (!pressed) return;
      // An orbit drag ends on the canvas too; only a near-stationary release is a
      // click.
      if (
        Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) >
        CLICK_SLOP_PX
      ) {
        return;
      }

      // A long-press has already opened the card. It does not *also* fly the
      // camera - that would be two things happening for one gesture (FR-7).
      if (consumed) return;
      // Any tap closes an open card, whether it lands on empty space, another node
      // or the same one again (FR-8); what it then does is unchanged.
      if (event.pointerType === "touch") closeCard();

      const index = pick(event);
      // Clicking empty space returns to the overview - without it, a viewer who
      // flew into a leaf four levels deep has no way back except reloading (D-7).
      if (index === null) showOverview();
      else focusNode(index);
    }

    /**
     * There is no `pointerleave` on this canvas otherwise, so nothing clears the
     * hover when the pointer exits it - and an open card would stay up over the
     * page chrome after the pointer had gone (FR-6).
     *
     * The close is deferred by `CARD_CLOSE_GRACE_MS`, so a pointer that has gone to
     * the page chrome still takes the card with it, just not instantly.
     *
     * `pressedAt` is deliberately left alone: a drag that runs off the canvas and
     * back is still that drag, and clearing it here would change click handling
     * this feature has no business changing.
     */
    function onPointerLeave() {
      hoveredIndex = null;
      canvas.style.cursor = "grab";
      cancelLongPress();
      // Scheduled, not immediate: moving onto the card's link leaves the canvas too,
      // and the link's own `pointerenter` is what cancels this.
      scheduleCloseCard();
    }

    /** A cancelled touch leaves a timer that would otherwise fire over nothing. */
    function onPointerCancel() {
      endDrag();
      pressedAt = null;
      longPressConsumed = false;
      cancelLongPress();
    }

    /**
     * The platform's own long-press callout, competing with ours. `touchAction:
     * none` is the first line of defence and does not reliably suppress this one on
     * every mobile browser (spec §9.2).
     */
    function onContextMenu(event: Event) {
      event.preventDefault();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") showOverview();
    }

    function onResize() {
      const { clientWidth: width, clientHeight: height } = container!;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      // `LineMaterial` expands its quads in clip space and needs the viewport to do
      // it: left stale, the dashes keep the width they had at the old size.
      flowMaterial.resolution.set(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      invalidate();
    }

    function onContextLost(event: Event) {
      // Not recoverable here: the scene is rebuilt on remount, and a canvas that
      // silently stays blank is the failure FR-8 exists to prevent.
      event.preventDefault();
      setContextLost(true);
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDownCapture, {
      capture: true,
    });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("webglcontextlost", onContextLost);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    controls.addEventListener("change", invalidate);

    onResize();
    const opening = overviewFraming(openingDirection);
    controls.target.copy(opening.target);
    camera.position
      .copy(opening.target)
      .addScaledVector(openingDirection, opening.distance);
    introBase.copy(camera.position).sub(controls.target);

    // ---- arrival: restore > focus > intro (node-content-pages §9.6) -------------
    // Restore outranks `?focus=`: after View Graph -> orbit -> Open page -> Back the
    // URL still names the node, but the snapshot is the view actually left.
    //
    // `?focus=` is read from `window.location` here, not threaded down as a prop:
    // reading `searchParams` in `graph/page.tsx` would opt the route out of
    // prerendering (plan, "Deviation from spec §7"). This effect only runs in the
    // browser, behind `ssr: false`, so there is no server render to disagree with.
    const restored = useGraphViewStore.getState().take();
    const rootId = nodes.find((node) => node.parentId === null)?.id;
    const focusAddress = new URLSearchParams(window.location.search).get(
      "focus",
    );
    const focusId =
      rootId && focusAddress ? nodeIdFromAddress(rootId, focusAddress) : null;
    // An unknown or empty value falls through to the overview, silently (D-1).
    const focusIndex = focusId === null ? undefined : indexById.get(focusId);

    // Reduced motion gets the floor and the still frame it already reads as 3D
    // from, and none of the sweep.
    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (restored) {
      controls.target.set(...restored.target);
      camera.position.set(...restored.position);
      controls.update();
      const restoredIndex =
        restored.focusedId === null
          ? undefined
          : indexById.get(restored.focusedId);
      if (restoredIndex !== undefined) markFocused(restoredIndex);
    } else if (focusIndex !== undefined) {
      // From the opening framing straight into the node: one continuous fly-in on
      // the click path's own `flyTo`, with no sweep first and no new frame source.
      focusNode(focusIndex);
    } else if (!stillness.matches) {
      const introDirection = openingDirection
        .clone()
        .applyAxisAngle(WORLD_UP, -INTRO_SWEEP);
      introToDistance = opening.distance;
      introFromDistance = fitDistance(introDirection, opening.target);
      introStartedAt = performance.now();
      camera.position
        .copy(introDirection)
        .setLength(introFromDistance)
        .add(controls.target);
    }
    // A wheel or a touch that OrbitControls handles itself never reaches
    // `onPointerDown`, so the controls' own "the viewer is driving" event is the
    // one that has to end the sweep.
    controls.addEventListener("start", stopIntro);
    invalidate();

    // ---- teardown (R-12, V-19) -------------------------------------------------
    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      if (emphasisPace) cancelAnimationFrame(emphasisPace);
      if (longPressTimer !== null) clearTimeout(longPressTimer);
      if (cardCloseTimer !== null) clearTimeout(cardCloseTimer);
      invalidateRef.current = null;
      applyTokensRef.current = null;
      cardLinkRef.current = null;

      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDownCapture, {
        capture: true,
      });
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      controls.removeEventListener("change", invalidate);
      controls.removeEventListener("start", stopIntro);
      controls.dispose();

      nodeGeometry.dispose();
      nodeMaterial.dispose();
      nodeMesh.dispose();
      edgeGeometry.dispose();
      edgeMaterial.dispose();
      flowGeometry.dispose();
      flowMaterial.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
      dotMesh.dispose();
      haloTexture.dispose();
      for (const halo of halos) halo.material.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowMesh.dispose();
      world.clear();

      renderer.dispose();
      // Hands the WebGL context back rather than waiting for the GC. A browser
      // gives a document a handful of them; this is what keeps ten navigations
      // from exhausting them.
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [scene]);

  // Colour changes must not rebuild the scene - that would throw away the camera.
  useEffect(() => {
    tokensRef.current = tokens;
    applyTokensRef.current?.();
    invalidateRef.current?.();
  }, [tokens]);

  if (contextLost) return <UnsupportedNotice reason="webgl" />;

  const focusedName =
    scene.nodes.find((node) => node.id === focusedId)?.name ?? null;

  return (
    <div
      ref={containerRef}
      className="graph-space relative flex-1 overflow-hidden"
    >
      <GraphLabels ref={labelsRef} />
      {/* After the labels, so the card paints above them; both are positioned, so
          both paint above the imperatively-appended canvas. */}
      <NodeHoverCard
        ref={cardRef}
        onLinkPointerEnter={() => cardLinkRef.current?.hold()}
        onLinkPointerLeave={() => cardLinkRef.current?.release()}
        onLinkClick={() => cardLinkRef.current?.navigate()}
      />
      {/* After the card, so it paints above it (graph-progress-stats §9.2). */}
      <GraphStatsPanel stats={scene.stats} />
      {/* The focused node is React state rather than a plain ref because this
          line re-renders with it. The effect reads `focusedIdRef`, so flying to a
          node never rebuilds the scene. */}
      <p aria-live="polite" className="sr-only">
        {focusedName
          ? `Centred on ${focusedName}.`
          : "Showing the whole graph."}
      </p>
    </div>
  );
}
