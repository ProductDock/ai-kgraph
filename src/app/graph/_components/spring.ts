/**
 * The drag-and-spring-back maths, kept apart from the scene so it can be tested
 * without a WebGL context - the same split `tween.ts` makes for the camera.
 *
 * A node's *rest* position is the layout's and never changes; a spring only ever
 * moves an *offset* from it, and every offset's target is zero once the viewer lets
 * go. That is what keeps the layout the answer to "where is this node": the springs
 * are a transient on top of it, and every property `layout.test.ts` asserts holds
 * again the moment they settle.
 */

/** In 1/s². With the damping below, a period of about half a second. */
export const SPRING_STIFFNESS = 170;
/**
 * Under 1, so a released node overshoots its rest position once and settles: the
 * overshoot is what reads as elastic rather than as a tween back into place.
 */
export const SPRING_DAMPING_RATIO = 0.42;
/**
 * How far a node can be pulled, in world units. A soft limit - see `rubberBand` -
 * sized under the ring's closest node spacing so a dragged node can stretch
 * towards a neighbour but never be dropped on top of one.
 */
export const DRAG_REACH = 4.5;
/** Below both of these, a spring is at rest and snaps exactly onto its target. */
const SETTLE_DISTANCE = 0.002;
const SETTLE_SPEED = 0.01;
/**
 * Integration step, in seconds. Semi-implicit Euler is stable here for any step
 * under about 2 / sqrt(k) (0.15s), but the overshoot's *shape* depends on the step,
 * so a frame is split into fixed substeps and the spring behaves the same at 60Hz,
 * 144Hz or after a dropped frame.
 */
const SUBSTEP_S = 1 / 240;
/** A tab that was hidden hands back one enormous delta; nothing should jump on it. */
const MAX_FRAME_S = 1 / 20;

export interface SpringField {
  /** xyz per node: how far it currently is from its rest position. */
  offsets: Float32Array;
  velocities: Float32Array;
  /** xyz per node: the offset it is being pulled towards. */
  targets: Float32Array;
}

export function createSpringField(count: number): SpringField {
  return {
    offsets: new Float32Array(count * 3),
    velocities: new Float32Array(count * 3),
    targets: new Float32Array(count * 3),
  };
}

/**
 * The drag's resistance: 1:1 near the start, easing off towards `reach` and never
 * past it. Hard clamping would stop the node dead under the pointer; this keeps it
 * moving, just less, which is the "pulling against something" the spring promises.
 */
export function rubberBand(distance: number, reach: number = DRAG_REACH) {
  if (distance <= 0 || reach <= 0) return 0;
  return reach * Math.tanh(distance / reach);
}

/**
 * Advances node `index` by `deltaMs`. Returns true once it is at rest on its
 * target, having snapped it there exactly - so a settled node is drawn at its
 * layout position to the bit, not at a residue a thousandth of a unit off it.
 */
export function stepSpring(
  field: SpringField,
  index: number,
  deltaMs: number,
): boolean {
  const { offsets, velocities, targets } = field;
  const base = index * 3;
  const damping = 2 * SPRING_DAMPING_RATIO * Math.sqrt(SPRING_STIFFNESS);

  let remaining = Math.min(Math.max(0, deltaMs) / 1000, MAX_FRAME_S);
  while (remaining > 1e-9) {
    const h = Math.min(SUBSTEP_S, remaining);
    remaining -= h;
    for (let axis = 0; axis < 3; axis += 1) {
      const at = base + axis;
      const pull = SPRING_STIFFNESS * (targets[at]! - offsets[at]!);
      velocities[at] = velocities[at]! + (pull - damping * velocities[at]!) * h;
      offsets[at] = offsets[at]! + velocities[at]! * h;
    }
  }

  for (let axis = 0; axis < 3; axis += 1) {
    const at = base + axis;
    if (
      Math.abs(targets[at]! - offsets[at]!) > SETTLE_DISTANCE ||
      Math.abs(velocities[at]!) > SETTLE_SPEED
    ) {
      return false;
    }
  }
  for (let axis = 0; axis < 3; axis += 1) {
    offsets[base + axis] = targets[base + axis]!;
    velocities[base + axis] = 0;
  }
  return true;
}
