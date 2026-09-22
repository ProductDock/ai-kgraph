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
    expect(nodes[0]).toMatchObject({ id: "pd-ai", depth: 0, parentId: null });
    expect(nodes.filter((node) => node.parentId === null)).toHaveLength(1);
  });

  it("derives ids from the slugified name path", () => {
    const ids = flatten(seed).nodes.map((node) => node.id);

    expect(ids).toContain("pd-ai/n-node/rag/vector-db/pgvector");
    expect(ids.every((id) => /^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(id))).toBe(
      true,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("counts leaves per subtree", () => {
    const byId = new Map(flatten(seed).nodes.map((node) => [node.id, node]));

    expect(byId.get("pd-ai/protocols")?.leafCount).toBe(3);
    expect(byId.get("pd-ai/protocols/a2a")?.leafCount).toBe(1);
    expect(byId.get("pd-ai")?.leafCount).toBe(
      [...byId.values()].filter((node) => node.leafCount === 1).length,
    );
  });

  it("records whether anything hangs off each node", () => {
    const byId = new Map(flatten(seed).nodes.map((node) => [node.id, node]));

    expect(byId.get("pd-ai/protocols")?.hasChildren).toBe(true);
    expect(byId.get("pd-ai/protocols/a2a")?.hasChildren).toBe(false);
    // Not derivable from leafCount: a node with one leaf child and a childless
    // leaf both count 1, which is why the flag exists at all.
    expect(byId.get("pd-ai/n-node/rag")?.leafCount).toBe(3);
    expect(byId.get("pd-ai/n-node/rag")?.hasChildren).toBe(true);
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

  // node-hover-card V-11
  it("defaults a node with neither field to Unassigned/Todo", () => {
    const byId = new Map(flatten(seed).nodes.map((node) => [node.id, node]));

    // No exception for the hub or a ring topic: they are categories rather than
    // pieces of work and read the default like anything else (spec §3 Q3, C-5).
    expect(byId.get("pd-ai")).toMatchObject({
      assignee: "Unassigned",
      status: "Todo",
    });
    expect(byId.get("pd-ai/protocols")).toMatchObject({
      assignee: "Unassigned",
      status: "Todo",
    });
    expect(
      flatten(seed).nodes.every(
        (node) => node.assignee.length > 0 && node.status.length > 0,
      ),
    ).toBe(true);
  });

  // node-hover-card V-11
  it("keeps what a node authored for itself", () => {
    const authored: GraphSeed = {
      name: "AI",
      children: [
        { name: "RAG", assignee: "Nemanja Vasic", status: "Done" },
        { name: "Evals", status: "In Progress" },
      ],
    };
    const byId = new Map(flatten(authored).nodes.map((n) => [n.id, n]));

    expect(byId.get("ai/rag")).toMatchObject({
      assignee: "Nemanja Vasic",
      status: "Done",
    });
    // Status without an assignee keeps the status and still defaults the name.
    expect(byId.get("ai/evals")).toMatchObject({
      assignee: "Unassigned",
      status: "In Progress",
    });
  });

  // node-hover-card V-12
  it("still rejects an unknown key, and a bad value, alongside the new fields", () => {
    const misspelled = {
      name: "AI",
      children: [{ name: "RAG", assignees: "Nemanja Vasic", status: "Done" }],
    } as unknown as GraphSeed;
    expect(() => flatten(misspelled)).toThrow(/RAG/);

    // `status` is a closed set, so a fourth word is a failed build naming the
    // node rather than a word the card would have to render (FR-4).
    const badStatus = {
      name: "AI",
      children: [{ name: "RAG", status: "Blocked" }],
    } as unknown as GraphSeed;
    expect(() => flatten(badStatus)).toThrow(/RAG/);

    // And an assignee is held to the same rule `name` is.
    const untrimmed = {
      name: "AI",
      children: [{ name: "RAG", assignee: " Nemanja " }],
    } as unknown as GraphSeed;
    expect(() => flatten(untrimmed)).toThrow(/whitespace/);
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
