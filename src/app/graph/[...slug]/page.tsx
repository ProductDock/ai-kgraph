import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROSE_LINK } from "@/components/common/link-styles";
import { MarkdownBody } from "@/components/common/markdown-body";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { loadNodeContent } from "@/lib/graph/content";
import {
  breadcrumb,
  keyTopics,
  nodeAddress,
  nodeHref,
  nodeIdFromAddress,
} from "@/lib/graph/paths";
import { seed } from "@/lib/graph/seed";
import { flatten } from "@/lib/graph/tree";

/**
 * A node's own page (node-content-pages spec §9.3). Every non-hub node is prerendered
 * from `generateStaticParams`.
 *
 * `dynamicParams` is `true`, deliberately, and the `notFound()` below is what rejects
 * an unknown address - a deviation from the spec's `false`, recorded in the plan
 * (R-1). Measured: under `false` an unmatched `/graph/<x>` 404s from the router
 * *without* reaching this segment, so the sitewide "Back to home" page renders instead
 * of `graph/not-found.tsx`'s "Back to the graph" (FR-9). Under `true` every known
 * page is still prerendered at build time; only an address outside the list renders
 * on request, and all it does is fail the lookup and call `notFound()`.
 *
 * A Server Component, and so is everything it renders except the theme toggle: a
 * content page ships no JavaScript of its own (spec §8).
 */
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams(): { slug: string[] }[] {
  return flatten(seed)
    .nodes.filter((node) => node.parentId !== null)
    .map((node) => ({ slug: nodeAddress(node.id).split("/") }));
}

async function resolveNode(params: Props["params"]) {
  const { slug } = await params;
  const { nodes } = flatten(seed);
  const id = nodeIdFromAddress(nodes[0]!.id, slug.join("/"));
  const node = nodes.find((candidate) => candidate.id === id);
  return { nodes, node };
}

// The tab reads the node's own name, never a frontmatter `title` (spec Q6).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { node } = await resolveNode(params);
  return node ? { title: node.name } : {};
}

/** Chrome links: ink, gaining the underline on hover (design-system skill). */
const CHROME_LINK =
  "text-foreground text-sm font-medium underline-offset-4 hover:text-foreground hover:underline";

export default async function NodePage({ params }: Props) {
  const { nodes, node } = await resolveNode(params);
  if (!node) notFound();

  const content = loadNodeContent(seed).get(node.id)!;
  const trail = breadcrumb(nodes, node.id);
  const children = keyTopics(nodes, node.id);

  return (
    // The root layout's skip link targets #main-content (layout.tsx).
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/graph" className={CHROME_LINK}>
            <span aria-hidden="true">← </span>Back to AI Learning Graph
          </Link>
          <Link
            href={`/graph?focus=${nodeAddress(node.id)}`}
            className={CHROME_LINK}
          >
            View Graph
          </Link>
        </div>
        <ThemeToggle />
      </header>

      <nav aria-label="Breadcrumb">
        <ol className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {trail.map((ancestor) => (
            <li key={ancestor.id} className="flex items-center gap-2">
              <Link
                href={
                  ancestor.parentId === null ? "/graph" : nodeHref(ancestor.id)
                }
                className="underline-offset-4 hover:text-[var(--text-primary)] hover:underline"
              >
                {ancestor.name}
              </Link>
              <span aria-hidden="true">›</span>
            </li>
          ))}
          <li aria-current="page" className="text-foreground">
            {node.name}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-3">
        <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.02em]">
          {content.title}
        </h1>
        {content.tags.length > 0 && (
          <ul aria-label="Tags" className="flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <li
                key={tag}
                className="text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="grid w-fit grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Assignee</dt>
        <dd>{content.assignee}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{content.status}</dd>
      </dl>

      {/* Keyed on the body, not on whether a file exists: a file that only
          carries owner/status reads the same as no file (spec D-4). */}
      {content.body === "" ? (
        <p className="text-muted-foreground">No content yet.</p>
      ) : (
        <MarkdownBody>{content.body}</MarkdownBody>
      )}

      {/* A leaf has no section at all, rather than an empty heading. */}
      {children.length > 0 && (
        <section aria-labelledby="key-topics" className="border-t pt-6">
          <h2 id="key-topics" className="text-2xl leading-tight font-semibold">
            Key Topics
          </h2>
          <ul className="mt-4 space-y-2">
            {children.map((child) => (
              <li key={child.id}>
                <Link href={nodeHref(child.id)} className={PROSE_LINK}>
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
