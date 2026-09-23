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
 * THE seed shape - names and nesting, nothing else. The nesting *is* the parent
 * relationship, so a cross-branch edge, a cycle or a second parent is not
 * expressible. What a node says about the work - owner, status, prose - lives in
 * its content file under `content/`, not here (node-content-pages spec §9.2).
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

/**
 * What a node's content file says, with every default already applied - one of
 * these exists for every node, file or no file (node-content-pages spec §9.1).
 * Resolved once, in `content.ts`, so no consumer ever has to know what an
 * unauthored node reads as.
 */
export interface NodeContent {
  /** The page heading. Defaults to the node's own name; never the tab title. */
  title: string;
  /** Lower-cased and de-duplicated. Inert labels, never links. */
  tags: string[];
  /** Who owns this topic, or `"Unassigned"`. */
  assignee: string;
  /** How far along it is, defaulting to `"Todo"`. */
  status: NodeStatus;
  /** Markdown with the frontmatter stripped and trimmed; `""` reads "No content yet". */
  body: string;
  /** Whether a file backs this node at all. The page never keys on it (spec D-4). */
  hasFile: boolean;
}

/**
 * A node with its computed place in the scene, plus the two content fields the card
 * shows. `buildScene()` merges those in at the same point `flatten()` used to set
 * them, so the card and the scene read the same two fields they always did.
 */
export interface GraphSceneNode
  extends GraphNode, Pick<NodeContent, "assignee" | "status"> {
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
