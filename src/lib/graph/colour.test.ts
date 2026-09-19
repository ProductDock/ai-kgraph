import { describe, expect, it } from "vitest";
import {
  assignColours,
  HUB_TOKEN,
  HUE_COUNT,
  hueToken,
  isGroup,
} from "@/lib/graph/colour";
import { GROUP_RADIUS, LEAF_RADIUS, radiusForNode } from "@/lib/graph/palette";
import { buildScene } from "@/lib/graph/scene";
import { seed } from "@/lib/graph/seed";
import { flatten } from "@/lib/graph/tree";
import type { GraphNode, GraphSeed } from "@/lib/graph/types";

const { nodes } = flatten(seed);
const colours = assignColours(nodes);
const byId = new Map(nodes.map((node) => [node.id, node]));
const named = (name: string) => nodes.find((node) => node.name === name)!;

/** 148 nodes - the same envelope layout.test.ts uses, not the day-one 36. */
const wide: GraphSeed = {
  name: "AI",
  children: Array.from({ length: 7 }, (_, area) => ({
    name: `Area ${area}`,
    children: Array.from({ length: 4 }, (_, topic) => ({
      name: `Topic ${topic}`,
      children: Array.from({ length: 4 }, (_, detail) => ({
        name: `Detail ${detail}`,
      })),
    })),
  })),
};
const wideNodes = flatten(wide).nodes;

const HUES = new Set(
  Array.from({ length: HUE_COUNT }, (_, slot) => hueToken(slot)),
);

const seeds: [string, GraphNode[]][] = [
  ["the day-one seed", nodes],
  ["a wider synthetic seed", wideNodes],
];

describe("assignColours", () => {
  // V-1
  it.each(seeds)("gives every group a hue of its own in %s", (_label, tree) => {
    const assigned = assignColours(tree);

    for (const node of tree) {
      if (node.parentId === null) {
        expect(assigned.get(node.id)).toBe(HUB_TOKEN);
        continue;
      }
      if (!isGroup(node)) continue;
      expect(HUES.has(assigned.get(node.id)!)).toBe(true);
    }
  });

  // FR-4: the hub's colour appears nowhere else in the picture.
  it("spends the hub's colour on the hub and nothing else", () => {
    const hub = nodes.filter((node) => colours.get(node.id) === HUB_TOKEN);

    expect(hub).toHaveLength(1);
    expect(hub[0]!.depth).toBe(0);
  });

  // V-2
  it.each(seeds)(
    "gives every leaf its parent's own colour in %s",
    (_label, tree) => {
      const assigned = assignColours(tree);

      for (const node of tree) {
        if (node.parentId === null || isGroup(node)) continue;
        expect(assigned.get(node.id)).toBe(assigned.get(node.parentId));
      }
    },
  );

  // V-3 - a node with children takes a new hue, never its parent's.
  it("never shades a group down from its parent", () => {
    const rag = named("RAG");
    const vectorDb = named("Vector db");

    expect(colours.get(vectorDb.id)).not.toBe(colours.get(rag.id));
    for (const leaf of ["pgvector", "Qdrant", "S3 vector"]) {
      expect(colours.get(named(leaf).id)).toBe(colours.get(vectorDb.id));
      expect(colours.get(named(leaf).id)).not.toBe(colours.get(rag.id));
    }
  });

  // V-4
  it.each(seeds)(
    "never repeats a hue between neighbours in %s",
    (_label, tree) => {
      const assigned = assignColours(tree);
      const parents = new Map(tree.map((node) => [node.id, node.parentId]));
      const siblingHues = new Map<string, Set<string>>();

      for (const node of tree) {
        if (node.parentId === null || !isGroup(node)) continue;
        const hue = assigned.get(node.id)!;

        const parentId = parents.get(node.id)!;
        const parent = tree.find((other) => other.id === parentId)!;
        if (isGroup(parent)) expect(hue).not.toBe(assigned.get(parent.id));

        const seen = siblingHues.get(parentId) ?? new Set<string>();
        expect(seen.has(hue)).toBe(false);
        seen.add(hue);
        siblingHues.set(parentId, seen);
      }
    },
  );

  // FR-5 - every ring topic is distinct, childless ones included.
  it("gives every ring topic a colour no other ring topic has", () => {
    const ring = nodes.filter((node) => node.depth === 1);
    const hues = ring.map((node) => colours.get(node.id));

    expect(ring.length).toBeGreaterThan(1);
    expect(new Set(hues).size).toBe(ring.length);
  });

  // V-5
  it("is deterministic", () => {
    expect([...assignColours(nodes)]).toEqual([...assignColours(nodes)]);
  });

  // V-5 - adding a node to one branch cannot move a hue in another.
  it("leaves other branches alone when one branch grows", () => {
    const grown = structuredClone(seed) as GraphSeed;
    grown.children![0]!.children!.push({ name: "Something new" });

    const after = assignColours(flatten(grown).nodes);
    const untouched = nodes.filter(
      (node) => !node.id.startsWith("pd-ai/ai-agents"),
    );

    expect(untouched.length).toBeGreaterThan(0);
    for (const node of untouched) {
      expect(after.get(node.id)).toBe(colours.get(node.id));
    }
  });
});

