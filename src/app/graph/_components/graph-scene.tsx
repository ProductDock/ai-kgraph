"use client";

import { useEffect, useRef, useState } from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Fog,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
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
import { HUB_TOKEN, HUE_COUNT, hueToken } from "@/lib/graph/colour";
import type { GraphScene } from "@/lib/graph/types";
import {
  declutter,
  GraphLabels,
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
const CAMERA_FOV = 50;
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
/** Multiples of the ring's own radius: how close the camera may ever get. */
const RING_CLEARANCE = 1.15;
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
  "--page",
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
    // Read off the positions the server already sent rather than re-derived from
    // the layout's constants - `lib/graph` keeps its numbers to itself, and the
    // client only ever received positions (spec §7.6). The fallback matters only
    // for a hypothetical seed with no depth-1 node at all.
    const ringNodes = nodes.filter((node) => node.depth === 1);
    const ringRadius =
      ringNodes.reduce(
        (max, node) => Math.max(max, Math.hypot(...node.position)),
        0,
      ) || sceneRadius * 0.5;
    const minOrbitDistance = ringRadius * RING_CLEARANCE;

    // ---- renderer, camera, controls -------------------------------------------
    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
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
    // Keyed to the ring rather than to the whole scene, so "cannot fly into the
    // middle" holds however the scene is scaled (spec NFR-3, §9.3).
    controls.minDistance = minOrbitDistance;
    controls.maxDistance = sceneRadius * 5;
    controls.minPolarAngle = MIN_POLAR;
    controls.maxPolarAngle = MAX_POLAR;

    // ---- nodes: one InstancedMesh, one draw call (NFR-2) ----------------------
    // Unlit, so the pixel colour is the token colour: a lit material would shade
    // every node away from the value the ramp validator passed (spec §7.4).
    const nodeGeometry = new SphereGeometry(1, 16, 12);
    const nodeMaterial = new MeshBasicMaterial({ fog: true });
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

    // ---- colour, re-read from the DOM on every theme change -------------------
    const colour = new Color();
    function applyTokens() {
      const current = tokensRef.current;
      const page = current["--page"];
      if (page) {
        colour.set(page);
        renderer.setClearColor(colour, 1);
        // Fog is the page colour exactly, so distant nodes recede into the surface
        // rather than into a haze of some other hue (spec §7.4, R-11).
        fog.color.copy(colour);
      }
      const edgeColour = current["--graph-edge"];
      if (edgeColour) edgeMaterial.color.set(edgeColour);

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
      if (distance >= minOrbitDistance) return;
      if (distance === 0) {
        // Unreachable in practice, but scaling a zero-length vector is a NaN
        // camera and a blank canvas, so it is handled rather than trusted.
        camera.position.set(0, minOrbitDistance, 0);
        return;
      }
      camera.position.multiplyScalar(minOrbitDistance / distance);
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
              projected.project(camera);

              const behindCamera = projected.z > 1;
              // The hub's name is exempt from the distance fade - it is the label a
              // viewer takes their bearings from, and a hub whose name dissolves as
              // you back away is a dot with a caption again (spec FR-1, §9.2). Only
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
                y: ((1 - projected.y) / 2) * height,
                opacity,
                centred: isRoot,
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
      const cameraMoving = stepCamera(now);
      const scalesMoving = stepScales(deltaMs);
      // Returns true while damping is still settling.
      const dampingMoving = controls.update();
      keepOutsideRing();

      const viewDistance = camera.position.distanceTo(controls.target);
      fog.near = viewDistance * FOG_NEAR;
      fog.far = viewDistance * FOG_FAR;

      renderer.render(world, camera);
      updateLabels(now, viewDistance);
      inFrame = false;

      // The only place the next frame is scheduled: whether one is needed is a
      // question about the animations, not about how many events fired.
      if (cameraMoving || scalesMoving || dampingMoving) invalidate();
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
      let distance = minOrbitDistance;
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
      controls.dispose();

      nodeGeometry.dispose();
      nodeMaterial.dispose();
      nodeMesh.dispose();
      edgeGeometry.dispose();
      edgeMaterial.dispose();
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
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
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
