import { createRef } from "react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  CARD_MAX_PX,
  cardPlacement,
  NodeHoverCard,
  type CardAnchor,
  type NodeHoverCardHandle,
} from "./node-hover-card";

// This repo does not enable vitest globals, so testing-library's auto-cleanup
// never runs - without this every `getBy*` after the first test sees two trees.
afterEach(cleanup);

// Not `getByRole`: the card is aria-hidden and unplaced (visibility: hidden) in
// jsdom, so the link has no accessible name to query by - which is the point.
function openPageLink(): HTMLElement {
  return screen.getByText("Open page").closest("a")!;
}

const CONTAINER = { containerWidth: 1000, containerHeight: 600 };

function anchor(overrides: Partial<CardAnchor> = {}): CardAnchor {
  return { nodeX: 500, nodeY: 300, gapPx: 12, ...CONTAINER, ...overrides };
}

// V-9
describe("cardPlacement", () => {
  it("sits to the right of the node, one gap clear of it", () => {
    const placement = cardPlacement(anchor(), 200, 100);

    expect(placement.side).toBe("right");
    expect(placement.x).toBe(512);
    // Centred on the node vertically, not hung below it.
    expect(placement.y).toBe(250);
  });

  it("flips to the left when the right side would run off the edge", () => {
    const placement = cardPlacement(anchor({ nodeX: 900 }), 200, 100);

    expect(placement.side).toBe("left");
    expect(placement.x).toBe(688);
    expect(placement.x + 200).toBeLessThanOrEqual(CONTAINER.containerWidth);
  });

  it("flips on where the card would land, not on where it ends up", () => {
    // Clamping first would slide this one back inside the container and it would
    // never flip - leaving the card sitting on top of its own node.
    const placement = cardPlacement(anchor({ nodeX: 995 }), 200, 100);

    expect(placement.side).toBe("left");
    expect(placement.x + 200).toBeLessThanOrEqual(995);
  });

  it("stays fully inside the container on both axes", () => {
    const cases: CardAnchor[] = [
      anchor({ nodeX: 0, nodeY: 0 }),
      anchor({ nodeX: 1000, nodeY: 600 }),
      anchor({ nodeX: 500, nodeY: 5 }),
      anchor({ nodeX: 500, nodeY: 595 }),
      anchor({ nodeX: -50, nodeY: 700 }),
    ];

    for (const each of cases) {
      const { x, y } = cardPlacement(each, 200, 120);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + 200).toBeLessThanOrEqual(CONTAINER.containerWidth);
      expect(y + 120).toBeLessThanOrEqual(CONTAINER.containerHeight);
    }
  });

  it("grows the gap with the node's own on-screen radius", () => {
    const near = cardPlacement(anchor({ gapPx: 60 }), 200, 100);
    const far = cardPlacement(anchor({ gapPx: 8 }), 200, 100);

    expect(near.x).toBeGreaterThan(far.x);
  });
});

