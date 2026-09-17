import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildScene } from "@/lib/graph/scene";
import { seed } from "@/lib/graph/seed";
import { GraphView } from "./graph-view";

const scene = buildScene(seed);

/**
 * The gate's two conditions are browser capabilities, so they are stubbed rather
 * than mocked - this repo has no `vi.mock` precedent, and it needs none here: the
 * scene is a `next/dynamic` import *behind* the gate, so neither test reaches
 * `three` at all.
 */
function stubViewport(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GraphView", () => {
  // V-18. jsdom has no WebGL either, so this asserts the viewport branch wins:
  // on a phone the screen is the reason, whatever the browser could have drawn.
  it("renders the small-screen notice below the tablet threshold, and no canvas", async () => {
    stubViewport(false);
    const { container } = render(<GraphView scene={scene} />);

    expect(
      await screen.findByText(/needs a bigger screen/i),
    ).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeNull();
  });

  // V-10. jsdom implements no WebGL context, so the probe returns null for real.
  it("renders the no-WebGL notice when the probe finds no context, and no canvas", async () => {
    stubViewport(true);
    const { container } = render(<GraphView scene={scene} />);

    expect(
      await screen.findByText(/can't draw the graph/i),
    ).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeNull();
  });
});
