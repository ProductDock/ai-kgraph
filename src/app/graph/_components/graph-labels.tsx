"use client";

import { useImperativeHandle, useRef, type RefObject } from "react";
import type { GraphSceneNode, Vec3 } from "@/lib/graph/types";
import { prefersReducedMotion } from "./tween";

/**
 * Never more, and never a DOM node per graph node (spec FR-7, NFR-2). The pool is
 * fixed so the label layer costs the same at 36 nodes and at 150.
 */
export const LABEL_POOL_SIZE = 24;

export interface LabelPlacement {
  /** Which node this is. The pool is keyed by it, not by array position - see
   * `assignSlots`. */
  id: string;
  text: string;
  /** Screen pixels, relative to the canvas. `x` is the text's centre; `y` is its
   * top, already offset below the node's circle by `labelOffsetPx` (spec FR-2). */
  x: number;
  y: number;
  opacity: number;
}

/** The type size labels are set in. Deliberately small (intent, "labels are
 * small"): a label says which node you are looking at, and at this size it names
 * the shapes without competing with them. */
const LABEL_FONT_PX = 10;

/**
 * Rough text metrics, in pixels, for the Poppins the labels are set in. These
 * track `LABEL_FONT_PX` - measuring for real would mean a layout read per label
 * per frame, and the declutter only needs to know roughly where the words are, but
 * it does need to agree with what is drawn.
 */
const LABEL_CHAR_WIDTH = LABEL_FONT_PX * 0.51;
const LABEL_HEIGHT = LABEL_FONT_PX * 1.3;

/**
 * How wide a label may get before it is cut off with an ellipsis (spec FR-8). A
 * label says which node you are looking at; it is not where the whole title is read,
 * and an untruncated one runs across the scene over everything behind it.
 *
 * Roughly twenty characters at the metrics above. Provisional until it has been seen
 * on a tablet-sized viewport, which is the check the spec schedules rather than
 * skips (spec §3 Q2/Q5, NFR-6, V-10).
 */
export const LABEL_MAX_PX = 132;

/**
 * How far below a circle its name sits, as a fraction of that circle's on-screen
 * radius, and the floor that fraction can never take it under. Tuning values, not
 * invariants (spec §4 D-2, C-2): the tests assert that the offset grows with the
 * radius, shrinks with distance and never drops below the floor - not what these
 * two numbers are.
 */
const GAP_RATIO = 0.35;
export const MIN_GAP_PX = 6;

/**
 * Screen pixels from a node's centre down to the top of its label: its projected
 * radius plus a gap proportional to it, so a name never lands on its own circle
 * however big that circle currently looks (spec FR-2, §9.1).
 *
 * `worldRadius` is the radius as *drawn*, focus scale included - a base radius
 * would let a focused circle grow into its own label.
 *
 * Pure, so it is testable without a GPU (V-3, V-4, V-5).
 */
export function labelOffsetPx(
  worldRadius: number,
  distance: number,
  viewportHeight: number,
  fovDegrees: number,
): number {
  // A PerspectiveCamera's fov is the *vertical* angle, so half the viewport spans
  // `distance * tan(fov / 2)` world units - `overviewDistance()`'s relationship,
  // run in the other direction.
  const halfHeightWorld = distance * Math.tan((fovDegrees * Math.PI) / 360);
  const radiusPx =
    halfHeightWorld > 0
      ? (worldRadius * viewportHeight) / (2 * halfHeightWorld)
      : 0;
  return Math.max(radiusPx * (1 + GAP_RATIO), MIN_GAP_PX);
}

export interface GraphLabelsHandle {
  apply(placements: LabelPlacement[]): void;
}

function distanceTo(position: Vec3, camera: Vec3): number {
  return Math.hypot(
    position[0] - camera[0],
    position[1] - camera[1],
    position[2] - camera[2],
  );
}

/**
 * Which nodes get one of the 24 labels: the pinned ones first - the hub, the ring
 * topics and the focused node - then nearest to the camera, with shallower depth
 * breaking ties so a branch boundary resolves the same way every frame rather than
 * flickering between two equidistant nodes (spec FR-7, R-4).
 *
 * The ring is pinned because it is the one thing in the scene a viewer is meant to
 * take their bearings from: it is what `branch-key.tsx` lists by name in the header
 * and what the layout spends an even azimuth split on. Left to distance order it
 * loses - a ring topic on the far side of the hub is further away than a dozen leaf
 * nodes in the near branch, so the frame ends up naming `pi` and `tau` while a whole
 * top-level topic sits unlabelled. It costs one pool slot per ring topic out of 24,
 * and the layout's ring holds four before two of them have to share a colour
 * (colour.ts, HUE_COUNT), so the pool is never at risk of being eaten by it.
 *
 * Pinning is pool membership only, not visibility: a pinned node still fades with
 * distance and still loses a collision to whatever was placed before it. Only the
 * hub is exempt from the fade, and it stays the only exemption.
 *
 * Pure, so it is testable without a GPU (V-14).
 */
