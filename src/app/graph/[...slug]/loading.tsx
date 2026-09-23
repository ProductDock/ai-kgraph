import { Skeleton } from "@/components/ui/skeleton";

/**
 * The content page's own skeleton. Without it the parent `graph/loading.tsx` wraps
 * these pages too, and navigating between topics would flash the *graph's*
 * skeleton and announce "Loading the AI knowledge graph".
 */
export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8"
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-9 w-80" />
      <Skeleton className="h-10 w-40" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <p aria-live="polite" className="sr-only">
        Loading the topic page.
      </p>
    </main>
  );
}
