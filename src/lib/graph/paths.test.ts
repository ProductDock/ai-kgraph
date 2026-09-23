import { describe, expect, it } from "vitest";
import {
  breadcrumb,
  keyTopics,
  nodeAddress,
  nodeHref,
  nodeIdFromAddress,
} from "@/lib/graph/paths";
import { flatten } from "@/lib/graph/tree";
import type { GraphSeed } from "@/lib/graph/types";

const tree: GraphSeed = {
  name: "AI",
  children: [
    {
      name: "n Node",
      children: [
        { name: "Zeta" },
        { name: "RAG", children: [{ name: "Vector db" }] },
        { name: "Alpha" },
      ],
    },
    { name: "Protocols" },
  ],
};

describe("node addresses", () => {
  it("drops the root segment, and round-trips", () => {
    expect(nodeAddress("ai/n-node/rag")).toBe("n-node/rag");
    expect(nodeHref("ai/n-node/rag")).toBe("/graph/n-node/rag");
    expect(nodeIdFromAddress("ai", "n-node/rag")).toBe("ai/n-node/rag");

    for (const { id, parentId } of flatten(tree).nodes) {
      if (parentId === null) continue;
      expect(nodeIdFromAddress("ai", nodeAddress(id))).toBe(id);
    }
  });

  it("gives the hub an empty address, which resolves to nothing", () => {
    expect(nodeAddress("ai")).toBe("");
    expect(nodeIdFromAddress("ai", "")).toBeNull();
  });
});

describe("breadcrumb", () => {
  it("lists ancestors from the hub down, not the node itself", () => {
    const { nodes } = flatten(tree);

    expect(
      breadcrumb(nodes, "ai/n-node/rag/vector-db").map((node) => node.name),
    ).toEqual(["AI", "n Node", "RAG"]);
    expect(breadcrumb(nodes, "ai/protocols").map((node) => node.name)).toEqual([
      "AI",
    ]);
    expect(breadcrumb(nodes, "ai")).toEqual([]);
  });
});

describe("keyTopics", () => {
  // V-8
  it("is the node's children, in seed order - not sorted", () => {
    const { nodes } = flatten(tree);

    expect(keyTopics(nodes, "ai/n-node").map((node) => node.name)).toEqual([
      "Zeta",
      "RAG",
      "Alpha",
    ]);
    expect(keyTopics(nodes, "ai/n-node/rag").map((node) => node.id)).toEqual([
      "ai/n-node/rag/vector-db",
    ]);
    expect(keyTopics(nodes, "ai/protocols")).toEqual([]);
  });
});
