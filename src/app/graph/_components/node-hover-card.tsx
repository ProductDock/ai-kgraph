"use client";

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { NodeStatus } from "@/lib/graph/types";

/**
 * How wide the card may get before its text is cut off with an ellipsis (spec §9.3,
 * §4 D-5). Sibling to `LABEL_MAX_PX`, and a tuning value rather than an invariant:
 * what the tests hold is that a long name truncates instead of widening the card, not
 * that the bound is this number.
 *
 * Wider than a label, because unlike a label this is where a title is actually read -
 * and still narrow enough to sit beside a node on a tablet in portrait.
 */
export const CARD_MAX_PX = 240;

/** What the card shows. Four rows, in this order, always (FR-2). */
export interface NodeCardContent {
  name: string;
  assignee: string;
  status: NodeStatus;
}

/**
 * Where the node is, in container pixels, and how much room to leave beside it.
 * `gapPx` is `labelOffsetPx()` - the node's projected radius plus a proportional
 * gap - so the card clears the circle at any zoom, the same relationship a label
 * already uses vertically.
 */
export interface CardAnchor {
  nodeX: number;
  nodeY: number;
  gapPx: number;
  containerWidth: number;
  containerHeight: number;
}

export interface CardPlacement {
  x: number;
  y: number;
  side: "left" | "right";
}

/**
 * Where the card goes: beside the node, defaulting to its right, flipping to its
 * left when the right would run past the container's edge, then clamped on both
 * axes so it is always fully inside (FR-9, V-9).
 *
 * Vertically it is centred on the node rather than hung below it: the card is tall
 * enough that hanging it below would push it off the bottom for any node in the
 * lower half of the frame, where the clamp would then slide it away from its own
 * node every time.
 *
 * Pure, and takes the card's measured size rather than reading the DOM, so it is
 * testable without a GPU or a layout - and so the per-frame path never measures.
 */
export function cardPlacement(
  anchor: CardAnchor,
  cardWidth: number,
  cardHeight: number,
): CardPlacement {
  const { nodeX, nodeY, gapPx, containerWidth, containerHeight } = anchor;

  const rightX = nodeX + gapPx;
  // The flip is decided on the *unclamped* position: clamping first would slide the
  // card back inside and it would never flip, ending up on top of its own node.
  const side: "left" | "right" =
    rightX + cardWidth > containerWidth ? "left" : "right";
  const x = side === "right" ? rightX : nodeX - gapPx - cardWidth;
  const y = nodeY - cardHeight / 2;

  // `Math.max(0, ...)` last, so a card larger than its container hangs off the
  // bottom-right rather than off the top-left, where the content starts.
  return {
    x: Math.max(0, Math.min(x, containerWidth - cardWidth)),
    y: Math.max(0, Math.min(y, containerHeight - cardHeight)),
    side,
  };
}

export interface NodeHoverCardHandle {
  /** Open the card, or swap its content if it is already open. */
  show(content: NodeCardContent): void;
  /** Move it to its node. Cheap: no React state, no DOM measurement. */
  place(anchor: CardAnchor): void;
  hide(): void;
}

/**
 * The hover card: one overlay subtree, shown or hidden, never one per node (spec
 * §8). It mirrors `GraphLabels` deliberately - a node is a WebGL mesh instance found
 * by ray-casting, not a DOM element, so there is no trigger a generated `hover-card`
 * primitive could attach to (§9.1).
 *
 * `show`/`hide` drive state *inside this component*, so only this small subtree
 * re-renders and `GraphSceneCanvas` never does. `place` writes `transform` straight
 * to the element, the way `GraphLabels.apply()` does, so the per-frame path touches
 * no React state at all.
 *
 * The whole layer is `pointer-events: none`, including the card. Nothing on it is
 * interactive in this release - "Open page" is static text by design (§9.4) - and a
 * card that accepted pointer events would block an orbit drag started over it and
 * would stop the canvas seeing the pointer leave its node. See the deviation note in
 * `intent/node-hover-card/plan.md`.
 *
 * `aria-hidden`, the same posture the label layer has: the scene is unreachable by
 * keyboard and opaque to a screen reader, which is known, separately tracked debt
 * (`intent/graph-accessibility/`), widened here knowingly (spec C-4).
 */
