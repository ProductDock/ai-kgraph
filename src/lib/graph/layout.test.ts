import { describe, expect, it } from "vitest";
import { layout, sceneRadius } from "@/lib/graph/layout";
import { HUB_RADIUS, radiusForNode } from "@/lib/graph/palette";
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

/** Angle around the ring's vertical axis, in radians. */
function azimuthOf(v: Vec3): number {
  return Math.atan2(v[2], v[0]);
}

/** The smaller of the two ways round between two azimuths. */
function azimuthGap(a: number, b: number): number {
  const raw = Math.abs(a - b) % (2 * Math.PI);
  return raw > Math.PI ? 2 * Math.PI - raw : raw;
}

const ring = nodes.filter((node) => node.depth === 1);

/** Which ring topic a node's branch hangs off, for every node below the ring. */
function ringTopicOf(): Map<string, string> {
  const topics = new Map<string, string>();
  for (const node of nodes) {
    if (node.depth === 1) topics.set(node.id, node.id);
    else if (node.parentId && topics.has(node.parentId)) {
      topics.set(node.id, topics.get(node.parentId)!);
    }
  }
  return topics;
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
    expect(positions.get("pd-ai")).toEqual([0, 0, 0]);
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

  // V-1
  it("puts the root's children on one horizontal ring", () => {
    const positions = layout(nodes);
    expect(ring.length).toBeGreaterThan(1);

    const [first, ...rest] = ring.map((node) => positions.get(node.id)!);
    for (const position of rest) {
      expect(lengthOf(position)).toBeCloseTo(lengthOf(first!), 9);
      // One elevation, so depth 1 is a circle rather than a spherical shell - the
      // thing that makes the ring read as a ring from every allowed camera angle.
      expect(position[1]).toBeCloseTo(first![1], 9);
    }
  });

  // V-2
  it("gives every ring topic the same slice, whatever it carries", () => {
    const positions = layout(nodes);
    // The decision under test is only meaningful if the topics differ in size
    // (spec §3, Q3): equal arcs for equal branches would prove nothing.
    expect(new Set(ring.map((node) => node.leafCount)).size).toBeGreaterThan(1);

    const azimuths = ring
      .map((node) => azimuthOf(positions.get(node.id)!))
      .sort((a, b) => a - b);
    const slice = (2 * Math.PI) / ring.length;

    for (let i = 1; i < azimuths.length; i += 1) {
      expect(azimuths[i]! - azimuths[i - 1]!).toBeCloseTo(slice, 9);
    }
  });

  // V-3
  it("leaves a wider gap between hub and ring than between any later shells", () => {
    const positions = layout(nodes);
    const shells = [
      ...new Map(
        nodes.map((node) => [node.depth, lengthOf(positions.get(node.id)!)]),
      ).entries(),
    ].sort((a, b) => a[0] - b[0]);

    // The hub is a sphere at the origin, so the gap a viewer sees starts at its
    // surface, not at its centre.
    const hubToRing = shells[1]![1] - HUB_RADIUS;
    const laterGaps = shells
      .slice(2)
      .map((shell, index) => shell[1] - shells[index + 1]![1]);

    expect(laterGaps.length).toBeGreaterThan(0);
    expect(hubToRing).toBeGreaterThan(Math.max(...laterGaps));
  });

  // V-5
  it("gives a ring topic with nothing under it its place on the ring anyway", () => {
    const { nodes: sparse } = flatten({
      name: "AI",
      children: [
        { name: "Full", children: [{ name: "Child" }] },
        { name: "Empty" },
      ],
    });
    const positions = layout(sparse);
    const empty = sparse.find((node) => node.name === "Empty")!;
    const full = sparse.find((node) => node.name === "Full")!;

    expect(positions.size).toBe(sparse.length);
    expect(lengthOf(positions.get(empty.id)!)).toBeCloseTo(
      lengthOf(positions.get(full.id)!),
      9,
    );
  });

  // FR-4
  it("keeps every branch inside its own topic's slice of the ring", () => {
    const positions = layout(nodes);
    const topics = ringTopicOf();
    // Half a slice is where a neighbour's territory begins: stay inside it and two
    // branches can never interleave, however deep either one runs.
    const halfSlice = Math.PI / ring.length;

    for (const [id, topicId] of topics) {
      expect(
        azimuthGap(
          azimuthOf(positions.get(id)!),
          azimuthOf(positions.get(topicId)!),
        ),
      ).toBeLessThan(halfSlice);
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
        const floor = 2.5 * Math.max(radiusForNode(a), radiusForNode(b));
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
