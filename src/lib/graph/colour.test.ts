import { describe, expect, it } from "vitest";
import {
  assignColours,
  HUB_TOKEN,
  HUE_COUNT,
  hueToken,
  HUE_SPAN,
  isGroup,
  TINT_STEP,
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
  // V-1 - a hue is spent per branch, on the ring topic, and nowhere else.
  it.each(seeds)("gives every ring topic a hue of its own in %s", (_l, tree) => {
    const assigned = assignColours(tree);
    const ring = tree.filter((node) => node.depth === 1);

    expect(ring.length).toBeGreaterThan(1);
    for (const topic of ring) {
      expect(HUES.has(assigned.get(topic.id)!.token)).toBe(true);
      expect(assigned.get(topic.id)!.tint).toBe(0);
    }
    expect(new Set(ring.map((t) => assigned.get(t.id)!.token)).size).toBe(
      ring.length,
    );
  });

  // FR-4: the hub's colour appears nowhere else in the picture.
  it("spends the hub's colour on the hub and nothing else", () => {
    const hub = nodes.filter((node) => colours.get(node.id)!.token === HUB_TOKEN);

    expect(hub).toHaveLength(1);
    expect(hub[0]!.depth).toBe(0);
    expect(colours.get(hub[0]!.id)!.tint).toBe(0);
  });

  // V-2 - every node below the ring carries its branch's hue, one step lighter
  // than the node it hangs off. This is the family tint: a group and its children
  // are the same colour at two shades, never two colours.
  it.each(seeds)("shades each branch down from its topic in %s", (_l, tree) => {
    const assigned = assignColours(tree);

    for (const node of tree) {
      if (node.depth < 2) continue;
      const own = assigned.get(node.id)!;
      const parent = assigned.get(node.parentId!)!;
      expect(own.token).toBe(parent.token);
      expect(own.tint).toBeCloseTo(parent.tint + TINT_STEP);
      // Bounded by construction, not by a clamp - see `hueSpread`. A clamp would
      // hand two siblings the same hue at the bottom of the tree in silence.
      expect(Math.abs(own.hueShift)).toBeLessThan(HUE_SPAN);
    }
  });

  // The fan: two children of one node are never handed the same colour, which is
  // what a lightness step alone could not give them at leaf size.
  it.each(seeds)("turns each child of a node its own way in %s", (_l, tree) => {
    const assigned = assignColours(tree);
    const broods = new Map<string, number[]>();

    for (const node of tree) {
      if (node.depth < 2) continue;
      const brood = broods.get(node.parentId!) ?? [];
      brood.push(assigned.get(node.id)!.hueShift);
      broods.set(node.parentId!, brood);
    }

    expect(broods.size).toBeGreaterThan(0);
    for (const [parentId, brood] of broods) {
      expect(new Set(brood).size, `${parentId}'s children`).toBe(brood.length);
    }
  });

  // V-3 - depth is the only thing that moves inside a branch, and it moves in one
  // direction: a leaf and its group differ by a shade, a group and its parent too.
  it("draws a whole branch in one hue at one shade per level", () => {
    const rag = named("RAG");
    const vectorDb = named("Vector db");
    const topic = named("n Node");

    expect(colours.get(vectorDb.id)!.token).toBe(colours.get(rag.id)!.token);
    expect(colours.get(rag.id)!.token).toBe(colours.get(topic.id)!.token);
    expect(colours.get(vectorDb.id)!.tint).toBeGreaterThan(
      colours.get(rag.id)!.tint,
    );
    for (const leaf of ["pgvector", "Qdrant", "S3 vector"]) {
      expect(colours.get(named(leaf).id)!.token).toBe(
        colours.get(vectorDb.id)!.token,
      );
      expect(colours.get(named(leaf).id)!.tint).toBeCloseTo(
        colours.get(vectorDb.id)!.tint + TINT_STEP,
      );
    }
  });

  // V-4 - the ring is the one surface where every group is on screen at once, so
  // it is the one place a hue may not repeat. Deeper down, two branches sharing a
  // hue is expected: the tint and the layout's containment say which is which.
  it.each(seeds)("never repeats a hue on the ring in %s", (_label, tree) => {
    const assigned = assignColours(tree);
    const ring = tree.filter((node) => node.depth === 1);
    const hues = ring.map((node) => assigned.get(node.id)!.token);

    expect(new Set(hues).size).toBe(ring.length);
    expect(hues).not.toContain(HUB_TOKEN);
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
      expect(after.get(node.id)).toEqual(colours.get(node.id));
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

  // The key lists the ring, and it draws the token flat - so a tinted ring topic
  // would be a topic whose swatch is not the colour it is drawn in.
  it("leaves the hub and the ring untinted, so the key matches the scene", () => {
    const { nodes: scene } = buildScene(seed);

    for (const node of scene) {
      if (node.depth <= 1) {
        expect(node.colourTint, node.name).toBe(0);
        expect(node.colourHueShift, node.name).toBe(0);
      } else {
        // Deeper down only the tint is guaranteed to move: an only child, and the
        // middle of an odd brood, sit on their parent's own hue and are told apart
        // by being lighter.
        expect(node.colourTint, node.name).toBeGreaterThan(0);
      }
    }
  });
});
