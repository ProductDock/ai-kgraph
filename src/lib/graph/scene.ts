import { assignColours } from "@/lib/graph/colour";
import { layout, sceneRadius } from "@/lib/graph/layout";
import { radiusForNode } from "@/lib/graph/palette";
import { computeGraphStats } from "@/lib/graph/stats";
import { flatten } from "@/lib/graph/tree";
import type {
  GraphScene,
  GraphSceneNode,
  GraphSeed,
  NodeContent,
  Vec3,
} from "@/lib/graph/types";

/**
 * Validate, flatten, lay out. Runs in the Server Component at build time, so the
 * client receives positions rather than an algorithm (spec FR-10, §7.6).
 *
 * `content` supplies the two fields the card shows. It is a parameter rather than a
 * read of `content/` so this module stays filesystem-free; a node missing from it
 * reads the same defaults `content.ts` applies, which is what lets synthetic-seed
 * tests call this with no content at all. Content never feeds layout, colour or
 * radius (node-content-pages spec §9.7).
 */
export function buildScene(
  seed: GraphSeed,
  content: ReadonlyMap<string, NodeContent> = new Map(),
): GraphScene {
  const { nodes, edges } = flatten(seed);
  const positions = layout(nodes);
  const colours = assignColours(nodes);

  const sceneNodes: GraphSceneNode[] = nodes.map((node) => ({
    ...node,
    assignee: content.get(node.id)?.assignee ?? "Unassigned",
    status: content.get(node.id)?.status ?? "Todo",
    position: positions.get(node.id) as Vec3,
    radius: radiusForNode(node),
    colourToken: colours.get(node.id)!.token,
    colourTint: colours.get(node.id)!.tint,
    colourHueShift: colours.get(node.id)!.hueShift,
  }));

  return {
    nodes: sceneNodes,
    edges,
    radius: sceneRadius(nodes),
    stats: computeGraphStats(sceneNodes),
  };
}
