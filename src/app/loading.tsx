import { Skeleton } from "@/components/ui/skeleton";

// Matches the shape of page.tsx rather than a centred spinner - a spinner
// tells the user nothing and causes a layout shift when content arrives.
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </main>
  );
}
