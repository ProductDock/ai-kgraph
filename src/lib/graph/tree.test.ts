import { describe, expect, it } from "vitest";
import { MAX_NODES } from "@/lib/graph/schema";
import { seed } from "@/lib/graph/seed";
import { flatten } from "@/lib/graph/tree";
import type { GraphSeed } from "@/lib/graph/types";

/**
 * A fixed tree for the assertions that need exact names and counts. The live seed
 * changes every time someone adds a topic, so tests against it check only what must
 * hold for *any* seed - pinning today's 36 nodes made every content PR a test edit.
 */
const tree: GraphSeed = {
  name: "AI",
  children: [
    {
      name: "n Node",
      children: [
        {
          name: "RAG",
          children: [{ name: "Vector db", children: [{ name: "pgvector" }] }],
        },
        { name: "Evals" },
      ],
    },
    { name: "Protocols", children: [{ name: "MCP" }, { name: "A2A" }] },
  ],
};

describe("flatten", () => {
  it("turns the live seed into one tree within the node budget", () => {
    const { nodes, edges } = flatten(seed);

    expect(nodes.length).toBeGreaterThan(1);
    expect(nodes.length).toBeLessThanOrEqual(MAX_NODES);
    // A tree: every node but the root has exactly one parent edge.
    expect(edges).toHaveLength(nodes.length - 1);
    expect(nodes[0]).toMatchObject({ depth: 0, parentId: null });
    expect(nodes.filter((node) => node.parentId === null)).toHaveLength(1);
  });

  it("derives ids from the slugified name path", () => {
    expect(flatten(tree).nodes.map((node) => node.id)).toContain(
      "ai/n-node/rag/vector-db/pgvector",
    );

    const ids = flatten(seed).nodes.map((node) => node.id);
    expect(ids.every((id) => /^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(id))).toBe(
      true,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("counts leaves per subtree", () => {
    const byId = new Map(flatten(tree).nodes.map((node) => [node.id, node]));

    expect(byId.get("ai/protocols")?.leafCount).toBe(2);
    expect(byId.get("ai/protocols/a2a")?.leafCount).toBe(1);

    const live = flatten(seed).nodes;
    expect(live[0]!.leafCount).toBe(
      live.filter((node) => !node.hasChildren).length,
    );
  });

  it("records whether anything hangs off each node", () => {
    const byId = new Map(flatten(tree).nodes.map((node) => [node.id, node]));

    expect(byId.get("ai/protocols")?.hasChildren).toBe(true);
    expect(byId.get("ai/protocols/a2a")?.hasChildren).toBe(false);
    // Not derivable from leafCount: a node with one leaf child and a childless
    // leaf both count 1, which is why the flag exists at all.
    expect(byId.get("ai/n-node/rag")?.leafCount).toBe(1);
    expect(byId.get("ai/n-node/rag")?.hasChildren).toBe(true);
  });

  it("emits every node before its own children", () => {
    const { nodes } = flatten(seed);
    const seen = new Set<string>();

    for (const node of nodes) {
      if (node.parentId !== null) expect(seen.has(node.parentId)).toBe(true);
      seen.add(node.id);
    }
  });

  // V-3. The stray key used to be `status`, which this feature reserved - so the
  // example moved to one that is still genuinely unknown. The check is unchanged:
  // an unrecognised key fails the build and the message names the node.
  it("rejects a stray field and names the node", () => {
    const strayField = {
      name: "AI",
      children: [{ name: "Protocols", owner: "someone" }],
    } as unknown as GraphSeed;

    expect(() => flatten(strayField)).toThrow(/Protocols/);
    expect(() => flatten(strayField)).toThrow(/unrecognized|Unrecognized/);
  });

  // node-content-pages §7. Owner and status moved to `content/` frontmatter, so on a
  // seed node they are now just unknown keys - the build fails naming the node, which
  // is the signal an in-flight PR that still edits them gets.
  it("rejects assignee and status on a seed node, naming the node", () => {
    const stale = {
      name: "AI",
      children: [{ name: "RAG", assignee: "Nemanja Vasic", status: "Done" }],
    } as unknown as GraphSeed;

    expect(() => flatten(stale)).toThrow(/RAG/);
    expect(() => flatten(stale)).toThrow(/unrecognized|Unrecognized/);
  });

  // V-5
  it("rejects a sixth level and names the node", () => {
    const sixLevels: GraphSeed = {
      name: "AI",
      children: [
        {
          name: "One",
          children: [
            {
              name: "Two",
              children: [
                {
                  name: "Three",
                  children: [
                    { name: "Four", children: [{ name: "Too deep" }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    expect(() => flatten(sixLevels)).toThrow(/Too deep/);
    expect(() => flatten(sixLevels)).toThrow(/depth 5/);
  });

  it("rejects duplicate sibling names, which would collide as ids", () => {
    const duplicated: GraphSeed = {
      name: "AI",
      children: [{ name: "RAG" }, { name: "rag" }],
    };

    expect(() => flatten(duplicated)).toThrow(/duplicate node id "ai\/rag"/);
  });

  it("rejects a name that is empty, untrimmed or unusable as an id", () => {
    expect(() => flatten({ name: "AI", children: [{ name: "" }] })).toThrow(
      /Invalid graph seed/,
    );
    expect(() => flatten({ name: "AI", children: [{ name: " RAG" }] })).toThrow(
      /whitespace/,
    );
    expect(() => flatten({ name: "AI", children: [{ name: "!!!" }] })).toThrow(
      /no usable id/,
    );
  });
});
