/**
 * The graph's data shapes (spec §7.3). Framework-agnostic and renderer-agnostic:
 * everything here is plain numbers and strings, so the seed, the ids and the
 * geometry are all settled outside any rendering library (spec §3).
 */

/**
 * THE seed shape - names and children, nothing else (intent Constraints, FR-3).
 * The nesting *is* the parent relationship, so a cross-branch edge, a cycle or a
 * second parent is not expressible.
 */
export interface GraphSeed {
  name: string;
  children?: GraphSeed[];
}

/** A node after flattening: its id, where it sits, and how much hangs off it. */
export interface GraphNode {
  /** Slugified name path, e.g. `pd-ai/n-node/rag/vector-db/pgvector`. */
  id: string;
  name: string;
  /** 0 for the root, capped at MAX_DEPTH (spec D-5). */
  depth: number;
  parentId: string | null;
  /** Leaves in this node's subtree; a leaf counts as 1. Drives layout (spec §7.7). */
  leafCount: number;
  /**
   * Whether anything hangs off this node. Not derivable from `leafCount`: a node
   * with one leaf child and a childless leaf both count 1. Drives colour and size
   * (branch-colour spec §8.2, §8.4).
   */
  hasChildren: boolean;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
}

export type Vec3 = readonly [number, number, number];

/** A node with its computed place in the scene. */
export interface GraphSceneNode extends GraphNode {
  position: Vec3;
  radius: number;
  /**
   * The CSS custom property carrying this node's fill, resolved once at build time
   * rather than re-derived per frame (branch-colour spec §7). A token name, never a
   * hex: `globals.css` stays the one place a colour is spelled out.
   */
  colourToken: string;
}

/**
 * The prop payload the Server Component hands the client (spec §7.6): positions,
 * not an algorithm.
 */
export interface GraphScene {
  nodes: GraphSceneNode[];
  edges: GraphEdge[];
  /** Distance to the outermost shell, so the client frames the scene without
      re-deriving the layout's constants. */
  radius: number;
}