// FR-2, FR-3, FR-4, FR-5, V-10
describe("NodeHoverCard", () => {
  function mount() {
    const ref = createRef<NodeHoverCardHandle>();
    render(<NodeHoverCard ref={ref} />);
    return ref;
  }

  it("shows nothing until it is told to", () => {
    mount();

    expect(screen.queryByTestId("node-hover-card")).toBeNull();
  });

  it("shows four rows, in order, with the node's own name as the title", () => {
    const ref = mount();
    act(() =>
      ref.current!.show({
        name: "RAG",
        assignee: "Nemanja Vasic",
        status: "Done",
        href: "/graph/n-node/rag",
      }),
    );

    const rows = [
      ...screen.getByTestId("node-hover-card").querySelectorAll("p"),
    ].map((row) => row.textContent);

    expect(rows).toEqual([
      "RAG",
      "AssigneeNemanja Vasic",
      "StatusDone",
      "Open page",
    ]);
    expect(openPageLink()).toHaveAttribute("href", "/graph/n-node/rag");
  });

  // node-content-pages FR-8
  it("shows the hub's name and nothing else", () => {
    const ref = mount();
    act(() =>
      ref.current!.show({
        name: "PD AI",
        assignee: "Unassigned",
        status: "Todo",
        href: null,
      }),
    );

    const card = screen.getByTestId("node-hover-card");
    expect(
      [...card.querySelectorAll("p")].map((row) => row.textContent),
    ).toEqual(["PD AI"]);
    expect(card.querySelector("a")).toBeNull();
  });

  it("shows the defaults a blank node flattens to", () => {
    const ref = mount();
    act(() =>
      ref.current!.show({
        name: "Protocols",
        assignee: "Unassigned",
        status: "Todo",
        href: "/graph/protocols",
      }),
    );

    expect(screen.getByText("Unassigned")).toBeTruthy();
    expect(screen.getByText("Todo")).toBeTruthy();
  });

  it("swaps content in place rather than opening a second card", () => {
    const ref = mount();
    act(() =>
      ref.current!.show({
        name: "RAG",
        assignee: "A",
        status: "Done",
        href: "/graph/x",
      }),
    );
    act(() =>
      ref.current!.show({
        name: "Evals",
        assignee: "B",
        status: "Todo",
        href: "/graph/x",
      }),
    );

    expect(screen.getAllByTestId("node-hover-card")).toHaveLength(1);
    expect(screen.getByText("Evals")).toBeTruthy();
    expect(screen.queryByText("RAG")).toBeNull();
  });

  it("goes away when hidden", () => {
    const ref = mount();
    act(() =>
      ref.current!.show({
        name: "RAG",
        assignee: "A",
        status: "Done",
        href: "/graph/x",
      }),
    );
    act(() => ref.current!.hide());

    expect(screen.queryByTestId("node-hover-card")).toBeNull();
  });

  // V-10
  it("truncates a long name or assignee instead of widening", () => {
    const ref = mount();
    act(() =>
      ref.current!.show({
        name: "A topic with a name far longer than the card is ever meant to be",
        assignee: "Someone With A Very Long Name Indeed Who Owns This Topic",
        status: "In Progress",
        href: "/graph/x",
      }),
    );

    const card = screen.getByTestId("node-hover-card");
    expect(card.style.maxWidth).toBe(`${CARD_MAX_PX}px`);
    // The title and both values truncate; the row captions do not, so they cannot
    // be the thing that disappears.
    expect(card.querySelectorAll(".truncate")).toHaveLength(3);
  });

  it("is hidden from assistive technology, like the label layer", () => {
    const ref = mount();
    act(() =>
      ref.current!.show({
        name: "RAG",
        assignee: "A",
        status: "Done",
        href: "/graph/x",
      }),
    );

    expect(
      screen.getByTestId("node-hover-card").closest("[aria-hidden=true]"),
    ).not.toBeNull();
  });

  // node-content-pages §9.5, FR-4: the layer stays see-through, so an orbit drag
  // started over the card's name or rows still turns the scene. The link is the one
  // exception, and it is kept out of the tab order inside the aria-hidden layer.
  it("takes pointer events on the Open page link and nowhere else", () => {
    const ref = mount();
    act(() =>
      ref.current!.show({
        name: "RAG",
        assignee: "A",
        status: "Done",
        href: "/graph/x",
      }),
    );

    const card = screen.getByTestId("node-hover-card");
    expect(card.closest(".pointer-events-none")).not.toBeNull();
    const interactive = [...card.querySelectorAll(".pointer-events-auto")];
    expect(interactive).toHaveLength(1);
    expect(interactive[0]!.tagName).toBe("A");
    expect(interactive[0]).toHaveTextContent("Open page");
    expect(interactive[0]).toHaveAttribute("tabindex", "-1");
  });

  it("tells the scene when the pointer is on the link, but not for touch", () => {
    const enter = vi.fn();
    const leave = vi.fn();
    const click = vi.fn();
    const ref = createRef<NodeHoverCardHandle>();
    render(
      <NodeHoverCard
        ref={ref}
        onLinkPointerEnter={enter}
        onLinkPointerLeave={leave}
        onLinkClick={click}
      />,
    );
    act(() =>
      ref.current!.show({
        name: "RAG",
        assignee: "A",
        status: "Done",
        href: "/graph/x",
      }),
    );
    const link = openPageLink();

    fireEvent.pointerEnter(link, { pointerType: "mouse" });
    fireEvent.pointerLeave(link, { pointerType: "mouse" });
    expect(enter).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledTimes(1);

    fireEvent.pointerEnter(link, { pointerType: "touch" });
    fireEvent.pointerLeave(link, { pointerType: "touch" });
    expect(enter).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledTimes(1);

    fireEvent.click(link);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("stays hidden until it has been placed, so it never flashes at the origin", () => {
    const ref = mount();
    act(() =>
      ref.current!.show({
        name: "RAG",
        assignee: "A",
        status: "Done",
        href: "/graph/x",
      }),
    );

    // jsdom reports every element as zero-sized, which is exactly the
    // "not measured yet" state the guard exists for.
    expect(screen.getByTestId("node-hover-card").style.visibility).toBe(
      "hidden",
    );

    act(() => ref.current!.place(anchor()));
    expect(screen.getByTestId("node-hover-card").style.visibility).toBe(
      "hidden",
    );
  });
});

/**
 * The measured path, which jsdom does not reach on its own: every element it
 * reports is zero-sized, so nothing above this point ever runs the branch that
 * actually positions the card. That gap is what let the frame-before-mount race
 * below ship.
 */
describe("NodeHoverCard, once it has a size", () => {
  const CARD = { width: 180, height: 92 };

  function mount() {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      ...CARD,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: CARD.width,
      bottom: CARD.height,
      toJSON: () => ({}),
    });
    const ref = createRef<NodeHoverCardHandle>();
    render(<NodeHoverCard ref={ref} />);
    return ref;
  }

  afterEach(() => vi.restoreAllMocks());

  const content = {
    name: "RAG",
    assignee: "Nemanja Vasic",
    status: "Done",
    href: "/graph/n-node/rag",
  } as const;

  it("places the card when the frame lands after the mount", () => {
    const ref = mount();
    act(() => ref.current!.show(content));
    act(() => ref.current!.place(anchor()));

    const card = screen.getByTestId("node-hover-card");
    expect(card.style.visibility).toBe("visible");
    expect(card.style.transform).toBe("translate3d(512px, 254px, 0)");
  });

  /**
   * The regression. `show()` is a React state update made from a native listener,
   * so React flushes it in a scheduler task while `invalidate()` schedules a frame -
   * and the frame regularly wins, calling `place()` before the card has mounted. An
   * `applyPlacement` that dropped that anchor left the card mounted and invisible
   * with no further frame coming, which on an idle page is forever.
   */
  it("places the card when the frame lands before the mount", () => {
    const ref = mount();
    act(() => {
      ref.current!.place(anchor());
      ref.current!.show(content);
    });

    const card = screen.getByTestId("node-hover-card");
    expect(card.style.visibility).toBe("visible");
    expect(card.style.transform).toBe("translate3d(512px, 254px, 0)");
  });

  it("opens again after it has been closed, in either order", () => {
    const ref = mount();
    act(() => ref.current!.show(content));
    act(() => ref.current!.place(anchor()));
    act(() => ref.current!.hide());

    act(() => {
      ref.current!.place(anchor({ nodeX: 100, nodeY: 100 }));
      ref.current!.show({ ...content, name: "Evals" });
    });

    const card = screen.getByTestId("node-hover-card");
    expect(card.style.visibility).toBe("visible");
    expect(screen.getByText("Evals")).toBeTruthy();
  });

  // The card is see-through to pointer events, so this is how the scene knows the
  // pointer has moved onto it rather than off into empty space.
  it("reports whether a point is over the card as placed", () => {
    const ref = mount();
    act(() => ref.current!.show(content));
    act(() => ref.current!.place(anchor()));

    // Placed at (512, 254), 180 x 92.
    expect(ref.current!.contains(512, 254)).toBe(true);
    expect(ref.current!.contains(600, 300)).toBe(true);
    expect(ref.current!.contains(692, 346)).toBe(true);
    expect(ref.current!.contains(505, 300)).toBe(false);
    expect(ref.current!.contains(600, 350)).toBe(false);
  });

  it("contains nothing once hidden, or before it has been placed", () => {
    const ref = mount();
    act(() => ref.current!.show(content));
    expect(ref.current!.contains(600, 300)).toBe(false);

    act(() => ref.current!.place(anchor()));
    act(() => ref.current!.hide());
    expect(ref.current!.contains(600, 300)).toBe(false);
  });

  it("re-places itself when the content changes under an open card", () => {
    const ref = mount();
    act(() => ref.current!.show(content));
    act(() => ref.current!.place(anchor({ nodeX: 900 })));
    const flipped = screen.getByTestId("node-hover-card").style.transform;

    // No new anchor, only new content: the card must still be where its node is.
    act(() => ref.current!.show({ ...content, name: "Evals" }));
    expect(screen.getByTestId("node-hover-card").style.transform).toBe(flipped);
  });
});
