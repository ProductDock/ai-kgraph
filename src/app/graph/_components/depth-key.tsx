import { DEPTH_KEY, depthToken } from "@/lib/graph/palette";

/**
 * The inline depth key (spec C-2). Colour is never the only channel - the scene
 * also encodes depth as node radius and shell distance - but five steps of one hue
 * are five steps of one grey to a viewer with a colour-vision deficiency, so the
 * ramp needs naming somewhere. It reads `palette.ts`, the same source the scene
 * does, so the two cannot drift.
 *
 * This is the *inline* key in the route header, not the sidebar legend the intent
 * put out of scope.
 */
export function DepthKey() {
  return (
    <ul
      aria-label="What each colour means"
      className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
    >
      {DEPTH_KEY.map(({ depth, label }) => (
        <li key={depth} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: `var(${depthToken(depth)})` }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
