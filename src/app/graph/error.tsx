"use client";

import { Button } from "@/components/ui/button";
import { isProduction } from "@/lib/env";

// Same rule as src/app/error.tsx: Next redacts server error messages in
// production but not client ones, so error.message is never rendered there, even
// "just for now" (baseline spec §8.6).
export default function GraphError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = isProduction
    ? `Something went wrong.${error.digest ? ` (ref: ${error.digest})` : ""}`
    : error.message;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">The graph could not be drawn</h1>
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
