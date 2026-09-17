import { describe, expect, it } from "vitest";
import { layout, sceneRadius } from "@/lib/graph/layout";
import { radiusForDepth } from "@/lib/graph/palette";
import { seed } from "@/lib/graph/seed";
import { flatten } from "@/lib/graph/tree";
import type { GraphNode, Vec3 } from "@/lib/graph/types";

const { nodes } = flatten(seed);

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function lengthOf(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

/** 148 nodes - the envelope NFR-1 was written against, not the day-one 36. */
function syntheticSeed(): GraphNode[] {
  const wide: GraphNode[] = [];
  const children = Array.from({ length: 7 }, (_, area) => ({
    name: `Area ${area}`,
    children: Array.from({ length: 4 }, (_, topic) => ({
      name: `Topic ${topic}`,
      children: Array.from({ length: 4 }, (_, detail) => ({
        name: `Detail ${detail}`,
      })),
    })),
  }));
  wide.push(...flatten({ name: "AI", children }).nodes);
  return wide;
}

describe("layout", () => {
  // V-4
  it("is deterministic across runs", () => {
    expect([...layout(nodes)]).toEqual([...layout(nodes)]);
  });

  it("places every node, and only the root at the origin", () => {
    const positions = layout(nodes);

    expect(positions.size).toBe(nodes.length);
    expect(positions.get("ai")).toEqual([0, 0, 0]);
    expect(
      nodes.filter((node) => lengthOf(positions.get(node.id)!) === 0),
    ).toHaveLength(1);
  });

  it("puts each node on the shell its depth belongs to", () => {
    const positions = layout(nodes);
    const shellByDepth = new Map<number, number>();

    for (const node of nodes) {
      const radius = lengthOf(positions.get(node.id)!);
      const known = shellByDepth.get(node.depth);
      if (known === undefined) shellByDepth.set(node.depth, radius);
      else expect(radius).toBeCloseTo(known, 6);
    }
    // Shells are ordered outward, so depth is readable as distance from the hub.
    const shells = [...shellByDepth.entries()].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < shells.length; i += 1) {
      expect(shells[i]![1]).toBeGreaterThan(shells[i - 1]![1]);
    }
  });

  it("always places a child further from the origin than its parent", () => {
    const positions = layout(nodes);

    for (const node of nodes) {
      if (node.parentId === null) continue;
      expect(lengthOf(positions.get(node.id)!)).toBeGreaterThan(
        lengthOf(positions.get(node.parentId)!),
      );
    }
  });

  it.each([
    ["the day-one seed", nodes],
    ["a wider synthetic seed", syntheticSeed()],
  ])("keeps node centres apart in %s", (_label, tree) => {
    const positions = layout(tree);

    for (let i = 0; i < tree.length; i += 1) {
      for (let j = i + 1; j < tree.length; j += 1) {
        const a = tree[i]!;
        const b = tree[j]!;
        const floor =
          2.5 * Math.max(radiusForDepth(a.depth), radiusForDepth(b.depth));
        expect(
          distance(positions.get(a.id)!, positions.get(b.id)!),
        ).toBeGreaterThan(floor);
      }
    }
  });
});

describe("sceneRadius", () => {
  it("covers the outermost node", () => {
    const positions = layout(nodes);
    const outermost = Math.max(
      ...nodes.map((node) => lengthOf(positions.get(node.id)!)),
    );

    expect(sceneRadius(nodes)).toBeGreaterThanOrEqual(outermost);
  });
});
