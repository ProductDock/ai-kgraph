import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { GraphStats } from "@/lib/graph/types";

// This repo does not enable vitest globals, so testing-library's auto-cleanup
// never runs - without this every `getBy*` after the first test sees two trees.
afterEach(cleanup);

const KEY = "graph-stats-collapsed";
const STATS: GraphStats = { totalTopics: 41, done: 6, inProgress: 3 };

/**
 * A fresh store and panel per test. The store reads `localStorage` once, when its
 * module loads, so seeing a changed key means loading it again.
 */
async function renderPanel(stats: GraphStats = STATS) {
  vi.resetModules();
  const { GraphStatsPanel } = await import("./graph-stats-panel");
  return render(<GraphStatsPanel stats={stats} />);
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

// V-3 (the panel's half)
describe("statsShares", () => {
  it("is all zeros, never NaN, for an empty graph", async () => {
    const { statsShares } = await import("./graph-stats-panel");

    expect(statsShares({ totalTopics: 0, done: 0, inProgress: 0 })).toEqual({
      donePct: 0,
      inProgressPct: 0,
      doneFrac: 0,
      inProgressFrac: 0,
    });
  });

  it("rounds each percentage on its own, and keeps the fractions exact", async () => {
    const { statsShares } = await import("./graph-stats-panel");
    // 50.5% and 49.5% round to 51 and 50 - a 101 total is accepted, not corrected.
    const shares = statsShares({ totalTopics: 200, done: 101, inProgress: 99 });

    expect(shares.donePct + shares.inProgressPct).toBe(101);
    expect(shares.doneFrac).toBe(101 / 200);
  });
});

describe("GraphStatsPanel", () => {
  // V-4
  it("shows the topic count and both shares", async () => {
    await renderPanel();

    expect(screen.getByText("Statistics")).toBeDefined();
    expect(screen.getByText("41")).toBeDefined();
    expect(screen.getByText("6/41 (15%)")).toBeDefined();
    expect(screen.getByText("3/41 (7%)")).toBeDefined();
  });

  // V-5
  it("draws two segments at the unrounded fractions, and no Todo", async () => {
    const { container } = await renderPanel();

    expect(screen.getByTestId("graph-stats-done").style.width).toBe(
      `${(6 / 41) * 100}%`,
    );
    expect(screen.getByTestId("graph-stats-in-progress").style.width).toBe(
      `${(3 / 41) * 100}%`,
    );
    expect(
      screen.getByTestId("graph-stats-bar").querySelectorAll("[data-testid]"),
    ).toHaveLength(2);
    expect(container.textContent).not.toMatch(/todo/i);
  });

  // V-6
  it("says nothing about edges", async () => {
    await renderPanel();

    expect(screen.queryByText(/edges/i)).toBeNull();
  });

  // V-7
  it("collapses to its header and back, and remembers it", async () => {
    await renderPanel();
    const toggle = screen.getByTestId("graph-stats-toggle");

    fireEvent.click(toggle);
    expect(screen.queryByText("41")).toBeNull();
    expect(screen.queryByTestId("graph-stats-bar")).toBeNull();
    expect(screen.getByText("Statistics")).toBeDefined();
    expect(screen.getByTestId("graph-stats-toggle")).toBe(toggle);
    expect(localStorage.getItem(KEY)).toBe("true");

    fireEvent.click(toggle);
    expect(screen.getByText("41")).toBeDefined();
    expect(screen.getByTestId("graph-stats-bar")).toBeDefined();
    expect(localStorage.getItem(KEY)).toBe("false");
  });

  it("stays out of the tab order and the accessibility tree", async () => {
    const { container } = await renderPanel();

    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(screen.getByTestId("graph-stats-toggle").tabIndex).toBe(-1);
  });

  // V-8
  it("comes up collapsed when this browser collapsed it", async () => {
    localStorage.setItem(KEY, "true");
    await renderPanel();

    expect(screen.getByText("Statistics")).toBeDefined();
    expect(screen.queryByText("41")).toBeNull();
  });

  // V-9
  it("comes up open when nothing is stored", async () => {
    await renderPanel();

    expect(screen.getByText("41")).toBeDefined();
  });

  it("comes up open when storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    await renderPanel();

    expect(screen.getByText("41")).toBeDefined();
  });
});
