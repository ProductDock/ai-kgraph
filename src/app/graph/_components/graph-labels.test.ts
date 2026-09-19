import { describe, expect, it } from "vitest";
import { buildScene } from "@/lib/graph/scene";
import type { GraphSceneNode, Vec3 } from "@/lib/graph/types";
import {
  declutter,
  LABEL_MAX_PX,
  LABEL_POOL_SIZE,
  labelOffsetPx,
  MIN_GAP_PX,
  selectLabelled,
} from "./graph-labels";

/** 148 nodes - the envelope NFR-1 was written against, not the day-one 36. */
function wideScene(): GraphSceneNode[] {
  return buildScene({
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
  }).nodes;
}

const nodes = wideScene();
const camera: Vec3 = [0, 20, 80];

describe("selectLabelled", () => {
  // V-14
  it("never returns more than the pool, and always the root", () => {
    expect(nodes.length).toBeGreaterThan(LABEL_POOL_SIZE);

    const selected = selectLabelled(nodes, camera, null);

    expect(selected).toHaveLength(LABEL_POOL_SIZE);
    expect(selected.map((node) => node.id)).toContain("ai");
  });

  it("always includes the focused node, however far away it is", () => {
    const farthest = [...nodes].sort(
      (a, b) =>
        Math.hypot(
          ...([0, 1, 2].map((i) => b.position[i]! - camera[i]!) as [
            number,
            number,
            number,
          ]),
        ) -
        Math.hypot(
          ...([0, 1, 2].map((i) => a.position[i]! - camera[i]!) as [
            number,
            number,
            number,
          ]),
        ),
    )[0]!;

    const selected = selectLabelled(nodes, camera, farthest.id);

    expect(selected.map((node) => node.id)).toContain(farthest.id);
    expect(selected).toHaveLength(LABEL_POOL_SIZE);
  });

  it("prefers nearer nodes, and breaks ties on shallower depth", () => {
    const selected = selectLabelled(nodes, camera, null);
    const unselected = nodes.filter(
      (node) => !selected.includes(node) && node.parentId !== null,
    );

    const distance = (node: GraphSceneNode) =>
      Math.hypot(
        node.position[0] - camera[0],
        node.position[1] - camera[1],
        node.position[2] - camera[2],
      );
    const worstSelected = Math.max(
      ...selected.filter((node) => node.parentId !== null).map(distance),
    );

    expect(Math.min(...unselected.map(distance))).toBeGreaterThanOrEqual(
      worstSelected,
    );

    // Two nodes the same distance away: the shallower one is the one that keeps a
    // label, so a branch boundary resolves the same way every frame.
    const mirrored: GraphSceneNode[] = [
      {
        ...nodes[0]!,
        id: "deep",
        depth: 3,
        parentId: "ai",
        position: [0, 0, 0],
      },
      {
        ...nodes[0]!,
        id: "shallow",
        depth: 1,
        parentId: "ai",
        position: [0, 0, 0],
      },
    ];
    expect(selectLabelled(mirrored, camera, null)[0]!.id).toBe("shallow");
  });

  it("is stable: the same camera gives the same labels", () => {
    expect(selectLabelled(nodes, camera, null)).toEqual(
      selectLabelled(nodes, camera, null),
    );
  });
});

describe("declutter", () => {
  const at = (text: string, x: number, y: number) => ({
    text,
    x,
    y,
    opacity: 1,
  });

  it("hides a label that would land on one already placed", () => {
    const result = declutter([
      at("AI Agents", 400, 300),
      at("Workflows", 402, 302),
    ]);

    expect(result[0]!.opacity).toBe(1);
    expect(result[1]!.opacity).toBe(0);
  });

  it("keeps labels that clear each other", () => {
    const result = declutter([
      at("AI Agents", 400, 300),
      at("Workflows", 400, 400),
    ]);

    expect(result.map((placement) => placement.opacity)).toEqual([1, 1]);
  });

  it("keeps the earlier label, which is the root, the focused node, or the nearer one", () => {
    const result = declutter([at("AI", 400, 300), at("pgvector", 400, 300)]);

    expect(result[0]!.text).toBe("AI");
    expect(result[0]!.opacity).toBe(1);
    expect(result[1]!.opacity).toBe(0);
  });

  it("leaves already-faded labels alone and never lets them block a visible one", () => {
    const faded = { ...at("faded", 400, 300), opacity: 0 };
    const result = declutter([faded, at("visible", 400, 300)]);

    expect(result[1]!.opacity).toBe(1);
  });

  // V-6, FR-2
  it("reserves a box below the anchor, never above it", () => {
    // A label a full line *above* another's anchor clears it: `y` is now the top
    // of the text, so a box occupies one line downward and nothing upward.
    expect(
      declutter([at("AI", 400, 300), at("Protocols", 400, 285)]).map(
        (placement) => placement.opacity,
      ),
    ).toEqual([1, 1]);

    // Eight pixels below is inside it, and the earlier label wins.
    expect(
      declutter([at("AI", 400, 300), at("Protocols", 400, 308)])[1]!.opacity,
    ).toBe(0);
  });

  // FR-8
  it("reserves no more width than a truncated label actually draws", () => {
    const long = "A very long topic title that the label has to truncate";
    const result = declutter([
      at(long, 400, 300),
      at(long, 400 + LABEL_MAX_PX + 8, 300),
    ]);

    // Two labels a truncation width apart both survive: the ellipsis is where the
    // text stops, so that is where the box has to stop too.
    expect(result.map((placement) => placement.opacity)).toEqual([1, 1]);
  });

  it("does not change how many elements the pool is given", () => {
    const placements = Array.from({ length: LABEL_POOL_SIZE }, (_, i) =>
      at(`Node ${i}`, 400, 300),
    );

    expect(declutter(placements)).toHaveLength(LABEL_POOL_SIZE);
  });
});

describe("labelOffsetPx", () => {
  const height = 800;
  const fov = 50;

  // V-3
  it("pushes a bigger circle's label further down, in proportion to its radius", () => {
    const hub = labelOffsetPx(2.6, 40, height, fov);
    const leaf = labelOffsetPx(0.42, 40, height, fov);

    expect(hub).toBeGreaterThan(leaf);
    // Both are clear of the floor, so the offsets carry the radius ratio intact.
    expect(leaf).toBeGreaterThan(MIN_GAP_PX);
    expect(hub / leaf).toBeCloseTo(2.6 / 0.42, 6);
  });

  // V-4
  it("shrinks as the camera backs away, because the circle does", () => {
    expect(labelOffsetPx(0.42, 20, height, fov)).toBeGreaterThan(
      labelOffsetPx(0.42, 80, height, fov),
    );
  });

  // V-5
  it("never closes the gap entirely, however small the circle gets", () => {
    expect(labelOffsetPx(0.42, 100000, height, fov)).toBe(MIN_GAP_PX);
  });

  it("does not divide by zero when the camera is on the node", () => {
    expect(labelOffsetPx(0.42, 0, height, fov)).toBe(MIN_GAP_PX);
  });
});
