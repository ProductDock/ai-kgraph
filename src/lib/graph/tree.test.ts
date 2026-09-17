import { describe, expect, it } from "vitest";
import { seed } from "@/lib/graph/seed";
import { flatten } from "@/lib/graph/tree";
import type { GraphSeed } from "@/lib/graph/types";

describe("flatten", () => {
  it("turns the day-one seed into the tree the intent describes", () => {
    const { nodes, edges } = flatten(seed);

    expect(nodes).toHaveLength(36);
    // A tree: every node but the root has exactly one parent edge.
    expect(edges).toHaveLength(nodes.length - 1);
    expect(nodes[0]).toMatchObject({ id: "ai", depth: 0, parentId: null });
    expect(nodes.filter((node) => node.parentId === null)).toHaveLength(1);
  });

  it("derives ids from the slugified name path", () => {
    const ids = flatten(seed).nodes.map((node) => node.id);

    expect(ids).toContain("ai/n-node/rag/vector-db/pgvector");
    expect(ids.every((id) => /^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(id))).toBe(
      true,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("counts leaves per subtree", () => {
    const byId = new Map(flatten(seed).nodes.map((node) => [node.id, node]));

    expect(byId.get("ai/protocols")?.leafCount).toBe(3);
    expect(byId.get("ai/protocols/a2a")?.leafCount).toBe(1);
    expect(byId.get("ai")?.leafCount).toBe(
      [...byId.values()].filter((node) => node.leafCount === 1).length,
    );
  });

  it("emits every node before its own children", () => {
    const { nodes } = flatten(seed);
    const seen = new Set<string>();

    for (const node of nodes) {
      if (node.parentId !== null) expect(seen.has(node.parentId)).toBe(true);
      seen.add(node.id);
    }
  });

  // V-3
  it("rejects a stray field and names the node", () => {
    const strayField = {
      name: "AI",
      children: [{ name: "Protocols", status: "todo" }],
    } as unknown as GraphSeed;

    expect(() => flatten(strayField)).toThrow(/Protocols/);
    expect(() => flatten(strayField)).toThrow(/status/);
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
