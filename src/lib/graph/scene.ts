import { layout, sceneRadius } from "@/lib/graph/layout";
import { radiusForDepth } from "@/lib/graph/palette";
import { flatten } from "@/lib/graph/tree";
import type { GraphScene, GraphSeed, Vec3 } from "@/lib/graph/types";

/**
 * Validate, flatten, lay out. Runs in the Server Component at build time, so the
 * client receives positions rather than an algorithm (spec FR-10, §7.6).
 */
export function buildScene(seed: GraphSeed): GraphScene {
  const { nodes, edges } = flatten(seed);
  const positions = layout(nodes);

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: positions.get(node.id) as Vec3,
      radius: radiusForDepth(node.depth),
    })),
    edges,
    radius: sceneRadius(nodes),
  };
}
