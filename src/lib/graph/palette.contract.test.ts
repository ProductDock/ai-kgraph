/**
 * The palette contract, enforced.
 *
 * Every rule about colour in this app used to live in prose - "re-run
 * validate_palette.js against both surfaces", "the ring tops out at four", "the hub
 * is the one node that cannot be confused with a branch". Prose does not fail a
 * build, and each of those had in fact been broken at some point without anything
 * noticing: the hub had drifted to within dE 3.6 of the blue a ring topic always
 * takes, and lighting the nodes had pushed two hues out of the validated lightness
 * band at their shaded end.
 *
 * So this test reads the real `globals.css` - not a copy of the values - and runs
 * the `dataviz` skill's computable checks over it, in both themes, at both ends of
 * the shading range the lit scene actually draws.
 *
 * When it fails, the fix is a colour decision, not a test edit: re-value the token
 * until it passes, or change the documented expectation here *and* the comment in
 * `globals.css` that states it, together.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  HUB_TOKEN,
  HUE_COUNT,
  hueToken,
  HUE_SPAN,
  NODE_TERMINATOR,
  TINT_CEILING,
  TINT_STEP,
} from "./colour";
import {
  adjacentPairs,
  allPairs,
  BAND,
  CHROMA_FLOOR,
  CONTRAST_MIN,
  CVD_FLOOR,
  contrast,
  deltaE,
  familyShade,
  hueGap,
  NORMAL_FLOOR,
  oklch,
  shade,
  worstSeparation,
} from "./colour-metrics";

/**
 * The first four slots are the ring's, and the ring is the one surface where every
 * group is on screen at once - so those four need all-pairs separation, not the
 * adjacent kind. Four is the documented ceiling (spec C-2): a fifth ring topic wraps
 * the assignment rather than failing the build, which is exactly why the limit is
 * written down in three places and asserted here.
 */
const RING_SLOTS = 4;

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** The declarations inside one selector block, by custom-property name. */
function scope(selector: string): Map<string, string> {
  const start = CSS.indexOf(selector);
  expect(start, `no \`${selector}\` block in globals.css`).toBeGreaterThan(-1);
  const body = CSS.slice(start + selector.length);
  const end =
    body.indexOf("\n  }") >= 0 && body.indexOf("\n  }") < body.indexOf("\n}")
      ? body.indexOf("\n  }")
      : body.indexOf("\n}");
  const declarations = new Map<string, string>();
  // Comments go first: the prose above these tokens names other tokens, and a
  // comment mentioning `--graph-edge:` otherwise swallows the declaration under it.
  const block = body.slice(0, end).replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, name, value] of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    declarations.set(name!, value!.trim());
  }
  return declarations;
}

const SCOPES = {
  light: scope(":root {\n  color-scheme: light;"),
  darkMedia: scope(':root:not([data-theme="light"]) {'),
  darkAttribute: scope(':root[data-theme="dark"] {'),
};

/** Resolves one token to a hex, following `var()` into the light scope if needed. */
function resolve(theme: "light" | "dark", token: string): string {
  const own = theme === "light" ? SCOPES.light : SCOPES.darkMedia;
  const value = own.get(token) ?? SCOPES.light.get(token);
  expect(value, `${token} is not declared`).toBeDefined();
  const reference = /^var\((--[\w-]+)\)$/.exec(value!);
  if (reference) return resolve(theme, reference[1]!);
  return value!;
}

const THEMES = ["light", "dark"] as const;

/** Both ends of the range a lit node is drawn across. */
const STRENGTHS = [
  { name: "as the token declares it", factor: 1 },
  { name: "at the shaded terminator", factor: NODE_TERMINATOR },
] as const;

const hues = (theme: (typeof THEMES)[number], factor: number) =>
  Array.from({ length: HUE_COUNT }, (_, slot) =>
    shade(resolve(theme, hueToken(slot)), factor),
  );

