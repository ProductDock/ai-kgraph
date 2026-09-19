import { describe, expect, it } from "vitest";
import { flatten } from "@/lib/graph/tree";
import { layout } from "@/lib/graph/layout";
import { radiusForDepth } from "@/lib/graph/palette";
import type { GraphSceneNode, Vec3 } from "@/lib/graph/types";
import {
  declutter,
  LABEL_MAX_PX,
  LABEL_POOL_SIZE,
  selectLabelled,
} from "./graph-labels";

/** 148 nodes - the envelope NFR-1 was written against, not the day-one 36. */
function wideScene(): GraphSceneNode[] {
  const { nodes } = flatten({
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
  });
  const positions = layout(nodes);
  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) as Vec3,
    radius: radiusForDepth(node.depth),
  }));
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

  // FR-1, §9.2
  it("reserves the box on a centred label's own node, not above it", () => {
    const hub = { ...at("PD AI", 400, 300), centred: true };
    const below = at("Protocols", 400, 330);

    expect(declutter([hub, below])[1]!.opacity).toBe(0);
    // The same two labels with the hub drawn above its node like every other one:
    // its box sits a line higher and no longer reaches the second.
    expect(declutter([{ ...hub, centred: false }, below])[1]!.opacity).toBe(1);
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
