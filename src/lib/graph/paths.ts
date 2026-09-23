import type { GraphNode } from "@/lib/graph/types";

/**
 * Node ids to page addresses and back (node-content-pages spec §9.3). Pure string
 * work with no `node:fs`: the hover card imports this, so it has to be safe in the
 * scene's client bundle, unlike `content.ts`.
 *
 * An address is the id with the root segment dropped - `pd-ai/n-node/rag` lives at
 * `/graph/n-node/rag`. The hub's address is empty, because `/graph` is its page.
 */
export function nodeAddress(id: string): string {
  const slash = id.indexOf("/");
  return slash === -1 ? "" : id.slice(slash + 1);
}

/** The page a node's card links to. Never called for the hub, which has no page. */
export function nodeHref(id: string): string {
  return `/graph/${nodeAddress(id)}`;
}

/**
 * The inverse of `nodeAddress`, given the root's id. Returns `null` for an empty
 * address rather than the hub's id: nothing that takes an address - the page route,
 * `?focus=` - has a meaning for the hub.
 */
export function nodeIdFromAddress(
  rootId: string,
  address: string,
): string | null {
  return address === "" ? null : `${rootId}/${address}`;
}

/** A node's ancestors, hub first, not including the node itself. */
export function breadcrumb(
  nodes: readonly GraphNode[],
  id: string,
): GraphNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const trail: GraphNode[] = [];
  let parentId = byId.get(id)?.parentId ?? null;
  while (parentId !== null) {
    const parent = byId.get(parentId);
    if (!parent) break;
    trail.unshift(parent);
    parentId = parent.parentId;
  }
  return trail;
}

/**
 * A node's children, in the order the seed lists them - `flatten()` emits nodes in
 * reading order, so a filter keeps it and no second ordering rule appears (spec §9.3).
 */
export function keyTopics(
  nodes: readonly GraphNode[],
  id: string,
): GraphNode[] {
  return nodes.filter((node) => node.parentId === id);
}