describe.each(THEMES)("the %s palette", (theme) => {
  describe.each(STRENGTHS)("$name", ({ factor }) => {
    it("keeps every hue inside the lightness band", () => {
      const [low, high] = BAND[theme];
      for (const hue of hues(theme, factor)) {
        expect(oklch(hue).L, `${hue} lightness`).toBeGreaterThanOrEqual(low);
        expect(oklch(hue).L, `${hue} lightness`).toBeLessThanOrEqual(high);
      }
    });

    it("keeps every hue above the chroma floor", () => {
      for (const hue of hues(theme, factor)) {
        expect(oklch(hue).C, `${hue} chroma`).toBeGreaterThanOrEqual(
          CHROMA_FLOOR,
        );
      }
    });

    it("separates neighbouring slots for a dichromat reader", () => {
      const pairs = adjacentPairs(hues(theme, factor));
      for (const vision of ["protan", "deutan"] as const) {
        const { distance, pair } = worstSeparation(pairs, vision);
        expect(
          distance,
          `${pair.join(" vs ")} under ${vision}`,
        ).toBeGreaterThanOrEqual(CVD_FLOOR);
      }
    });

    it("separates neighbouring slots under full colour vision", () => {
      const { distance, pair } = worstSeparation(
        adjacentPairs(hues(theme, factor)),
      );
      expect(distance, pair.join(" vs ")).toBeGreaterThanOrEqual(NORMAL_FLOOR);
    });

    it("separates every ring topic from every other, not just its neighbour", () => {
      const ring = hues(theme, factor).slice(0, RING_SLOTS);
      for (const vision of ["protan", "deutan"] as const) {
        const { distance, pair } = worstSeparation(allPairs(ring), vision);
        expect(
          distance,
          `${pair.join(" vs ")} under ${vision}`,
        ).toBeGreaterThanOrEqual(CVD_FLOOR);
      }
      const { distance, pair } = worstSeparation(allPairs(ring));
      expect(distance, pair.join(" vs ")).toBeGreaterThanOrEqual(NORMAL_FLOOR);
    });

    it("keeps the hub distinct from every hue a ring topic can take", () => {
      // Slot 0 always goes to the first ring topic and that topic is one edge from
      // the hub, so "the hub is a different colour" is not a matter of taste.
      const hub = shade(resolve(theme, HUB_TOKEN), factor);
      const ring = hues(theme, factor).slice(0, RING_SLOTS);
      const pairs = ring.map((hue) => [hub, hue] as [string, string]);
      for (const vision of ["protan", "deutan"] as const) {
        const { distance, pair } = worstSeparation(pairs, vision);
        expect(
          distance,
          `${pair.join(" vs ")} under ${vision}`,
        ).toBeGreaterThanOrEqual(CVD_FLOOR);
      }
      const { distance, pair } = worstSeparation(pairs);
      expect(distance, pair.join(" vs ")).toBeGreaterThanOrEqual(NORMAL_FLOOR);
    });
  });
});

describe("contrast against the backdrop", () => {
  /**
   * The scene's backdrop is a gradient, so "the surface" is two colours, and the
   * one that binds is whichever end a node happens to sit over.
   *
   * Hues below 3:1 are legal *only* with the relief the validator requires - the
   * scene's label layer and the header key. The expectations below are therefore
   * the documented obligation itself, written as slot numbers: when this list
   * changes, the claim in globals.css and CLAUDE.md has to change with it, and
   * whoever changes it has to decide again whether the relief still covers it.
   */
  const RELIEF_REQUIRED = {
    light: { "--graph-space-near": [1, 2, 6], "--graph-space-far": [1, 2, 6] },
    dark: { "--graph-space-near": [], "--graph-space-far": [] },
  } as const;

  it.each(THEMES)(
    "%s: only the documented slots need the label relief",
    (theme) => {
      for (const [end, expected] of Object.entries(RELIEF_REQUIRED[theme])) {
        const surface = resolve(theme, end);
        const below = hues(theme, 1)
          .map((hue, slot) => ({ hue, slot, ratio: contrast(hue, surface) }))
          .filter((row) => row.ratio < CONTRAST_MIN)
          .map((row) => row.slot);
        expect(
          below,
          `${theme} slots below ${CONTRAST_MIN}:1 on ${end}`,
        ).toEqual([...expected]);
      }
    },
  );

  it.each(THEMES)("%s: the hub clears 3:1 against both ends", (theme) => {
    for (const end of ["--graph-space-near", "--graph-space-far"] as const) {
      const ratio = contrast(resolve(theme, HUB_TOKEN), resolve(theme, end));
      expect(ratio, `hub on ${end}`).toBeGreaterThanOrEqual(CONTRAST_MIN);
    }
  });
});

