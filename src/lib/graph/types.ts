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
  /** Slugified name path, e.g. `ai/n-node/rag/vector-db/pgvector`. */
  id: string;
  name: string;
  /** 0 for the root, capped at MAX_DEPTH (spec D-5). */
  depth: number;
  parentId: string | null;
  /** Leaves in this node's subtree; a leaf counts as 1. Drives layout (spec §7.7). */
  leafCount: number;
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
