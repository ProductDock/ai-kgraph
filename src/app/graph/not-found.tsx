import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * The graph-scoped "not found" (node-content-pages spec D-2, C-5): a typo'd or stale
 * topic address points back to the graph, not to home. The sitewide
 * `app/not-found.tsx` is unchanged and still covers everything else.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-sm">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild>
        <Link href="/graph">Back to the graph</Link>
      </Button>
    </main>
  );
}
