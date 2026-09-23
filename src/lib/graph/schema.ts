import { z } from "zod";
import { MAX_DEPTH } from "@/lib/graph/palette";
import type { GraphSeed } from "@/lib/graph/types";

/**
 * The performance envelope in NFR-1 was designed for the intent's "under 100".
 * Well above the day-one 36 nodes, and low enough that nobody discovers the ceiling
 * by watching a tablet melt.
 */
export const MAX_NODES = 150;

/** A label longer than this cannot be drawn readably at any distance (spec §7.3). */
export const MAX_NAME_LENGTH = 60;

/**
 * An assignee is free text, not a roster (node-hover-card spec §3 Q2, C-2): a
 * maintained list of teammates is real scope, and a build that fails the day someone
 * joins is its own problem. The cost is a typo'd name shipping silently, accepted on
 * the record. The cap is the same one a node's name carries - the card truncates
 * anything long with an ellipsis, so this is the outer bound, not the design width.
 */
export const MAX_ASSIGNEE_LENGTH = MAX_NAME_LENGTH;

/**
 * Non-empty and free of surrounding whitespace. Shared by the seed's `name` and by
 * the content frontmatter's `title`/`tags`/`assignee` (`content.ts`) so the rules
 * cannot drift apart: all of them are hand-typed strings that end up drawn on
 * screen, and " Nemanja " is a different string from "Nemanja" in a way nobody
 * authoring them intends.
 */
export function trimmedString(max: number) {
  return z
    .string()
    .min(1)
    .max(max)
    .refine((value) => value === value.trim() && value.trim().length > 0, {
      message: "must be non-empty and free of leading/trailing whitespace",
    });
}

/**
 * The closed set of status words (node-hover-card spec FR-4). Declared here, beside
 * the rule for names, and imported by `content.ts`: the frontmatter is where a status
 * is authored now, but a fourth word is still a failed build.
 */
export const nodeStatusSchema = z.enum(["Todo", "In Progress", "Done"]);

/**
 * Recursive and `.strict()`: unknown keys fail. That is what mechanically enforces
 * the seed's shape - a misspelled `childern`, or an `assignee`/`status` left over
 * from before they moved to `content/`, is a failed build naming the node, not a
 * field that silently does nothing (spec §7.3, §8.2; node-content-pages spec §7).
 *
 * The seed holds `name` and `children` and nothing else. What a node says about the
 * work lives in its content file's frontmatter, validated in `content.ts`.
 *
 * This schema owns the shape of a single node. The invariants that need the whole
 * tree - sibling uniqueness, the depth cap, the node budget - are enforced in
 * `tree.ts`, where the walk already knows each node's id path and can name it.
 */
export const graphSeedSchema: z.ZodType<GraphSeed> = z.lazy(() =>
  z.strictObject({
    name: trimmedString(MAX_NAME_LENGTH),
    children: z.array(graphSeedSchema).optional(),
  }),
);

export { MAX_DEPTH };
