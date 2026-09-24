import type { GraphSceneNode, GraphStats } from "./types";

/**
 * Count the graph's topics by status (graph-progress-stats spec). A topic is every
 * node but the hub: the hub cannot carry a status (`content/index.md` fails the
 * build), so counting it would keep 100% out of reach for good.
 *
 * A group counts by its own status, whatever is under it (spec C-3). Counts only -
 * the percentages are the panel's to derive, so nothing rounded crosses the wire.
 */
export function computeGraphStats(
  nodes: readonly GraphSceneNode[],
): GraphStats {
  const stats: GraphStats = { totalTopics: 0, done: 0, inProgress: 0 };
  for (const node of nodes) {
    if (node.parentId === null) continue;
    stats.totalTopics += 1;
    if (node.status === "Done") stats.done += 1;
    else if (node.status === "In Progress") stats.inProgress += 1;
  }
  return stats;
}
