"use client";

import { useImperativeHandle, useRef, type RefObject } from "react";
import type { GraphSceneNode, Vec3 } from "@/lib/graph/types";

/**
 * Never more, and never a DOM node per graph node (spec FR-7, NFR-2). The pool is
 * fixed so the label layer costs the same at 36 nodes and at 150.
 */
export const LABEL_POOL_SIZE = 24;

export interface LabelPlacement {
  text: string;
  /** Screen pixels, relative to the canvas. */
  x: number;
  y: number;
  opacity: number;
  /**
   * Drawn on the node rather than above it - the hub, whose name belongs inside its
   * circle (spec FR-1, §9.2). It changes both the transform and the box `declutter`
   * reserves, so the two cannot disagree about where the text is.
   */
  centred?: boolean;
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
 * Which nodes get one of the 24 labels: the root and the focused node first - they
 * are the two a viewer is orienting by - then nearest to the camera, with shallower
 * depth breaking ties so a branch boundary resolves the same way every frame rather
 * than flickering between two equidistant nodes (spec FR-7, R-4).
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
    if (node.parentId === null || node.id === focusedId) pinned.push(node);
    else rest.push(node);
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
    // Matching the transform below: above the node, or centred on it.
    const box = {
      left: placement.x - halfWidth,
      right: placement.x + halfWidth,
      top: placement.y - LABEL_HEIGHT * (placement.centred ? 0.5 : 1.9),
      bottom: placement.y - LABEL_HEIGHT * (placement.centred ? -0.5 : 0.4),
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

  useImperativeHandle(ref, () => ({
    apply(placements) {
      for (let index = 0; index < LABEL_POOL_SIZE; index += 1) {
        const element = elements.current[index];
        if (!element) continue;

        const placement = placements[index];
        if (!placement || placement.opacity <= 0) {
          // Hidden rather than transparent, so it is neither hit-tested nor read.
          element.style.visibility = "hidden";
          element.textContent = "";
          continue;
        }

        element.textContent = placement.text;
        element.style.visibility = "visible";
        element.style.opacity = String(placement.opacity);
        element.style.transform = `translate3d(${placement.x}px, ${placement.y}px, 0) translate(-50%, ${placement.centred ? "-50%" : "-140%"})`;
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
            lineHeight: 1,
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
