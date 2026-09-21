/**
 * Colour assignment (branch-colour spec §8.1, §8.2).
 *
 * Colour answers "which branch is this?"; the *shade* of it answers "where in that
 * branch?". One hue is spent per ring topic, and every node under it carries that
 * hue one step lighter per level and turned a little way around the hue circle from
 * its siblings - so a group and everything hanging off it read as one family of
 * related colours rather than one flat colour (intent `graph-branch-family-tint`).
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
 * How much lighter, in OKLCH lightness, each level below a branch root is drawn than
 * the level above it (intent `graph-branch-family-tint`).
 *
 * A branch is one colour. Depth inside it is a shade of that colour, and position
 * among siblings is a small turn around the hue circle - see `HUE_SPAN`. Together
 * they are what make a group and the things hanging off it read as a family rather
 * than as one flat blob at leaf size.
 *
 * 0.06 is measured, not chosen by eye: it gives OKLab dE 4 or better a level against
 * a floor of 3, below which two levels stop separating at leaf size. What bounds it
 * from above is `TINT_CEILING`, not the step: the chroma floor is reached by the
 * ladder's top rung, wherever the step puts it.
 */
export const TINT_STEP = 0.06;

/**
 * The widest a descendant's hue may end up from its branch root, in degrees around
 * the OKLCH hue circle.
 *
 * This is a containment bound, not a style knob. Measured against the ring hues: a
 * green child rotated 50 degrees lands OKLab dE 6 from the yellow ring root while
 * sitting dE 24 from its own - it reads as hanging off the wrong branch. At this
 * span the worst case is dE 10 from the nearest other ring root against 21 from its
 * own, so every shade in the picture is still nearest its own branch.
 * `palette.contract.test.ts` asserts exactly that, over every rung of every ladder.
 *
 * The spend is halved at each level (see `hueSpread`), so the total is bounded by
 * construction at 18 + 9 + 4.5 rather than by a clamp that would silently hand two
 * siblings the same hue.
 */
export const HUE_SPAN = 30;

/**
 * The half-width a node's children may spread across: half of what their parent's
 * generation had. A geometric series that sums to less than `HUE_SPAN`, which is
 * what keeps the family bounded without clamping.
 */
function hueSpread(depth: number): number {
  return HUE_SPAN / 2 ** (depth - 1);
}

/**
 * The `index`-th of `count` siblings, spread evenly across the window. One child
 * sits on its parent's own hue - there is nothing to tell apart.
 */
function fanOffset(index: number, count: number, width: number): number {
  if (count < 2) return 0;
  return -width + (2 * width * index) / (count - 1);
}

/**
 * The top of the lightness ladder. Past this the two lightest hues - yellow and
 * magenta - walk into the light backdrop, and the top of every ladder drifts toward
 * grey: measured, an unclamped depth-4 yellow reaches L 0.88 and 1.44:1 against the
 * page, and at 0.84 the lightest dark-mode blue falls to chroma 0.099, under the
 * floor at which a hue stops being a hue. 0.82 is what holds both.
 *
 * This is the accepted cost of the family tint, not a bug: tinted descendants are
 * deliberately *outside* the validated lightness band that the branch hues themselves
 * still have to sit in, and they lean on the same "visible labels" relief the three
 * low-contrast light-mode hues already lean on (see `branch-key.tsx` and the scene's
 * label layer). The band still binds where it is load-bearing - the hub and the four
 * ring hues, which is what the key lists.
 */
export const TINT_CEILING = 0.82;

/** A node's fill: which branch hue, and where in that branch's family it sits. */
export interface NodeColour {
  /** The CSS custom property carrying the branch's hue. A name, never a value. */
  token: string;
  /** OKLCH lightness to add to it. 0 for the hub and every ring topic. */
  tint: number;
  /** Degrees to turn it around the hue circle. 0 for the hub and every ring topic. */
  hueShift: number;
}

/**
 * A colour per node id, over the pre-order list `flatten` already produces (parents
 * before children, which is what lets one pass suffice).
 *
 * A hue is spent once per *branch*, on the ring topic, and every node under it
 * carries that same hue one step lighter and a little way around the hue circle from
 * its parent. So the eight slots are really only ever asked for by the ring - which
 * tops out at four (spec C-2) - and two groups deep in different branches can share a
 * hue without a viewer having to tell them apart, because the family and the
 * containment of the layout both say which branch they belong to.
 *
 * Deterministic, order-stable and local: the same seed always gives the same answer,
 * and adding a node to one branch cannot move a hue already assigned in another. Only
 * a node's parent and its own siblings are ever consulted - so adding a child *does*
 * re-fan that one parent's children, which is the point of an even spread.
 */
export function assignColours(nodes: GraphNode[]): Map<string, NodeColour> {
  const colours = new Map<string, NodeColour>();
  /** Slots already spent on the ring, so the next topic skips them. */
  const taken = new Set<number>();
  /** Sibling positions, which the flat node list does not carry. */
  const siblings = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parentId === null) continue;
    siblings.set(node.parentId, [
      ...(siblings.get(node.parentId) ?? []),
      node.id,
    ]);
  }

  for (const node of nodes) {
    if (node.parentId === null) {
      colours.set(node.id, { token: HUB_TOKEN, tint: 0, hueShift: 0 });
      continue;
    }

    const parent = colours.get(node.parentId);

    if (node.depth > 1) {
      // Same hue as the parent, one step lighter and its own turn around the
      // circle. The hub's colour is never inherited - depth 1 is handled below -
      // so this only ever walks a branch.
      const brood = siblings.get(node.parentId) as string[];
      colours.set(node.id, {
        token: parent!.token,
        tint: parent!.tint + TINT_STEP,
        hueShift:
          parent!.hueShift +
          fanOffset(brood.indexOf(node.id), brood.length, hueSpread(node.depth)),
      });
      continue;
    }

    // The ring. The first slot in fixed order no earlier topic has taken, which is
    // also what keeps every ring topic distinct without a ring-specific rule.
    let slot = 0;
    while (slot < HUE_COUNT && taken.has(slot)) slot += 1;
    // Past eight topics there is nothing left that is not already on the ring;
    // wrapping keeps the tree renderable, and the ring tops out at four long
    // before this (spec C-2).
    if (slot >= HUE_COUNT) slot = 0;

    taken.add(slot);
    colours.set(node.id, { token: hueToken(slot), tint: 0, hueShift: 0 });
  }

  return colours;
}
