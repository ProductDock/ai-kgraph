import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// ProductDock brand typeface (design-system skill). `variable` feeds
// --font-poppins, consumed by --font-sans in globals.css; `display: swap`
// keeps text visible while it loads.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ai-kgraph",
  description: "Knowledge-graph baseline for the ai-kgraph AI-Native SDLC.",
};

const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The inline script below sets data-theme on <html> before React hydrates,
    // so the attribute is always present on the client and never in the server
    // HTML. suppressHydrationWarning scopes that known, intended mismatch to
    // this element's own attributes — it does not extend to children.
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        {/* Sets data-theme before first paint to avoid a flash of the wrong
            theme (spec §7.3). Runs under CSP Report-Only, so no nonce yet. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground flex min-h-screen flex-col antialiased">
        <a
          href="#main-content"
          className="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:outline-2 focus:outline-offset-2"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
