"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeQueryClient } from "@/lib/query/client";
import { isProduction } from "@/lib/env";

// The only 'use client' module in the root tree (spec §7.7.1). `children` is
// passed in as a prop, never imported here, so it stays server-rendered -
// marking layout.tsx itself 'use client' would silently client-bundle the
// whole app.
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {!isProduction && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
