/**
 * The computable colour checks, ported from the `dataviz` skill's
 * `scripts/validate_palette.js` so that `palette.contract.test.ts` can run them in
 * CI instead of a human remembering to.
 *
 * Ported, not re-derived: the thresholds and the CVD simulation matrices are the
 * skill's, and the skill is explicit that the simulation model is part of the
 * standard rather than an implementation detail - swapping Machado-Oliveira-
 * Fernandes (2009) for another model moves borderline pairs and would require
 * recalibrating every threshold here. If the skill's script changes, re-port it.
 *
 * Framework-agnostic and CSS-value-free like the rest of `lib/graph`: hex strings
 * in, plain numbers out.
 */

/** OKLCH lightness band a categorical palette must sit inside, per theme. */
export const BAND = { light: [0.43, 0.77], dark: [0.48, 0.67] } as const;
/** Below this OKLCH chroma a hue reads as grey. */
export const CHROMA_FLOOR = 0.1;
/** OKLab dE*100 under simulated protanopia/deuteranopia. Below FLOOR is a fail; */
/** between FLOOR and TARGET is legal only with a secondary encoding. */
export const CVD_TARGET = 8;
export const CVD_FLOOR = 6;
/** OKLab dE*100 unsimulated. A hard gate: secondary encoding does not excuse it. */
export const NORMAL_FLOOR = 15;
/** WCAG ratio against the surface. Below it needs the visible-label relief. */
export const CONTRAST_MIN = 3;

const MACHADO = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
} as const;

export type Vision = keyof typeof MACHADO;

type Triple = [number, number, number];

function hexToSrgb(hex: string): Triple {
  const value = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    // Unguarded, parseInt propagates NaN through every check below and the run
    // fails *open* - every threshold comparison against NaN is false.
    throw new Error(`Not a six-digit hex colour: ${JSON.stringify(hex)}`);
  }
  return [0, 2, 4].map(
    (i) => parseInt(value.slice(i, i + 2), 16) / 255,
  ) as Triple;
}

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = (c: number) => {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
};

const linear = (hex: string) => hexToSrgb(hex).map(toLinear) as Triple;

function oklabFromLinear([r, g, b]: Triple): Triple {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLCH lightness and chroma. */
export function oklch(hex: string): { L: number; C: number } {
  const [L, a, b] = oklabFromLinear(linear(hex));
  return { L, C: Math.hypot(a, b) };
}

/** WCAG contrast ratio between two opaque colours. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, b_] = linear(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b_;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** OKLab distance x100, optionally through a simulated colour vision deficiency. */
export function deltaE(a: string, b: string, vision?: Vision): number {
  const through = (hex: string): Triple => {
    const rgb = linear(hex);
    if (!vision) return rgb;
    const m = MACHADO[vision];
    return m.map((row) =>
      Math.min(
        1,
        Math.max(0, row[0]! * rgb[0] + row[1]! * rgb[1] + row[2]! * rgb[2]),
      ),
    ) as Triple;
  };
  const p = oklabFromLinear(through(a));
  const q = oklabFromLinear(through(b));
  return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/**
 * A colour as the scene actually draws it at the darkest point of a node: the
 * albedo scaled in *linear* light, which is where the renderer does it.
 *
 * The palette checks are written for flat swatches, and the scene stopped drawing
 * flat swatches the day the nodes were lit. Running them on the albedo alone
 * validates a colour no pixel on screen has.
 */
export function shade(hex: string, factor: number): string {
  return `#${linear(hex)
    .map((c) =>
      Math.round(toSrgb(c * factor) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Every unordered pair of indices, for the all-pairs checks. */
export function allPairs<T>(items: T[]): [T, T][] {
  const pairs: [T, T][] = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1)
      pairs.push([items[i]!, items[j]!]);
  }
  return pairs;
}

/** Consecutive pairs, for the adjacent checks. */
export function adjacentPairs<T>(items: T[]): [T, T][] {
  return items.slice(0, -1).map((item, i) => [item, items[i + 1]!] as [T, T]);
}

/** The worst (smallest) separation over a pairlist, under the given vision. */
export function worstSeparation(
  pairs: [string, string][],
  vision?: Vision,
): { distance: number; pair: [string, string] } {
  let worst: { distance: number; pair: [string, string] } | null = null;
  for (const pair of pairs) {
    const distance = deltaE(pair[0], pair[1], vision);
    if (!worst || distance < worst.distance) worst = { distance, pair };
  }
  return worst ?? { distance: Infinity, pair: ["", ""] };
}
