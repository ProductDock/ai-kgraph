import { join } from "node:path";
import type { GraphSeed } from "@/lib/graph/types";

/**
 * A frozen stand-in for `seed.ts` and `content/`, for the tests that need exact
 * names, owners and bodies. The live tree and its pages change every time someone
 * works on a topic, and a test that pinned them turned every content PR into a test
 * edit. Tests against the live files check only what must hold for any content.
 *
 * Shaped like the live tree on purpose - a group, a leaf, a file with a body, a file
 * without one, and a node with no file - so each rendering case has one example.
 */
export const fixtureSeed = {
  name: "PD AI",
  children: [
    {
      name: "n Node",
      children: [
        {
          name: "RAG",
          children: [
            {
              name: "Vector db",
              children: [
                { name: "pgvector" },
                { name: "Qdrant" },
                { name: "S3 vector" },
              ],
            },
          ],
        },
        { name: "Evals", children: [{ name: "Ragas" }] },
        { name: "Techniques", children: [{ name: "AI TDD" }] },
      ],
    },
    { name: "Protocols", children: [{ name: "A2A" }] },
  ],
} satisfies GraphSeed;

/** `content/` for `fixtureSeed`: RAG has a body, Evals only a status. */
export const FIXTURE_CONTENT_DIR = join(
  process.cwd(),
  "src/lib/graph/__fixtures__/content",
);