export function selectLabelled(
  nodes: readonly GraphSceneNode[],
  cameraPosition: Vec3,
  focusedId: string | null,
): GraphSceneNode[] {
  const pinned: GraphSceneNode[] = [];
  const rest: GraphSceneNode[] = [];

  for (const node of nodes) {
    if (node.parentId === null || node.depth === 1 || node.id === focusedId) {
      pinned.push(node);
    } else {
      rest.push(node);
    }
  }

  rest.sort((a, b) => {
    const byDistance =
      distanceTo(a.position, cameraPosition) -
      distanceTo(b.position, cameraPosition);
    if (byDistance !== 0) return byDistance;
    if (a.depth !== b.depth) return a.depth - b.depth;
    // Ids are unique, so the order is total and the frame is reproducible.
    return a.id < b.id ? -1 : 1;
  });

  return [...pinned, ...rest].slice(0, LABEL_POOL_SIZE);
}

/**
 * Drops any label that would land on top of one already placed (FR-7, R-4).
 *
 * The nearest-24 cap and the distance fade are not on their own enough: two nodes
 * in different branches can project to almost the same pixel however far apart they
 * are in the scene, and the result is unreadable stacked text. The input is already
 * ordered - root and focused first, then nearest - so the label that survives a
 * collision is always the more important of the two.
 *
 * Pure, and a screen-space test rather than the raycast occlusion §7.8 holds in
 * reserve: it costs nothing and it fixes what is actually wrong on screen.
 */
export function declutter(placements: LabelPlacement[]): LabelPlacement[] {
  const kept: { left: number; right: number; top: number; bottom: number }[] =
    [];

  return placements.map((placement) => {
    if (placement.opacity <= 0) return placement;

    // Clamped to what is actually drawn: past the truncation width the text stops
    // getting wider, and a box that kept growing would suppress a neighbouring
    // label to protect pixels the ellipsis already ate.
    const halfWidth =
      Math.min(placement.text.length * LABEL_CHAR_WIDTH, LABEL_MAX_PX) / 2;
    // Matching the transform below: `y` is the top of the text, which the caller
    // has already pushed below the node's circle.
    const box = {
      left: placement.x - halfWidth,
      right: placement.x + halfWidth,
      top: placement.y,
      bottom: placement.y + LABEL_HEIGHT,
    };
    const collides = kept.some(
      (other) =>
        box.left < other.right &&
        box.right > other.left &&
        box.top < other.bottom &&
        box.bottom > other.top,
    );
    if (collides) return { ...placement, opacity: 0 };

    kept.push(box);
    return placement;
  });
}

/**
 * How long a label takes to fade in or out, in milliseconds.
 *
 * `declutter` is stateless, so a label that loses a collision one frame and wins it
 * the next snaps on and off. The fade turns that churn into a dissolve. It is
 * cosmetic: nothing about which label is drawn depends on it, and
 * `prefersReducedMotion` drops it to zero.
 */
export const LABEL_FADE_MS = 140;

/**
 * Which pooled span shows which node, keyed by node id rather than by position in
 * the placement array.
 *
 * This is what stops the labels darting about during a fly-to. `selectLabelled`
 * orders by distance to the camera, and the camera is moving, so that order churns
 * continuously - and if span `n` simply draws placement `n`, every swap in the sort
 * teleports two spans across the screen and exchanges their text. Keyed by id, a
 * span only ever moves by however far its own node moved on screen.
 *
 * A node that leaves the set frees its slot; newcomers take the lowest free slots in
 * the order given, which is `selectLabelled`'s own importance order. Pure, so the
 * stability claim is testable without a DOM (V-14).
 */
export function assignSlots(
  previous: readonly (string | null)[],
  ids: readonly string[],
): (string | null)[] {
  const incoming = new Set(ids);
  const next: (string | null)[] = Array.from(
    { length: LABEL_POOL_SIZE },
    (_, slot) => {
      const held = previous[slot] ?? null;
      return held !== null && incoming.has(held) ? held : null;
    },
  );

  const kept = new Set(next.filter((id): id is string => id !== null));
  let cursor = 0;
  for (const id of ids) {
    if (kept.has(id)) continue;
    while (cursor < LABEL_POOL_SIZE && next[cursor] !== null) cursor += 1;
    // `selectLabelled` caps its result at the pool size, so this only bites if a
    // caller hands over more than the pool can hold - the extras are dropped
    // rather than silently overwriting a stable slot.
    if (cursor >= LABEL_POOL_SIZE) break;
    next[cursor] = id;
    cursor += 1;
  }

  return next;
}