describe("the scene's non-content ink", () => {
  /**
   * Ordered, loudest last. An edge is content - it is how the tree's shape is read -
   * and the floor and the marks on it are depth cues. When decoration outranks
   * content the picture reads as a diagram drawn on graph paper, which is what
   * happened the first time the floor was darkened by hand.
   */
  const RAMP = ["--graph-shadow", "--graph-floor", "--graph-edge"] as const;

  it.each(THEMES)("%s: gets quieter the less it means", (theme) => {
    const surface = resolve(theme, "--graph-space-near");
    const ratios = RAMP.map((token) => ({
      token,
      ratio: contrast(resolve(theme, token), surface),
    }));
    for (const [quieter, louder] of adjacentPairs(ratios)) {
      expect(
        louder.ratio,
        `${louder.token} must be louder than ${quieter.token}`,
      ).toBeGreaterThan(quieter.ratio);
    }
  });

  it.each(THEMES)("%s: stays quieter than every node", (theme) => {
    const surface = resolve(theme, "--graph-space-near");
    const quietestNode = Math.min(
      ...hues(theme, NODE_TERMINATOR).map((hue) => contrast(hue, surface)),
    );
    for (const token of RAMP) {
      expect(
        contrast(resolve(theme, token), surface),
        `${token} against the quietest node`,
      ).toBeLessThan(quietestNode);
    }
  });
});

/**
 * The branch-family tint (intent `graph-branch-family-tint`).
 *
 * This is the one place the palette contract is deliberately *looser* than the
 * validator: a tinted descendant sits above the lightness band on purpose, which is
 * what makes a branch read as one family of colours rather than one flat colour. The
 * band still binds on the hues themselves - the block above - and those are what the
 * header key lists and what every all-pairs and CVD check runs on, because nothing a
 * descendant does may change which branch it belongs to.
 *
 * What replaces the band here is written below: the ladder stays inside its ceiling,
 * every rung stays a colour rather than drifting to grey, consecutive rungs stay far
 * enough apart to be seen as different, and - the load-bearing one - every shade in
 * the picture stays nearer its own branch root than any other ring hue. Those are
 * the properties `TINT_STEP` and `HUE_SPAN` were sized against, so this is the test
 * that fails if either is moved.
 */
