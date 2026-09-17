/** Camera fly-to timing (spec §9.3). Shared by the scene and its test. */
export const FLY_DURATION_MS = 600;

/**
 * The `globals.css` reduced-motion guard zeroes CSS animations and transitions and
 * has no effect whatsoever on a requestAnimationFrame-driven three.js tween, so the
 * check has to happen here for FR-9 to be true at all.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * A duration of 0 means the camera cuts instantly to the framed position: the first
 * sample is already 1, so there is no intermediate frame to render (V-11). Read at
 * the start of each tween rather than once at mount, so a viewer who changes the
 * setting mid-session gets what they asked for.
 */
export function tweenDuration(base: number = FLY_DURATION_MS): number {
  return prefersReducedMotion() ? 0 : base;
}

export interface Tween {
  durationMs: number;
  /** Eased 0..1, and whether the tween is finished. */
  sample(elapsedMs: number): { progress: number; done: boolean };
}

export function createTween(durationMs: number = tweenDuration()): Tween {
  return {
    durationMs,
    sample(elapsedMs) {
      if (durationMs <= 0) return { progress: 1, done: true };
      const t = Math.min(1, elapsedMs / durationMs);
      return { progress: easeOutCubic(t), done: t >= 1 };
    },
  };
}
