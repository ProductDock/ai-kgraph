import { radiusForDepth } from "@/lib/graph/palette";
import type { GraphNode, Vec3 } from "@/lib/graph/types";

/**
 * Deterministic 3D tree layout (spec D-2, §7.7). A pure function of the flattened
 * seed: no physics, no `Math.random()`, no clock. The same commit always produces
 * the same picture, which is what makes the scene reviewable in a PR and testable
 * without a GPU.
 *
 * The constants below are tuning values - they are the numbers that looked right on
 * screen. The invariants they have to satisfy are in `layout.test.ts`, and those do
 * not depend on which numbers these are.
 */

/** Distance between consecutive depth shells, from the ring outward. */
const SHELL_GAP = 12;

/**
 * Hub -> ring. Deliberately larger than `SHELL_GAP`: this gap is the whole
 * mechanism behind "the middle reads as the middle" (spec FR-2, V-3). A tuning
 * value like the rest, but the invariant it has to satisfy - wider than any later
 * shell increment - is asserted in `layout.test.ts`.
 */
const RING_RADIUS = 20;

/**
 * How much of the room left over after a child's own cone is reserved the spiral
 * actually spans. Leaving a margin is what keeps a child's subtree inside the cone
 * its parent was given, so neighbouring branches do not interleave.
 */
const CONE_FILL = 0.9;

/** Spreads n directions evenly without n-specific special cases. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * The distance from the origin to a depth's shell. The root sits at the origin, so
 * depth 1 - the ring - is the first shell and every later one steps out by
 * `SHELL_GAP` from it.
 */
function shellRadius(depth: number): number {
  return depth === 0 ? 0 : RING_RADIUS + SHELL_GAP * (depth - 1);
}

/**
 * Where the `index`th of `count` ring topics sits: an even split of the azimuth at a
 * fixed elevation, so depth 1 is a horizontal circle rather than a spherical shell
 * (spec FR-3, V-1, V-2).
 *
 * The split ignores `leafCount` on purpose, and it is the one place the layout's
 * "room in proportion to what you carry" rule is not applied: the ring's job is to
 * be a frame a viewer can always take their bearings from, and a slice sized to a
 * subtree would make the ring itself carry a size comparison nobody told the viewer
 * they were looking at (spec §3 Q3, §9.1). A heavy branch shows its weight by
 * reaching further and wider once it leaves the ring.
 */
function ringDirection(index: number, count: number): Vec3 {
  const azimuth = index * ((2 * Math.PI) / count);
  return [Math.cos(azimuth), 0, Math.sin(azimuth)];
}

/**
 * Half the arc one ring topic owns, less the usual margin. Under a half-slice
 * (`π / count`), so a topic's whole subtree stays inside its own wedge and two
 * neighbouring branches can never interleave (spec FR-4). Under a right angle too,
 * which is what makes "a branch never grows back toward the centre" true of every
 * descendant and not just the first generation: a cone narrower than 90° around a
 * horizontal ray has a positive radial component throughout.
 */
function ringHalfAngle(count: number): number {
  return (Math.PI / count) * CONE_FILL;
}

