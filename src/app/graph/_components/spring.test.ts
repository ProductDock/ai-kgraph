import { describe, expect, it } from "vitest";
import {
  createSpringField,
  DRAG_REACH,
  rubberBand,
  stepSpring,
} from "./spring";

/** Runs node 0 at a steady frame rate until it settles; returns the trace of x. */
function run(frameMs: number, limitMs = 5000) {
  const field = createSpringField(1);
  field.offsets[0] = 3;
  const trace: number[] = [];
  let elapsed = 0;
  let settled = false;
  while (!settled && elapsed < limitMs) {
    settled = stepSpring(field, 0, frameMs);
    elapsed += frameMs;
    trace.push(field.offsets[0]!);
  }
  return { field, trace, elapsed, settled };
}

describe("stepSpring", () => {
  it("brings a released node back to rest, exactly, within two seconds", () => {
    const { field, settled, elapsed } = run(1000 / 60);
    expect(settled).toBe(true);
    expect(elapsed).toBeLessThan(2000);
    expect(Array.from(field.offsets)).toEqual([0, 0, 0]);
    expect(Array.from(field.velocities)).toEqual([0, 0, 0]);
  });

  it("overshoots its rest position once - the elastic part", () => {
    const { trace } = run(1000 / 60);
    const lowest = Math.min(...trace);
    expect(lowest).toBeLessThan(-0.1);
    // ...but not so far that it reads as a bounce rather than a settle.
    expect(lowest).toBeGreaterThan(-1.5);
  });

  it("behaves the same at 60Hz and 144Hz", () => {
    const at60 = run(1000 / 60);
    const at144 = run(1000 / 144);
    expect(Math.abs(at60.elapsed - at144.elapsed)).toBeLessThan(60);
    expect(Math.min(...at60.trace)).toBeCloseTo(Math.min(...at144.trace), 1);
  });

  it("does not jump on the huge delta a hidden tab hands back", () => {
    const field = createSpringField(1);
    field.offsets[0] = 3;
    stepSpring(field, 0, 60_000);
    expect(Math.abs(field.offsets[0]!)).toBeLessThan(3);
    expect(Number.isFinite(field.velocities[0]!)).toBe(true);
  });

  it("leaves every other node alone", () => {
    const field = createSpringField(2);
    field.offsets[3] = 2;
    stepSpring(field, 0, 16);
    expect(field.offsets[3]).toBe(2);
  });
});

describe("rubberBand", () => {
  it("is close to 1:1 for a small pull", () => {
    expect(rubberBand(0.5)).toBeCloseTo(0.5, 1);
  });

  it("keeps growing but never passes the reach", () => {
    const pulls = [1, 2, 5, 10, 100].map((distance) => rubberBand(distance));
    for (let index = 1; index < pulls.length; index += 1) {
      expect(pulls[index]!).toBeGreaterThan(pulls[index - 1]!);
    }
    expect(pulls.at(-1)!).toBeLessThanOrEqual(DRAG_REACH);
  });

  it("is zero for no pull", () => {
    expect(rubberBand(0)).toBe(0);
  });
});
