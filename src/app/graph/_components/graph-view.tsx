"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewportSupported } from "@/hooks/use-viewport-supported";
import { useWebglSupport } from "@/hooks/use-webgl-support";
import type { GraphScene } from "@/lib/graph/types";
import { UnsupportedNotice } from "./unsupported-notice";

/**
 * `three` is reached only from here, and only through a dynamic import, so it
 * never sits at module scope and never lands in the home page's shared chunk
 * (spec NFR-3, R-8, V-9). `ssr: false` is why this component is client and
 * `page.tsx` is not - it cannot be used from a Server Component.
 */
const GraphSceneCanvas = dynamic(
  () => import("./graph-scene").then((module) => module.GraphSceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 p-6" aria-busy="true">
        <Skeleton className="size-full rounded-xl" />
      </div>
    ),
  },
);

/**
 * The gate, and nothing else (spec §7.9). Neither condition is knowable during
 * server rendering, so both read `null` until mounted and the page shows the
 * skeleton meanwhile - no hydration mismatch and no flash of the wrong state.
 */
export function GraphView({ scene }: { scene: GraphScene }) {
  const viewportSupported = useViewportSupported();
  const webglSupported = useWebglSupport();

  if (viewportSupported === null || webglSupported === null) {
    return (
      <div className="flex-1 p-6" aria-busy="true">
        <Skeleton className="size-full rounded-xl" />
      </div>
    );
  }

  // Viewport first: on a phone the screen is the reason, whether or not the
  // browser could have drawn it.
  if (!viewportSupported) return <UnsupportedNotice reason="viewport" />;
  if (!webglSupported) return <UnsupportedNotice reason="webgl" />;

  return <GraphSceneCanvas scene={scene} />;
}
