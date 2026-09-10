import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { ContentDoc, ContentSource } from "@/lib/content/types";

const REPO_ROOT = process.cwd();

const SOURCE_DIRS: Record<ContentSource, string> = {
  docs: join(REPO_ROOT, "docs"),
  intent: join(REPO_ROOT, "intent"),
  skills: join(REPO_ROOT, ".claude", "skills"),
};

function walkMarkdownFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Slugs are derived from what actually exists on disk, never from user
 * input - a slug that resolves through this map can never have been a
 * `../` traversal, because traversal segments never appear here (spec
 * §8.7). This is rebuilt on each call rather than cached at module scope,
 * since it only ever runs at build time.
 */
function buildAllowList(source: ContentSource): Map<string, string> {
  const rootDir = SOURCE_DIRS[source];
  const allowList = new Map<string, string>();

  let files: string[];
  try {
    files = walkMarkdownFiles(rootDir);
  } catch {
    return allowList;
  }

  for (const filePath of files) {
    const slug = relative(rootDir, filePath)
      .replaceAll(sep, "/")
      .replace(/\.md$/, "");
    allowList.set(slug, filePath);
  }
  return allowList;
}

export function listSlugs(source: ContentSource): string[] {
  return [...buildAllowList(source).keys()];
}

export function readDoc(source: ContentSource, slug: string): ContentDoc {
  const allowList = buildAllowList(source);
  const filePath = allowList.get(slug);
  if (!filePath) {
    throw new Error(`Unknown ${source} slug: ${slug}`);
  }

  return {
    source,
    slug,
    path: relative(REPO_ROOT, filePath),
    content: readFileSync(filePath, "utf-8"),
  };
}
