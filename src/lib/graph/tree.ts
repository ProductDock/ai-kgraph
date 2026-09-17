import { z } from "zod";
import { MAX_DEPTH } from "@/lib/graph/palette";
import { MAX_NODES, graphSeedSchema } from "@/lib/graph/schema";
import type { GraphEdge, GraphNode, GraphSeed } from "@/lib/graph/types";

/**
 * Ids are the slugified name path - `pd-ai/n-node/rag/vector-db/pgvector`. Derived, so
 * they stay stable when siblings are reordered, and `[a-z0-9-/]` only, so they are
 * safe as React keys and in any selector (spec §7.3, §8.2).
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Turns a zod issue path (`children.1.children.0`) back into the human path through
 * the seed (`AI > n Node > RAG`), so a bad PR fails the build and says where - the
 * indices alone would not (spec NFR-9).
 */
function namePathFromIssuePath(
  seed: GraphSeed,
  path: readonly PropertyKey[],
): string {
  const names = [seed.name];
  let current: GraphSeed | undefined = seed;

  for (const segment of path) {
    if (typeof segment !== "number") continue;
    current = current?.children?.[segment];
    if (!current) break;
    names.push(current.name);
  }
  return names.join(" > ");
}

function validate(seed: GraphSeed): void {
  const result = graphSeedSchema.safeParse(seed);
  if (result.success) return;

  const details = result.error.issues
    .map(
      (issue: z.core.$ZodIssue) =>
        `${namePathFromIssuePath(seed, issue.path)}: ${issue.message}`,
    )
    .join("; ");
  throw new Error(`Invalid graph seed - ${details}`);
}

/**
 * Validates the seed, then walks it into flat nodes and edges. Throws naming the
 * offending node for every invariant it enforces, because the one thing worse than
 * a malformed seed is a build that fails without saying which line to fix.
 *
 * Runs at build time in the Server Component (spec FR-10), so the client receives
 * positions rather than an algorithm.
 */
export function flatten(seed: GraphSeed): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  validate(seed);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenIds = new Set<string>();

  // Post-order would give leafCount for free but puts parents after children in the
  // output; this walks pre-order and back-fills leafCount, so `nodes` stays in
  // reading order - parents before their children.
  function walk(
    node: GraphSeed,
    depth: number,
    parentId: string | null,
    parentPath: string,
  ): number {
    const slug = slugify(node.name);
    if (!slug) {
      throw new Error(
        `Invalid graph seed - "${node.name}" (under ${parentPath || "the root"}) has no usable id: a name must contain at least one letter or digit.`,
      );
    }
    const id = parentId === null ? slug : `${parentId}/${slug}`;
    const path = parentPath ? `${parentPath} > ${node.name}` : node.name;

    if (depth > MAX_DEPTH) {
      throw new Error(
        `Invalid graph seed - "${node.name}" sits at depth ${depth} (${path}). The tree is capped at ${MAX_DEPTH + 1} levels because the depth ramp has ${MAX_DEPTH + 1} colour steps; see CLAUDE.md before raising it.`,
      );
    }
    // Sibling names are what make the id path unique, so a collision here means two
    // siblings share a name (or slug to the same one).
    if (seenIds.has(id)) {
      throw new Error(
        `Invalid graph seed - duplicate node id "${id}" (${path}). Sibling names must be unique.`,
      );
    }
    seenIds.add(id);

    if (nodes.length >= MAX_NODES) {
      throw new Error(
        `Invalid graph seed - more than ${MAX_NODES} nodes; "${node.name}" (${path}) is over the budget.`,
      );
    }

    const index = nodes.length;
    nodes.push({ id, name: node.name, depth, parentId, leafCount: 1 });
    if (parentId !== null) edges.push({ sourceId: parentId, targetId: id });

    const children = node.children ?? [];
    if (children.length === 0) return 1;

    let leafCount = 0;
    for (const child of children) {
      leafCount += walk(child, depth + 1, id, path);
    }
    nodes[index]!.leafCount = leafCount;
    return leafCount;
  }

  walk(seed, 0, null, "");
  return { nodes, edges };
}
