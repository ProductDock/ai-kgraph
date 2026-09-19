/**
 * Depth -> colour token and depth -> node radius (spec §7.4, §7.7).
 *
 * Pure and exported so the depth key reads the same source the scene does, and so
 * the ramp itself stays in `globals.css` - no hex is duplicated into TypeScript.
 */

/**
 * Five levels, hard-capped (spec D-5). The cap exists because the ordinal ramp has
 * five steps: a sixth level would have no colour. Raising it means adding a
 * `--graph-depth-5` step *and* re-running the `dataviz` validator in both modes
 * (spec §7.4, V-6) - see CLAUDE.md.
 */
export const MAX_DEPTH = 4;

export const DEPTH_LEVELS = [0, 1, 2, 3, 4] as const;

/** The CSS custom property carrying this depth's ramp step. */
export function depthToken(depth: number): string {
  if (!Number.isInteger(depth) || depth < 0 || depth > MAX_DEPTH) {
    throw new Error(
      `No palette step for depth ${depth}: the depth ramp has ${MAX_DEPTH + 1} steps (0-${MAX_DEPTH}).`,
    );
  }
  return `--graph-depth-${depth}`;
}

/**
 * Monotonically decreasing, root largest. The secondary encoding that keeps depth
 * from being carried by colour alone (spec §9.2) - five steps of one hue are five
 * steps of one grey to a viewer with a colour-vision deficiency.
 *
 * The root's step is deliberately far ahead of the rest rather than one more move
 * along the sequence: the hub has to read as "the thing everything hangs off",
 * which means unmistakably larger than a ring topic and large enough to hold its
 * own name inside it (spec FR-1, §9.2). A tuning value, judged on screen.
 */
const RADII = [2.6, 1.05, 0.75, 0.55, 0.42] as const;

export function radiusForDepth(depth: number): number {
  const radius = RADII[depth];
  if (radius === undefined) {
    throw new Error(
      `No node radius for depth ${depth}: the depth ramp has ${MAX_DEPTH + 1} steps (0-${MAX_DEPTH}).`,
    );
  }
  return radius;
}

/** The inline depth key in the route header (spec C-2): five swatches, five words. */
export const DEPTH_KEY: readonly { depth: number; label: string }[] =
  DEPTH_LEVELS.map((depth) => ({
    depth,
    label: ["Root", "Area", "Topic", "Subtopic", "Detail"][depth] as string,
  }));
