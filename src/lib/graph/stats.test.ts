import { describe, expect, it } from "vitest";
import { loadNodeContent } from "@/lib/graph/content";
import {
  FIXTURE_CONTENT_DIR,
  fixtureSeed,
} from "@/lib/graph/__fixtures__/seed";
import { buildScene } from "@/lib/graph/scene";
import { computeGraphStats } from "@/lib/graph/stats";
import type { GraphSceneNode, NodeContent } from "@/lib/graph/types";

const content = loadNodeContent(fixtureSeed, FIXTURE_CONTENT_DIR);

/** The fixture's content with one node's status overridden. */
function withStatus(
  id: string,
  status: NodeContent["status"],
): Map<string, NodeContent> {
  const next = new Map(content);
  next.set(id, { ...content.get(id)!, status });
  return next;
}

// V-1
describe("computeGraphStats over the fixture", () => {
  it("counts topics, not nodes, and counts a group by its own status", () => {
    // 13 nodes, less the hub. RAG is Done and Evals In Progress - both groups.
    expect(buildScene(fixtureSeed, content).stats).toEqual({
      totalTopics: 12,
      done: 1,
      inProgress: 1,
    });
  });

  it("counts a Done leaf alongside a Done group", () => {
    const { stats } = buildScene(
      fixtureSeed,
      withStatus("pd-ai/protocols/a2a", "Done"),
    );

    expect(stats).toEqual({ totalTopics: 12, done: 2, inProgress: 1 });
  });
});

// V-2
describe("the hub", () => {
  it("never counts, whatever its status says", () => {
    const { stats } = buildScene(fixtureSeed, withStatus("pd-ai", "Done"));

    expect(stats).toEqual({ totalTopics: 12, done: 1, inProgress: 1 });
  });
});

// V-3
describe("an empty graph", () => {
  it("returns zeros for a hub with nothing on it", () => {
    const hub: GraphSceneNode = {
      id: "pd-ai",
      name: "PD AI",
      depth: 0,
      parentId: null,
      leafCount: 1,
      hasChildren: false,
      assignee: "Unassigned",
      status: "Done",
      position: [0, 0, 0],
      radius: 1,
      colourToken: "--graph-hub",
      colourTint: 0,
      colourHueShift: 0,
    };

    expect(computeGraphStats([hub])).toEqual({
      totalTopics: 0,
      done: 0,
      inProgress: 0,
    });
  });
});
