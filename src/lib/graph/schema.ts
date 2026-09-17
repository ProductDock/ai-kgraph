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
 * Recursive and `.strict()`: unknown keys fail. That is what mechanically enforces
 * the intent's "names and children only" constraint - a seed edit cannot smuggle in
 * a `status` field that some later component renders unescaped (spec §7.3, §8.2).
 *
 * This schema owns the shape of a single node. The invariants that need the whole
 * tree - sibling uniqueness, the depth cap, the node budget - are enforced in
 * `tree.ts`, where the walk already knows each node's id path and can name it.
 */
export const graphSeedSchema: z.ZodType<GraphSeed> = z.lazy(() =>
  z.strictObject({
    name: z
      .string()
      .min(1)
      .max(MAX_NAME_LENGTH)
      .refine((name) => name === name.trim() && name.trim().length > 0, {
        message:
          "name must be non-empty and free of leading/trailing whitespace",
      }),
    children: z.array(graphSeedSchema).optional(),
  }),
);

export { MAX_DEPTH };
