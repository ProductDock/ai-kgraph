/**
 * The graph's data shapes (spec §7.3). Framework-agnostic and renderer-agnostic:
 * everything here is plain numbers and strings, so the seed, the ids and the
 * geometry are all settled outside any rendering library (spec §3).
 */

/**
 * How far along a topic is. A closed set, not free text: the card reads exactly one
 * of these three words and never any other (node-hover-card spec FR-4), and the
 * schema is what makes a fourth one a failed build rather than a surprise on screen.
 */
export type NodeStatus = "Todo" | "In Progress" | "Done";

/**
 * THE seed shape - names, children, and the two hand-authored facts a node carries
 * about the work (intent Constraints, FR-3; node-hover-card spec §7). The nesting
 * *is* the parent relationship, so a cross-branch edge, a cycle or a second parent
 * is not expressible.
 *
 * `assignee` and `status` are optional *here* and required on `GraphNode`: the
 * default is resolved once, in `flatten()`, rather than repeated by every consumer.
 */
export interface GraphSeed {
  name: string;
  children?: GraphSeed[];
  /** Who owns this topic. Free text, validated the same light way `name` is. */
  assignee?: string;
  status?: NodeStatus;
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
  /**
   * Who owns this topic, or `"Unassigned"`. Always present: `flatten()` resolves the
   * default for every node it visits, hub and ring topics included, with no exception
   * (node-hover-card spec §3 Q3, C-5).
   */
  assignee: string;
  /** How far along it is, defaulting to `"Todo"`, on the same terms as `assignee`. */
  status: NodeStatus;
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
  /**
   * OKLCH lightness to add to that token before drawing: 0 on the hub and on every
   * ring topic, one `TINT_STEP` more for each level below the ring, so a branch
   * reads as one colour getting lighter outwards (branch-family tint).
   */
  colourTint: number;
  /**
   * Degrees to turn that token around the OKLCH hue circle before drawing: 0 on the
   * hub and on every ring topic, and a fan across its siblings below that, so two
   * children of one node tell apart at leaf size where a lightness step alone reads
   * as flat. Bounded well inside `HUE_SPAN` of the branch root.
   */
  colourHueShift: number;
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