describe("radiusForNode", () => {
  // V-6
  it.each(seeds)(
    "draws every group bigger than every leaf in %s",
    (_label, tree) => {
      const groups = tree.filter((node) => node.depth > 0 && isGroup(node));
      const leaves = tree.filter((node) => !isGroup(node));

      expect(groups.length).toBeGreaterThan(0);
      expect(leaves.length).toBeGreaterThan(0);
      const smallestGroup = Math.min(...groups.map(radiusForNode));
      const largestLeaf = Math.max(...leaves.map(radiusForNode));
      expect(smallestGroup).toBeGreaterThan(largestLeaf);
    },
  );

  // V-6 - and depth no longer changes either one.
  it("draws a deep group and a shallow one at the same size", () => {
    expect(radiusForNode(named("Vector db"))).toBe(
      radiusForNode(named("AI Agents")),
    );
    expect(named("Vector db").depth).not.toBe(named("AI Agents").depth);
  });

  // V-7
  it.each(seeds)("draws every leaf at one size in %s", (_label, tree) => {
    const leafRadii = new Set(
      tree.filter((node) => !isGroup(node)).map(radiusForNode),
    );

    expect([...leafRadii]).toEqual([LEAF_RADIUS]);
  });

  // V-7, C-3 - a ring topic is group-sized even with nothing under it.
  it("draws a childless ring topic like its ring siblings", () => {
    const childless = nodes.filter(
      (node) => node.depth === 1 && !node.hasChildren,
    );

    expect(childless.length).toBeGreaterThan(0);
    for (const topic of childless) {
      expect(radiusForNode(topic)).toBe(GROUP_RADIUS);
    }
  });

  // FR-9
  it("keeps the hub the biggest thing on screen", () => {
    const { nodes: scene } = buildScene(seed);
    const hub = scene.find((node) => node.depth === 0)!;

    for (const node of scene) {
      if (node.id !== hub.id) expect(node.radius).toBeLessThan(hub.radius);
    }
  });
});

describe("hueToken", () => {
  it("refuses a slot outside the palette", () => {
    expect(() => hueToken(HUE_COUNT)).toThrow(/8 slots/);
    expect(() => hueToken(-1)).toThrow(/8 slots/);
  });
});

describe("buildScene", () => {
  it("hands every node a colour token the stylesheet declares", () => {
    const { nodes: scene } = buildScene(seed);

    for (const node of scene) {
      expect(node.colourToken === HUB_TOKEN || HUES.has(node.colourToken)).toBe(
        true,
      );
      expect(byId.has(node.id)).toBe(true);
    }
  });
});
