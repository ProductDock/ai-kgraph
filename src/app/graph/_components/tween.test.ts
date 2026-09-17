import { afterEach, describe, expect, it, vi } from "vitest";
import { createTween, FLY_DURATION_MS, tweenDuration } from "./tween";

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: reduce && query.includes("prefers-reduced-motion"),
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

describe("camera tween", () => {
  // V-11. The globals.css reduced-motion guard zeroes CSS animations only; it has
  // no effect on a requestAnimationFrame tween, so this check is the only thing
  // that makes FR-9 true.
  it("cuts instantly under prefers-reduced-motion, with no intermediate frame", () => {
    stubReducedMotion(true);

    expect(tweenDuration()).toBe(0);

    const tween = createTween(tweenDuration());
    expect(tween.sample(0)).toEqual({ progress: 1, done: true });
  });

  it("eases over the full duration otherwise", () => {
    stubReducedMotion(false);

    expect(tweenDuration()).toBe(FLY_DURATION_MS);

    const tween = createTween(tweenDuration());
    expect(tween.sample(0).progress).toBe(0);
    expect(tween.sample(0).done).toBe(false);
    // Ease-out: more than half the distance is covered in the first half.
    expect(tween.sample(FLY_DURATION_MS / 2).progress).toBeGreaterThan(0.5);
    expect(tween.sample(FLY_DURATION_MS)).toEqual({ progress: 1, done: true });
  });

  it("reads the preference per tween, not once at module load", () => {
    stubReducedMotion(false);
    expect(tweenDuration()).toBe(FLY_DURATION_MS);

    stubReducedMotion(true);
    expect(tweenDuration()).toBe(0);
  });

  it("never overshoots when a frame arrives late", () => {
    expect(createTween(100).sample(10_000)).toEqual({
      progress: 1,
      done: true,
    });
  });
});
