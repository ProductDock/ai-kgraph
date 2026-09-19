/**
 * Node size (branch-colour spec §8.4). Colour lives in `colour.ts`; this file is
 * what is left of the old depth ramp once depth stopped driving the picture.
 *
 * Pure and framework-agnostic, like the rest of `lib/graph`: plain numbers out, no
 * `three`, no CSS.
 */

import { isGroup } from "@/lib/graph/colour";
import type { GraphNode } from "@/lib/graph/types";

/**
 * Five levels, hard-capped. The cap used to exist because the ordinal colour ramp
 * had five steps and a sixth level would have had no colour. That ramp is gone, and
 * nothing about colour or size would now break at depth 5 - the cap stays on its own
 * terms, as a deliberate limit on how deep the content may go before the tree stops
 * being readable at a glance and authorable in one file (intent, Constraints).
 *
 * Raising it is a content decision, not a rendering one: no palette step has to be
 * added and no validator has to be re-run. See CLAUDE.md.
 */
export const MAX_DEPTH = 4;

/**
 * Three radii, not five. Size answers "is this a group" (branch-colour spec §8.4) -
 * the same question colour answers, so the two can never disagree on a node.
 *
 * The hub's step is deliberately far ahead of the rest rather than one more move
 * along a sequence: it has to read as "the thing everything hangs off", which means
 * unmistakably larger than a ring topic. Tuning values, judged on screen.
 *
 * It used to also have to be large enough to hold its own name *inside* it. It does
 * not any more - `intent/graph-labels-under-nodes/` put every label below its circle
 * and made no exception for the hub - so the only floor left on this number is the
 * one the eye sets. It came down from 2.6 on that basis; at 2.2 it is still 2.1x a
 * ring topic. Shrinking it only loosens the two assertions that mention it
 * (`layout.test.ts`'s hub-to-ring gap and its 2.5x separation floor), so the ceiling
 * is what is worth watching, not the floor.
 *
 * `GROUP_RADIUS` is bounded by the layout, not by taste: `layout.test.ts` floors
 * every node pair's centre distance at 2.5x the larger radius, and deep groups - which
 * used to take the *smallest* radii - now take this one. Measured against the real
 * layout, the closest pair involving a group sits 3.59 apart in the 148-node synthetic
 * seed, so anything past ~1.44 fails that test. 1.05 clears it by ~1.37x. Those two
 * distances scale with `RING_RADIUS`/`SHELL_GAP` and this radius does not, so
 * tightening the layout again moves the ceiling, not this number.
 */
export const HUB_RADIUS = 2.2;
export const GROUP_RADIUS = 1.05;
export const LEAF_RADIUS = 0.42;

/** Hub, group, or leaf - a function of the node's own shape, never of its depth. */
export function radiusForNode(node: GraphNode): number {
  if (node.depth === 0) return HUB_RADIUS;
  return isGroup(node) ? GROUP_RADIUS : LEAF_RADIUS;
}
