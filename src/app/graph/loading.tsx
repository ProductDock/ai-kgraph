import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the route rather than showing a spinner - and this one earns its keep,
 * because the scene chunk is the largest download in the app (spec §7.10).
 */
export default function Loading() {
  return (
    <main aria-busy="true" className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b px-6 py-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-6">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="size-full rounded-xl" />
      </div>
      <p aria-live="polite" className="sr-only">
        Loading the AI knowledge graph.
      </p>
    </main>
  );
}
