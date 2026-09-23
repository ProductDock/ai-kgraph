/**
 * The code-highlight contract, enforced (node-content-pages plan, "Rendering").
 *
 * Code blocks are the first coloured text on a content page, and the page is held to
 * WCAG 2.2 AA (spec Q4). So this reads the real `globals.css` the way
 * `palette.contract.test.ts` does and asserts every `hljs-*` colour clears 4.5:1
 * against the block's own `--surface-1`, in both themes. When it fails, the fix is a
 * colour decision in `globals.css`, not an edit here.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrast } from "@/lib/graph/colour-metrics";

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const TEXT_CONTRAST_MIN = 4.5;

/** The classes rehype-highlight emits for the languages a page is likely to use. */
const REQUIRED = [
  "keyword",
  "string",
  "comment",
  "number",
  "title",
  "built_in",
  "attr",
];

/** Same helper as `palette.contract.test.ts`: one selector block's declarations. */
function scope(selector: string): Map<string, string> {
  const start = CSS.indexOf(selector);
  expect(start, `no \`${selector}\` block in globals.css`).toBeGreaterThan(-1);
  const body = CSS.slice(start + selector.length);
  const end =
    body.indexOf("\n  }") >= 0 && body.indexOf("\n  }") < body.indexOf("\n}")
      ? body.indexOf("\n  }")
      : body.indexOf("\n}");
  const declarations = new Map<string, string>();
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

function resolve(theme: "light" | "dark", token: string): string {
  const own = theme === "light" ? SCOPES.light : SCOPES.darkMedia;
  const value = own.get(token) ?? SCOPES.light.get(token);
  expect(value, `${token} is not declared`).toBeDefined();
  const reference = /^var\((--[\w-]+)\)$/.exec(value!);
  if (reference) return resolve(theme, reference[1]!);
  return value!;
}

/** Every `.hljs-*` class and the colour value its rule sets, comments stripped. */
function hljsColours(): Map<string, string> {
  const css = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  const colours = new Map<string, string>();
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const color = /(?:^|;|\s)color:\s*([^;]+);/.exec(body!)?.[1]?.trim();
    if (!color) continue;
    for (const [, name] of selectors!.matchAll(/\.hljs-([\w-]+)/g)) {
      colours.set(name!, color);
    }
  }
  return colours;
}

const colours = hljsColours();

describe("code-block highlighting", () => {
  it("maps every class the highlighter emits", () => {
    for (const name of REQUIRED) {
      expect(colours.has(name), `.hljs-${name} has no colour`).toBe(true);
    }
  });

  it("uses role tokens only, never a literal colour", () => {
    for (const [name, value] of colours) {
      expect(value, `.hljs-${name}`).toMatch(/^var\(--[\w-]+\)$/);
    }
  });

  it("keeps the two dark scopes in step for every token it uses", () => {
    for (const value of colours.values()) {
      const token = /^var\((--[\w-]+)\)$/.exec(value)![1]!;
      expect(SCOPES.darkAttribute.get(token), token).toBe(
        SCOPES.darkMedia.get(token),
      );
    }
  });

  describe.each(["light", "dark"] as const)("the %s theme", (theme) => {
    it.each([...colours])(
      ".hljs-%s clears 4.5:1 against --surface-1",
      (_name, value) => {
        const token = /^var\((--[\w-]+)\)$/.exec(value)![1]!;
        const ratio = contrast(
          resolve(theme, token),
          resolve(theme, "--surface-1"),
        );
        expect(ratio, `${token} in ${theme}`).toBeGreaterThanOrEqual(
          TEXT_CONTRAST_MIN,
        );
      },
    );

    it("keeps the block's own ink at 4.5:1 too", () => {
      expect(
        contrast(
          resolve(theme, "--text-primary"),
          resolve(theme, "--surface-1"),
        ),
      ).toBeGreaterThanOrEqual(TEXT_CONTRAST_MIN);
    });
  });
});
