import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { buildScene } from "@/lib/graph/scene";
import { seed } from "@/lib/graph/seed";
import { BranchKey } from "./_components/branch-key";
import { GraphView } from "./_components/graph-view";

export const metadata: Metadata = {
  title: "AI knowledge graph",
  description:
    "The AI topics we are learning about, as a tree you can move around in.",
};

/**
 * Server Component. The seed is an import and the layout is synchronous, so there
 * is no fetch, no cache decision and no dynamic API - the route prerenders (FR-10).
 * Per CLAUDE.md's state table this is server data for initial render: no React
 * Query, no Zustand, no new store.
 *
 * It never imports `three`. The renderer enters the tree behind the client gate in
 * `graph-view.tsx`, which is what keeps it out of the home page's chunk (NFR-3).
 */
export default function GraphPage() {
  const scene = buildScene(seed);

  return (
    // The root layout's skip link targets #main-content and nothing else on this
    // route provides it (layout.tsx:45).
    <main id="main-content" className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b px-6 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.02em]">
            AI knowledge graph
          </h1>
          <Link
            href="/"
            className="text-primary w-fit text-sm hover:text-[var(--text-primary)] hover:underline"
          >
            Back to home
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <BranchKey
            topics={scene.nodes.filter((node) => node.depth === 1)}
          />
          {/* Page-level in this repo rather than in the layout, so a new route
              silently loses it unless it asks. */}
          <ThemeToggle />
        </div>
      </header>

      <GraphView scene={scene} />
    </main>
  );
}
