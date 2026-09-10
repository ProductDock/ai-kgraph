"use client";

import { isProduction } from "@/lib/env";

// Replaces the root layout when the layout itself throws, so it cannot rely
// on globals.css or the design tokens it defines - inline styles only.
export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          color: "#0b0b0b",
          background: "#f9f9f7",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ margin: 0, color: "#52514e" }}>{message}</p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #0b0b0b",
            background: "#0b0b0b",
            color: "#f9f9f7",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
