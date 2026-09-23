import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import {
  MAX_ASSIGNEE_LENGTH,
  MAX_NAME_LENGTH,
  nodeStatusSchema,
  trimmedString,
} from "@/lib/graph/schema";
import { flatten } from "@/lib/graph/tree";
import type { GraphNode, GraphSeed, NodeContent } from "@/lib/graph/types";

/**
 * A node's content file, `content/<address>/index.md` or `content/<address>.md`
 * (node-content-pages spec §9.1). Build-time only: this reads the filesystem, so it
 * is imported by Server Components and never by anything in the scene's bundle.
 */

/** A tag is a short inert label; the same bound a name carries is ample. */
const MAX_TAG_LENGTH = MAX_NAME_LENGTH;

/**
 * `.strict()` for the same reason the seed is: a misspelled `staus` that silently
 * does nothing looks identical to a node nobody has written about (spec §9.1, #3).
 * The string rules are the seed's own, imported rather than restated.
 */
const frontmatterSchema = z.strictObject({
  title: trimmedString(MAX_NAME_LENGTH).optional(),
  tags: z.array(trimmedString(MAX_TAG_LENGTH)).optional(),
  status: nodeStatusSchema.optional(),
  assignee: trimmedString(MAX_ASSIGNEE_LENGTH).optional(),
});

/**
 * gray-matter evaluates `---js` frontmatter with `eval`. Everything here is
 * committed, reviewed data, but a build step that runs code out of a markdown file is
 * not something this feature needs, so that engine is replaced with a refusal.
 * Passing options also turns off gray-matter's module-level parse cache.
 */
const MATTER_OPTIONS = {
  engines: {
    javascript: () => {
      throw new Error("only YAML frontmatter is supported");
    },
  },
};

export interface ContentFile {
  /** Path relative to `content/`, forward slashes: `n-node/rag/index.md`. */
  path: string;
  raw: string;
}

function fail(path: string, reason: string): never {
  throw new Error(`Invalid content - content/${path}: ${reason}`);
}

/** `n-node/rag/index.md` and `n-node/rag.md` both address `n-node/rag`. */
function addressFromPath(path: string): string {
  return path.replace(/(^|\/)index\.md$/, "").replace(/\.md$/, "");
}

function defaults(node: GraphNode): NodeContent {
  return {
    title: node.name,
    tags: [],
    assignee: "Unassigned",
    status: "Todo",
    body: "",
    hasFile: false,
  };
}

function parse(file: ContentFile, node: GraphNode): NodeContent {
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(file.raw, MATTER_OPTIONS);
  } catch (error) {
    fail(file.path, `frontmatter could not be parsed (${String(error)})`);
  }

  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const where = issue.path.join(".");
        return where ? `${where}: ${issue.message}` : issue.message;
      })
      .join("; ");
    fail(file.path, details);
  }

  const data = result.data;
  const fallback = defaults(node);
  return {
    title: data.title ?? fallback.title,
    // Case-only duplicates are the same tag, silently - tags are cosmetic, and a
    // failed build is reserved for the five conditions below (spec §9.1).
    tags: [...new Set((data.tags ?? []).map((tag) => tag.toLowerCase()))],
    assignee: data.assignee ?? fallback.assignee,
    status: data.status ?? fallback.status,
    body: parsed.content.trim(),
    hasFile: true,
  };
}

/**
 * Matches files to nodes, validates them and applies the defaults, returning an
 * entry for **every** node - no consumer ever sees a missing one. Pure, so the five
 * build failures are unit-testable without a filesystem (spec §9.1):
 *
 * 1. a file matches no node; 2. two files match the same node; 3. an unknown
 * frontmatter key; 4. a `status` outside the closed set; 5. `content/index.md`,
 * which would be the hub's, and the hub has no page.
 *
 * Every one names the file. Ids come only from the files' own paths, never from a
 * request, so there is no traversal surface here (spec §10).
 */
export function resolveNodeContent(
  nodes: readonly GraphNode[],
  files: readonly ContentFile[],
): Map<string, NodeContent> {
  const root = nodes.find((node) => node.parentId === null);
  if (!root) throw new Error("Invalid content - the tree has no root");
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const claimed = new Map<string, string>();
  const matched: { file: ContentFile; node: GraphNode }[] = [];

  // The hub check runs first, so `content/index.md` reads as what it is rather than
  // as "matches no node" - its derived address is empty, which matches nothing.
  for (const file of files) {
    if (addressFromPath(file.path) === "") {
      fail(file.path, "the hub has no page - `/graph` is its page");
    }
  }

  for (const file of files) {
    const id = `${root.id}/${addressFromPath(file.path)}`;
    const node = byId.get(id);
    if (!node) {
      fail(
        file.path,
        `matches no node in the tree (looked for "${id}"). Was the topic renamed or removed in seed.ts?`,
      );
    }
    const earlier = claimed.get(id);
    if (earlier) {
      fail(
        file.path,
        `"${id}" already has content/${earlier} - a node has one file, as <address>/index.md or <address>.md, never both`,
      );
    }
    claimed.set(id, file.path);
    matched.push({ file, node });
  }

  const content = new Map(nodes.map((node) => [node.id, defaults(node)]));
  for (const { file, node } of matched) {
    content.set(node.id, parse(file, node));
  }
  return content;
}

/** Same walk as `lib/content/read.ts`, kept separate because the matching differs. */
function walkMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function readContentFiles(dir: string): ContentFile[] {
  let paths: string[];
  try {
    paths = walkMarkdownFiles(dir);
  } catch {
    // No `content/` directory is no files, not an error: every node defaults.
    return [];
  }
  return paths.sort().map((fullPath) => ({
    path: relative(dir, fullPath).replaceAll(sep, "/"),
    raw: readFileSync(fullPath, "utf-8"),
  }));
}

/**
 * Every node's content, read from `content/` at build time. Runs once per generated
 * page as well as for `/graph`; the tree is small enough that this is cheap, and
 * memoising it is a follow-up if it ever is not (spec §8).
 */
export function loadNodeContent(
  seed: GraphSeed,
  dir: string = join(process.cwd(), "content"),
): Map<string, NodeContent> {
  return resolveNodeContent(flatten(seed).nodes, readContentFiles(dir));
}