describe("the branch-family tint", () => {
  /** MAX_DEPTH is 4 and the ring topic is untinted, so four rungs including it. */
  const RUNGS = 4;

  /**
   * The furthest a node at `depth` can have turned from its branch root: its own
   * generation's half-width plus every generation above it. Built from `HUE_SPAN`
   * the same way `assignColours` spends it, so the two cannot drift apart.
   */
  const reach = (depth: number) => {
    let total = 0;
    for (let d = 2; d <= depth; d += 1) total += HUE_SPAN / 2 ** (d - 1);
    return total;
  };

  /** One branch's ladder, at the extreme of the fan in both directions. */
  const ladder = (theme: (typeof THEMES)[number], slot: number, sign: number) =>
    Array.from({ length: RUNGS }, (_, rung) =>
      familyShade(
        resolve(theme, hueToken(slot)),
        TINT_STEP * rung,
        sign * reach(rung + 1),
        TINT_CEILING,
      ),
    );

  const every = (theme: (typeof THEMES)[number]) =>
    Array.from({ length: HUE_COUNT }, (_, slot) => slot).flatMap((slot) =>
      [-1, 0, 1].map((sign) => ({ slot, rungs: ladder(theme, slot, sign) })),
    );

  it("spends less hue at each level, so the family is bounded by construction", () => {
    // Not a clamp: a clamp would hand two siblings the same hue at the bottom of
    // the tree without saying so.
    expect(reach(RUNGS)).toBeLessThan(HUE_SPAN);
    expect(reach(2)).toBeGreaterThan(reach(RUNGS) - reach(2));
  });

  it.each(THEMES)("%s: never climbs past the ceiling", (theme) => {
    for (const { rungs } of every(theme)) {
      for (const hue of rungs) {
        expect(oklch(hue).L, `${hue} lightness`).toBeLessThanOrEqual(
          TINT_CEILING + 0.005,
        );
      }
    }
  });

  it.each(THEMES)("%s: keeps every rung above the chroma floor", (theme) => {
    // Lightness and hue, not a mix toward white, is what makes this hold: the
    // lightest rungs are where a mix would have desaturated into grey.
    for (const { rungs } of every(theme)) {
      for (const hue of rungs) {
        expect(oklch(hue).C, `${hue} chroma`).toBeGreaterThanOrEqual(
          CHROMA_FLOOR,
        );
      }
    }
  });

  /**
   * Where the ceiling bites: the hues that start high enough that the deepest rungs
   * would pass it, so their lightness ladder flattens and the hue turn is all that
   * separates those levels. Written as slot numbers rather than derived, because
   * flattening a ladder is a thing to decide, not to discover.
   */
  const FLATTENED = { light: [1, 2, 6], dark: [1, 4, 5] } as const;

  it.each(THEMES)("%s: only the documented ladders flatten out", (theme) => {
    const flattened = Array.from({ length: HUE_COUNT }, (_, slot) => ({
      slot,
      base: oklch(resolve(theme, hueToken(slot))).L,
    }))
      .filter((row) => row.base + TINT_STEP * (RUNGS - 1) > TINT_CEILING)
      .map((row) => row.slot);
    expect(flattened).toEqual([...FLATTENED[theme]]);
  });

  it.each(THEMES)("%s: separates one level from the next", (theme) => {
    // Below this a parent and its children are one flat blob at leaf size; the
    // point of the family is that a level is visible as a level.
    const SEEN = 3;
    for (const { slot, rungs } of every(theme)) {
      const base = oklch(rungs[0]!).L;
      for (const [index, [above, below]] of adjacentPairs(rungs).entries()) {
        // Past the ceiling the lightness ladder is flat by design - the hue turn
        // is what is left to separate those rungs, and it is checked with them.
        if (base + TINT_STEP * (index + 1) > TINT_CEILING) continue;
        expect(
          deltaE(above, below),
          `slot ${slot}: ${above} vs ${below}`,
        ).toBeGreaterThanOrEqual(SEEN);
      }
    }
  });

  it.each(THEMES)("%s: never lets a node drift onto another branch", (theme) => {
    // The one that matters. A descendant may be lighter and turned, but it has to
    // stay on its own branch's side of the hue circle - otherwise it reads as
    // hanging off a different topic, which is the whole thing colour is for here.
    //
    // Angle, not dE: the lightness ladder moves a deep node a long way from its own
    // root in dE without making it ambiguous, so a dE comparison would fail nodes
    // that are perfectly legible and pass ones that are not.
    const ring = Array.from({ length: RING_SLOTS }, (_, slot) =>
      oklch(resolve(theme, hueToken(slot))).h,
    );
    for (const { slot, rungs } of every(theme)) {
      if (slot >= RING_SLOTS) continue;
      for (const hue of rungs) {
        const own = hueGap(oklch(hue).h, ring[slot]!);
        for (const [other, root] of ring.entries()) {
          if (other === slot) continue;
          expect(
            hueGap(oklch(hue).h, root),
            `${hue} (branch ${slot}) against branch ${other}`,
          ).toBeGreaterThan(own);
        }
      }
    }
  });

  it.each(THEMES)("%s: keeps a margin on the closest two branches", (theme) => {
    // The margin the span was sized against, asserted rather than remembered: if a
    // future hue lands closer to its ring neighbour than twice the fan's reach,
    // this fails before anything drifts.
    const ring = Array.from({ length: RING_SLOTS }, (_, slot) =>
      oklch(resolve(theme, hueToken(slot))).h,
    );
    const closest = Math.min(
      ...allPairs(ring).map(([a, b]) => hueGap(a, b)),
    );
    expect(closest / 2, "half the closest ring gap").toBeGreaterThan(
      reach(RUNGS),
    );
  });
});

describe("the two dark scopes", () => {
  it("declare the same graph colours, so a user's choice matches their OS", () => {
    const graphTokens = (declarations: Map<string, string>) =>
      Object.fromEntries(
        [...declarations].filter(([name]) => name.startsWith("--graph-")),
      );
    expect(graphTokens(SCOPES.darkAttribute)).toEqual(
      graphTokens(SCOPES.darkMedia),
    );
  });

  it("declare a value for every slot the code can ask for", () => {
    for (const declarations of Object.values(SCOPES)) {
      const isDark = declarations !== SCOPES.light;
      if (isDark && !declarations.has(hueToken(0))) continue;
      for (let slot = 0; slot < HUE_COUNT; slot += 1) {
        expect(declarations.has(hueToken(slot)), hueToken(slot)).toBe(true);
      }
    }
  });
});