function normalize([x, y, z]: Vec3): Vec3 {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Any two unit vectors perpendicular to `w` and to each other. */
function basisAround(w: Vec3): { u: Vec3; v: Vec3 } {
  const helper: Vec3 = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = normalize(cross(helper, w));
  return { u, v: cross(w, u) };
}

/** A direction at polar angle `theta` from `w`, azimuth `phi` around it. */
function directionInCone(w: Vec3, theta: number, phi: number): Vec3 {
  const { u, v } = basisAround(w);
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  return normalize([
    w[0] * cos + (u[0] * Math.cos(phi) + v[0] * Math.sin(phi)) * sin,
    w[1] * cos + (u[1] * Math.cos(phi) + v[1] * Math.sin(phi)) * sin,
    w[2] * cos + (u[2] * Math.cos(phi) + v[2] * Math.sin(phi)) * sin,
  ]);
}

/**
 * The half-angle of the cone a child gets inside its parent's, in proportion to its
 * share of the parent's leaves - which is what gives a heavy branch room and a leaf
 * a sliver (spec §7.7.2).
 *
 * Proportional *area* is not the same as cones that fit: n equal circles never tile
 * their parent, they pack into roughly `1/(1 + sqrt(n))` of its radius each. Sizing
 * on solid angle alone over-subscribes the parent by exactly that packing
 * efficiency, and the symptom is two branches interleaving at the outer shells. The
 * `sqrt(n)/(1 + sqrt(n))` factor is that correction, and it leaves the proportions
 * between siblings untouched.
 */
function halfAngleForShare(
  parentHalfAngle: number,
  share: number,
  siblingCount: number,
): number {
  const packing = Math.sqrt(siblingCount) / (1 + Math.sqrt(siblingCount));
  return parentHalfAngle * Math.sqrt(share) * packing;
}

export function layout(nodes: GraphNode[]): Map<string, Vec3> {
  const childrenByParent = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    if (node.parentId === null) continue;
    const siblings = childrenByParent.get(node.parentId);
    if (siblings) siblings.push(node);
    else childrenByParent.set(node.parentId, [node]);
  }

  const positions = new Map<string, Vec3>();
  const directions = new Map<string, Vec3>();
  const halfAngles = new Map<string, number>();
  // Every branch spins its spiral by its own phase. Without it each parent starts
  // its children at the same azimuth in its own frame, sibling branches end up
  // mirror images of one another, and two cousins can land nearly on top of each
  // other at the outer shells however generous the cones are.
  const phases = new Map<string, number>();

  for (const node of nodes) {
    if (node.parentId === null) {
      positions.set(node.id, [0, 0, 0]);
      // The root's own direction and cone are never read: its children go on the
      // ring, which sizes its own slices. They are set so the maps stay total, and
      // `[0, 1, 0]` is the axis that ring is drawn around.
      directions.set(node.id, [0, 1, 0]);
      halfAngles.set(node.id, Math.PI);
      phases.set(node.id, 0);
    }

    const children = childrenByParent.get(node.id);
    if (!children) continue;

    // `flatten` emits parents before their children, so this is always set.
    const parentDirection = directions.get(node.id)!;
    const parentHalfAngle = halfAngles.get(node.id)!;
    const parentPhase = phases.get(node.id)!;
    const totalLeaves = children.reduce(
      (total, child) => total + child.leafCount,
      0,
    );
    const isRoot = node.parentId === null;

    children.forEach((child, index) => {
      const phi = parentPhase + index * GOLDEN_ANGLE;
      const halfAngle = isRoot
        ? ringHalfAngle(children.length)
        : halfAngleForShare(
            parentHalfAngle,
            child.leafCount / totalLeaves,
            children.length,
          );
      const theta =
        children.length === 1
          ? // A chain runs straight out from its parent rather than veering off.
            0
          : // Spiral inside what is left of the parent's cone once this child's own
            // cone is reserved, so the subtree stays where it was allocated.
            (parentHalfAngle - halfAngle) *
            CONE_FILL *
            Math.sqrt((index + 0.5) / children.length);

      const direction = isRoot
        ? ringDirection(index, children.length)
        : directionInCone(parentDirection, theta, phi);
      const radius = shellRadius(child.depth);

      directions.set(child.id, direction);
      halfAngles.set(child.id, halfAngle);
      phases.set(child.id, phi + GOLDEN_ANGLE / 2);
      positions.set(child.id, [
        direction[0] * radius,
        direction[1] * radius,
        direction[2] * radius,
      ]);
    });
  }

  return positions;
}

/** The distance from the origin to the outermost shell, for camera framing. */
export function sceneRadius(nodes: GraphNode[]): number {
  return nodes.reduce(
    (max, node) =>
      Math.max(max, shellRadius(node.depth) + radiusForDepth(node.depth)),
    0,
  );
}
