import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function HomePage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">ai-kgraph</h1>
        <ThemeToggle />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Baseline is alive</CardTitle>
          <CardDescription>
            This is a Next.js App Router foundation for a knowledge-graph app
            over ai-kgraph&apos;s own SDLC artifacts. It ships no product
            screens yet - this page only confirms the toolchain, routing,
            styling and state seams work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            See <code>docs/</code> in this repository for the AI-Native SDLC
            this app runs on, and <code>CLAUDE.md</code> for how this app itself
            is put together.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
