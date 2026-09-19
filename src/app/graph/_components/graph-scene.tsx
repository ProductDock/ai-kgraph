"use client";

import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import {
  HUB_TOKEN,
  HUE_COUNT,
  hueToken,
  NODE_TERMINATOR,
} from "@/lib/graph/colour";
import type { GraphScene } from "@/lib/graph/types";
import {
  declutter,
  GraphLabels,
  labelOffsetPx,
  selectLabelled,
  type GraphLabelsHandle,
} from "./graph-labels";
import { createTween, tweenDuration } from "./tween";
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
const HOVER_SCALE = 1.3;
const HOVER_MS = 120;
const FOCUS_SCALE = 1.2;
/** Enough movement between press and release to have been an orbit, not a click. */
const CLICK_SLOP_PX = 5;
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
  const [contextLost, setContextLost] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Mirrors of React state and props that the effect reads without re-running:
  // rebuilding the scene to change a colour would throw away the camera.
  const focusedIdRef = useRef<string | null>(null);
  const tokensRef = useRef<Record<string, string>>({});
  const applyTokensRef = useRef<(() => void) | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);

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
    // Lambert, not basic: see AMBIENT/KEY above for why shading this does not move
    // a node off the value the ramp validator passed (spec §7.4). Lambert rather
    // than standard because there is no specular highlight to earn here and a
    // highlight would be a second, uncalibrated colour on every node.
    const nodeGeometry = new SphereGeometry(1, 32, 24);
    const nodeMaterial = new MeshLambertMaterial({ fog: true });
    const nodeMesh = new InstancedMesh(
      nodeGeometry,
      nodeMaterial,
      nodes.length,
    );
    world.add(nodeMesh);

    const dummy = new Object3D();
    /** Current and target scale multipliers, for the hover and focus bumps. */
    const scales = new Float32Array(nodes.length).fill(1);
    const scaleTargets = new Float32Array(nodes.length).fill(1);
    const animatingScales = new Set<number>();

    function writeMatrix(index: number) {
      const node = nodes[index]!;
      dummy.position.set(...node.position);
      dummy.scale.setScalar(node.radius * scales[index]!);
      dummy.updateMatrix();
      nodeMesh.setMatrixAt(index, dummy.matrix);
    }
    nodes.forEach((_, index) => writeMatrix(index));
    nodeMesh.instanceMatrix.needsUpdate = true;

    // ---- edges: one LineSegments, one draw call -------------------------------
    const edgeVertices = new Float32Array(edges.length * 6);
    edges.forEach((edge, index) => {
      const source = nodes[indexById.get(edge.sourceId)!]!.position;
      const target = nodes[indexById.get(edge.targetId)!]!.position;
      edgeVertices.set(source, index * 6);
      edgeVertices.set(target, index * 6 + 3);
    });
    const edgeGeometry = new BufferGeometry();
    edgeGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(edgeVertices, 3),
    );
    const edgeMaterial = new LineBasicMaterial({ fog: true });
    const edgeLines = new LineSegments(edgeGeometry, edgeMaterial);
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
    for (const node of hubNode ? [hubNode, ...ringNodes] : ringNodes) {
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
    floorGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(floorVertices, 3),
    );
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
    nodes.forEach((node, index) => {
      dummy.position.set(node.position[0], floorY, node.position[2]);
      // Wider than the node: a hard disc the size of the sphere reads as a second
      // node lying on the floor rather than as the mark one casts.
      dummy.scale.setScalar(node.radius * SHADOW_SPREAD);
      dummy.updateMatrix();
      shadowMesh.setMatrixAt(index, dummy.matrix);
    });
    shadowMesh.instanceMatrix.needsUpdate = true;
    shadowMesh.renderOrder = -1;
    world.add(shadowMesh);

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
      const edgeColour = current["--graph-edge"];
      if (edgeColour) edgeMaterial.color.set(edgeColour);
      const floorColour = current["--graph-floor"];
      if (floorColour) floorMaterial.color.set(floorColour);
      const shadowColour = current["--graph-shadow"];
      if (shadowColour) shadowMaterial.color.set(shadowColour);

      nodes.forEach((node, index) => {
        // The token name was decided once, at build time, rather than re-derived
        // per frame: the node already carries it.
        const value = current[node.colourToken];
        if (value) nodeMesh.setColorAt(index, colour.set(value));
      });
      if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;
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

    function stepScales(deltaMs: number): boolean {
      if (animatingScales.size === 0) return false;
      const step = deltaMs / Math.max(1, tweenDuration(HOVER_MS));

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
     * `controls.minDistance` is measured from the orbit target, and the target moves
     * to the clicked node on focus - so on its own it stops guaranteeing anything
     * about the hub as soon as a viewer has flown into a branch, which is exactly
     * the state using the feature puts them in. This is the origin-relative half of
     * FR-6: wherever the target is, the camera stays outside the ring.
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
    const introBase = new Vector3();
    /**
     * The sweep starts from a different azimuth, and the graph is wide enough that
     * the distance which frames it from one angle crops it from another - so the
     * distance is fitted at both ends and interpolated, rather than carried over.
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
      camera.position
        .copy(introBase)
        .applyAxisAngle(WORLD_UP, INTRO_SWEEP * (eased - 1))
        .setLength(
          introFromDistance + (introToDistance - introFromDistance) * eased,
        );
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

    function updateLabels(now: number, viewDistance: number) {
      if (now - lastLabelsAt < LABEL_INTERVAL_MS) return;
      lastLabelsAt = now;

      const handle = labelsRef.current;
      if (!handle) return;

      const cameraPosition = [
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ] as const;
      const near = viewDistance * LABEL_NEAR;
      const far = viewDistance * LABEL_FAR;
      const { clientWidth: width, clientHeight: height } = container!;
      const projected = new Vector3();

      handle.apply(
        declutter(
          selectLabelled(nodes, cameraPosition, focusedIdRef.current).map(
            (node) => {
              projected.set(...node.position);
              const distance = projected.distanceTo(camera.position);
              // The radius as *drawn*: the hover and focus bumps scale the mesh,
              // and a base-radius offset would let a hovered circle grow into its
              // own label (spec FR-2).
              const drawnRadius =
                node.radius * scales[indexById.get(node.id)!]!;
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
                text: node.name,
                x: ((projected.x + 1) / 2) * width,
                y: ((1 - projected.y) / 2) * height + offset,
                opacity,
              };
            },
          ),
        ),
      );
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
      updateLabels(now, viewDistance);
      inFrame = false;

      // The only place the next frame is scheduled: whether one is needed is a
      // question about the animations, not about how many events fired.
      if (introMoving || cameraMoving || scalesMoving || dampingMoving) {
        invalidate();
      }
    }

    /**
     * How far back the camera has to sit, looking from `direction`, for the whole
     * graph to fit the frame.
     *
     * Solved against the actual node positions rather than the bounding sphere,
     * because the graph is far wider than it is tall: a sphere fit frames mostly
     * empty space. And solved per axis, because `PerspectiveCamera`'s fov is the
     * *vertical* one - on a portrait tablet the horizontal extent is what binds,
     * and a fixed multiple of the scene radius crops the sides. The spec assumed
     * distance alone was enough at any screen size (§3 Q5, §9.4); it is not, and
     * this is what makes V-10's tablet check pass rather than be waived.
     */
    function overviewDistance(direction: Vector3): number {
      const { clientWidth: width, clientHeight: height } = container!;
      const aspect = width && height ? width / height : 1;
      const tanV = Math.tan((CAMERA_FOV * Math.PI) / 360);
      const tanH = tanV * aspect;

      const forward = direction.clone().normalize().negate();
      const right = new Vector3().crossVectors(forward, WORLD_UP);
      // The polar fence rules out a view straight down the up axis, so this is
      // only ever degenerate if the fence is removed.
      if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
      right.normalize();
      const up = new Vector3().crossVectors(right, forward).normalize();

      const point = new Vector3();
      let distance = MIN_ORBIT_DISTANCE;
      for (const node of nodes) {
        point.set(...node.position);
        // Behind the target counts as negative depth, which correctly *reduces*
        // the distance a near node needs.
        const depth = point.dot(forward);
        distance = Math.max(
          distance,
          (Math.abs(point.dot(right)) + node.radius) / tanH - depth,
          (Math.abs(point.dot(up)) + node.radius) / tanV - depth,
        );
      }
      return distance * OVERVIEW_MARGIN;
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

      setFocusedId(node.id);
      focusedIdRef.current = node.id;
      setScaleTarget(index, FOCUS_SCALE);
      flyTo(centre, distance);
    }

    function showOverview() {
      const previous = focusedIdRef.current;
      if (previous !== null) {
        const index = indexById.get(previous);
        if (index !== undefined) setScaleTarget(index, 1);
      }
      setFocusedId(null);
      focusedIdRef.current = null;
      const direction = camera.position.clone().sub(controls.target);
      if (direction.lengthSq() === 0) direction.copy(openingDirection);
      flyTo(new Vector3(0, 0, 0), overviewDistance(direction));
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
    let pressedAt: { x: number; y: number } | null = null;

    function pick(event: PointerEvent): number | null {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(nodeMesh, false)[0];
      return hit?.instanceId ?? null;
    }

    function onPointerMove(event: PointerEvent) {
      const index = pick(event);
      if (index === hoveredIndex) return;

      if (
        hoveredIndex !== null &&
        nodes[hoveredIndex]!.id !== focusedIdRef.current
      ) {
        setScaleTarget(hoveredIndex, 1);
      }
      hoveredIndex = index;
      if (index !== null) setScaleTarget(index, HOVER_SCALE);
      canvas.style.cursor = index === null ? "grab" : "pointer";
    }

    function onPointerDown(event: PointerEvent) {
      stopIntro();
      pressedAt = { x: event.clientX, y: event.clientY };
    }

    function onPointerUp(event: PointerEvent) {
      const pressed = pressedAt;
      pressedAt = null;
      if (!pressed) return;
      // An orbit drag ends on the canvas too; only a near-stationary release is a
      // click.
      if (
        Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) >
        CLICK_SLOP_PX
      ) {
        return;
      }

      const index = pick(event);
      // Clicking empty space returns to the overview - without it, a viewer who
      // flew into a leaf four levels deep has no way back except reloading (D-7).
      if (index === null) showOverview();
      else focusNode(index);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") showOverview();
    }

    function onResize() {
      const { clientWidth: width, clientHeight: height } = container!;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
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
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("webglcontextlost", onContextLost);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    controls.addEventListener("change", invalidate);

    onResize();
    camera.position
      .copy(openingDirection)
      .multiplyScalar(overviewDistance(openingDirection));
    introBase.copy(camera.position);
    // Reduced motion gets the floor and the still frame it already reads as 3D
    // from, and none of the sweep.
    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!stillness.matches) {
      const introDirection = openingDirection
        .clone()
        .applyAxisAngle(WORLD_UP, -INTRO_SWEEP);
      introToDistance = camera.position.length();
      introFromDistance = overviewDistance(introDirection);
      introStartedAt = performance.now();
      camera.position.copy(introDirection).setLength(introFromDistance);
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
      invalidateRef.current = null;
      applyTokensRef.current = null;

      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
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