/**
 * A single overlay of 24 absolutely-positioned elements, `pointer-events: none` so
 * it never swallows an orbit drag.
 *
 * Positions and opacity are written imperatively through the handle, never through
 * React state: sixty state updates a second would re-render the tree continuously
 * (spec §7.8, §7.6.4). Text is set as `textContent` - `innerHTML` is forbidden in
 * this feature with no exception for our own content (spec §8.2).
 */
export function GraphLabels({
  ref,
}: {
  ref: RefObject<GraphLabelsHandle | null>;
}) {
  const elements = useRef<(HTMLSpanElement | null)[]>([]);
  const slots = useRef<(string | null)[]>(
    Array.from({ length: LABEL_POOL_SIZE }, () => null),
  );

  useImperativeHandle(ref, () => ({
    apply(placements) {
      const byId = new Map(
        placements.map((placement) => [placement.id, placement]),
      );
      const previous = slots.current;
      const next = assignSlots(
        previous,
        placements.map((placement) => placement.id),
      );
      slots.current = next;

      const fade = prefersReducedMotion()
        ? "none"
        : `opacity ${LABEL_FADE_MS}ms linear`;
      let reassigned = false;

      // First pass: everything but the opacity of a slot that has changed hands.
      // A reused span must not cross-fade one node's name into another's, so a
      // reassigned slot is pinned at zero here and faded up in the second pass.
      for (let slot = 0; slot < LABEL_POOL_SIZE; slot += 1) {
        const element = elements.current[slot];
        if (!element) continue;

        const id = next[slot] ?? null;
        const placement = id === null ? undefined : byId.get(id);
        if (!placement) {
          // An unused slot is hidden outright, so it is neither hit-tested nor
          // read. A *decluttered* one keeps its text and fades, below.
          element.style.visibility = "hidden";
          element.style.opacity = "0";
          element.textContent = "";
          continue;
        }

        const changed = previous[slot] !== id;
        if (changed) {
          reassigned = true;
          element.style.transition = "none";
          element.style.opacity = "0";
          element.textContent = placement.text;
        }
        element.style.visibility = "visible";
        element.style.transform = `translate3d(${placement.x}px, ${placement.y}px, 0) translate(-50%, 0%)`;
        if (!changed) {
          if (element.style.transition !== fade)
            element.style.transition = fade;
          element.style.opacity = String(placement.opacity);
        }
      }

      if (!reassigned) return;
      // One forced reflow for the whole pool, and only when a slot actually
      // changed hands: without it the zero above never commits and the browser
      // fades from the *previous* node's opacity instead of from nothing.
      void elements.current.find(Boolean)?.offsetWidth;

      for (let slot = 0; slot < LABEL_POOL_SIZE; slot += 1) {
        const element = elements.current[slot];
        const id = next[slot] ?? null;
        if (!element || id === null || previous[slot] === id) continue;
        const placement = byId.get(id);
        if (!placement) continue;
        element.style.transition = fade;
        element.style.opacity = String(placement.opacity);
      }
    },
  }));

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: LABEL_POOL_SIZE }, (_, index) => (
        <span
          key={index}
          ref={(element) => {
            elements.current[index] = element;
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            visibility: "hidden",
            willChange: "transform, opacity",
            whiteSpace: "nowrap",
            // FR-8. `declutter` clamps its width estimate to the same number, so
            // the box it reserves and the text the browser draws agree.
            maxWidth: `${LABEL_MAX_PX}px`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: `${LABEL_FONT_PX}px`,
            fontWeight: 500,
            // Not 1: `overflow: hidden` clips to the line box, and at 1 that box
            // cuts Poppins' descenders (the tail of a "g"). Matching the declutter's
            // own height keeps the drawn box and the reserved box the same.
            lineHeight: `${LABEL_HEIGHT}px`,
            color: "var(--text-primary)",
            // The 2px surface ring that keeps text legible where it crosses a node.
            textShadow:
              "0 0 2px var(--graph-label-halo), 0 0 2px var(--graph-label-halo), 0 0 4px var(--graph-label-halo)",
          }}
        />
      ))}
    </div>
  );
}