export function NodeHoverCard({
  ref,
}: {
  ref: RefObject<NodeHoverCardHandle | null>;
}) {
  const [content, setContent] = useState<NodeCardContent | null>(null);
  const element = useRef<HTMLDivElement>(null);
  const size = useRef({ width: 0, height: 0 });
  const anchor = useRef<CardAnchor | null>(null);

  // Measured once per content change, never per frame: a layout read in the render
  // loop is the one thing this scene's update pass is careful not to do (§9.3).
  useLayoutEffect(() => {
    const node = element.current;
    if (!node || !content) {
      size.current = { width: 0, height: 0 };
      return;
    }
    const rect = node.getBoundingClientRect();
    size.current = { width: rect.width, height: rect.height };
    // The content changed under a card that is already placed - re-place it now
    // rather than waiting for a frame, or a wider card would overhang its node
    // until the camera next moves.
    if (anchor.current) applyPlacement(anchor.current);
  }, [content]);

  function applyPlacement(next: CardAnchor) {
    // Recorded *before* the element is checked, and this order is the whole
    // feature working rather than working once.
    //
    // `show()` is a React state update made from a native canvas listener, so React
    // flushes it in a scheduler task, while `invalidate()` schedules a frame. The
    // frame regularly wins that race and calls `place()` before the card has
    // mounted. Bailing out here would drop that anchor on the floor - and then the
    // mount's own measure-and-place below finds nothing to apply, and on an idle
    // page no further frame is ever scheduled, so the card stays mounted and
    // invisible for good. Keeping the anchor makes the two orders equivalent:
    // whichever of the frame and the commit lands second does the placing.
    anchor.current = next;
    const node = element.current;
    if (!node) return;
    const { width, height } = size.current;
    // Before the first measurement the card would land at the node's own centre;
    // hidden until then, so it never flashes in the wrong place.
    if (width === 0 || height === 0) {
      node.style.visibility = "hidden";
      return;
    }
    const placement = cardPlacement(next, width, height);
    node.style.transform = `translate3d(${placement.x}px, ${placement.y}px, 0)`;
    node.style.visibility = "visible";
  }

  useImperativeHandle(ref, () => ({
    show(next) {
      setContent((current) =>
        current &&
        current.name === next.name &&
        current.assignee === next.assignee &&
        current.status === next.status
          ? current
          : next,
      );
    },
    place(next) {
      applyPlacement(next);
    },
    hide() {
      anchor.current = null;
      size.current = { width: 0, height: 0 };
      setContent(null);
    },
  }));

  if (!content) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        ref={element}
        data-testid="node-hover-card"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          maxWidth: `${CARD_MAX_PX}px`,
          visibility: "hidden",
          willChange: "transform",
        }}
      >
        <Card size="sm" className="w-max max-w-full">
          <CardContent className="flex flex-col gap-1">
            <p className="truncate font-heading text-sm leading-snug font-medium">
              {content.name}
            </p>
            <Row label="Assignee" value={content.assignee} />
            <Row label="Status" value={content.status} />
            {/* Static text, not an `<a>` or a `<button>`: a control a keyboard user
                could reach that does nothing would be worse than one that is not
                reachable at all (§9.4, FR-5). */}
            <p className="text-xs text-muted-foreground/60">Open page</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** A label/value pair, read the way they are read elsewhere in the app (§9.4). */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-2 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      {/* `min-w-0` is what lets the truncation actually bite inside a flex row. */}
      <span className="min-w-0 truncate">{value}</span>
    </p>
  );
}
