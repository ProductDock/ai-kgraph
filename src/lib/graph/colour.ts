/**
 * Colour assignment (branch-colour spec §8.1, §8.2).
 *
 * Colour answers one question - "which group is this?" - and nothing else. Depth is
 * not encoded here or anywhere else in the picture; distance from the hub already
 * says it.
 *
 * Framework-agnostic and CSS-value-free, like the rest of `lib/graph`: everything
 * below is a token *name*. `globals.css` stays the one place a colour is spelled out.
 */

import type { GraphNode } from "@/lib/graph/types";

/**
 * The centre. Used nowhere else (FR-4), and - the part that is load-bearing rather
 * than decorative - it has to separate from every hue a ring topic can take, because
 * slot 0 is always handed to the first ring topic and that topic sits one edge away
 * from the hub. It is checked against the ring four in `palette.contract.test.ts`.
 */
export const HUB_TOKEN = "--graph-hub";

/**
 * The darkest fraction of its own colour a node is ever drawn at: the scene lights
 * the nodes, and the point facing away from the key light comes back at this much of
 * the token value (the lit point comes back at exactly the token value - see
 * `graph-scene.tsx`).
 *
 * It lives here, not with the renderer, because it is a *palette* fact: it sets the
 * range of colours the picture actually contains, so both ends of it have to clear
 * the validator, and the contract test reads this number to know what to check.
 * Raising it flattens the shading; lowering it pushes the darkest hues out of the
 * validated lightness band, which is measured and asserted rather than left to
 * judgement.
 */
export const NODE_TERMINATOR = 0.76;

/**
 * Eight hues, in a fixed order that is a safety mechanism rather than a preference.
 *
 * The values are the `dataviz` skill's default categorical palette, with two
 * measured deviations recorded in `globals.css`; the *order* is this app's. A chart
 * reads its palette adjacently - series 1 beside series 2 - but this graph does not:
 * the ring is a circle of topics on screen at once and listed together in the key,
 * so every ring topic has to separate from every other. That is the validator's
 * `--pairs all` case, and the documented order fails it at the fourth topic (yellow
 * against orange, normal-vision dE 10.6 in dark mode, against a hard floor of 15).
 * Re-ordering the same eight values clears every gate in both modes - which is the
 * fix the skill itself prescribes, since "the slot ordering is the CVD-safety
 * mechanism, not cosmetic".
 *
 * Editing a value or this order does not need anyone to remember to re-run anything:
 * `palette.contract.test.ts` reads `globals.css` and runs those checks over both
 * themes and both ends of the scene's shading range.
 */
export const HUE_COUNT = 8;

/** The CSS custom property carrying hue `index`. */
export function hueToken(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= HUE_COUNT) {
    throw new Error(
      `No palette hue at slot ${index}: the group palette has ${HUE_COUNT} slots (0-${HUE_COUNT - 1}).`,
    );
  }
  return `--graph-branch-${index}`;
}

/**
 * A group is anything that carries something, plus every topic on the ring whether
 * or not it has been filled in yet (spec §4 D-2).
 *
 * The ring exception is deliberate and is what keeps colour and size from ever
 * disagreeing: the ring is the frame a viewer takes their bearings from, so a topic
 * shrinking to a rim-sized dot because nobody has filled it in reads as a rendering
 * mistake rather than as information. The root is not a group - it has its own token
 * and its own radius - so callers handle depth 0 before asking.
 */
export function isGroup(node: GraphNode): boolean {
  return node.depth === 1 || node.hasChildren;
}

/**
 * A colour token per node id, over the pre-order list `flatten` already produces
 * (parents before children, which is what lets one pass suffice).
 *
 * Deterministic, order-stable and local: the same seed always gives the same answer,
 * and adding a node to one branch cannot move a hue already assigned in another. Only
 * a node's parent and its earlier siblings are ever consulted.
 *
 * Hues repeat across the tree - eight of them against far more groups - but never
 * between two groups a viewer can see together and mistake for each other. "Near" is
 * defined on the tree alone (parent/child, or shared parent); the layout's existing
 * containment rule, that a branch's subtree never spreads into a sibling branch's
 * slice, is what makes that also true on screen (spec §8.3).
 */
export function assignColours(nodes: GraphNode[]): Map<string, string> {
  const colours = new Map<string, string>();
  /** The hue slot each group took, so children and later siblings can avoid it. */
  const slots = new Map<string, number>();
  /** Slots already spent under a given parent, keyed by parent id. */
  const takenByParent = new Map<string, Set<number>>();

  for (const node of nodes) {
    if (node.parentId === null) {
      colours.set(node.id, HUB_TOKEN);
      continue;
    }

    if (!isGroup(node)) {
      // A leaf carries its group's own colour. It is told apart from that group by
      // being smaller, not by being paler: there is no lighter shade to give it. The
      // eight hues already span the validated lightness band, so a "lighter step"
      // comes back identical to its base for three of them, and forcing one collapses
      // the shades into each other (spec §8.1).
      colours.set(node.id, colours.get(node.parentId) as string);
      continue;
    }

    const taken = takenByParent.get(node.parentId) ?? new Set<number>();
    const parentSlot = slots.get(node.parentId);

    // The first slot in fixed order that neither this node's parent nor an earlier
    // sibling has taken. Ring topics are all siblings under the root, so this one
    // rule is also what keeps every ring topic distinct - no ring-specific case.
    let slot = 0;
    while (slot < HUE_COUNT && (slot === parentSlot || taken.has(slot)))
      slot += 1;
    // Past eight distinct neighbours there is nothing left to pick that is not
    // already in use nearby; wrapping keeps the tree renderable, and the ring - the
    // one place where every group is visible at once - tops out at four long before
    // this (spec C-2).
    if (slot >= HUE_COUNT) slot = 0;

    taken.add(slot);
    takenByParent.set(node.parentId, taken);
    slots.set(node.id, slot);
    colours.set(node.id, hueToken(slot));
  }

  return colours;
}
