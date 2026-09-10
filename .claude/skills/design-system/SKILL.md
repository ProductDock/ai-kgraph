---
name: design-system
description: ProductDock brand and UX standards for ai-kgraph — color, typography, spacing, radius, borders, motion, and accessibility rules. Apply when writing a spec.md or plan.md that touches UI, when building or reviewing any component, or when asked to "apply brand guidelines", "check UX standards", or "review design/UI consistency".
allowed-tools: Read, Edit, Grep, Glob
---

# Design System — ProductDock brand + UX standards

This is the institutional-knowledge skill the Stage 2 (Design) standard prompt refers to
when it says "apply the skills available to you so the plan conforms to our brand
guidelines... and UX standards" (`docs/ai-native-sdlc-playbook.md`, Lesson 3). It is
**advisory**: it tells Claude what "on brand" and "accessible" mean for this app. It does
not enforce anything — a linked lint rule or CI check would be the deterministic half,
and none exists yet.

## How this relates to the current tokens

`src/app/globals.css` already implements the role-named-token pattern this skill assumes:
role tokens (`--page`, `--text-primary`, `--border`, …) declared once, then bridged to the
shadcn-facing `@theme inline` names (`--color-background`, `--color-primary`, …). The
comment there says a brand swap is "a values-only edit of this block" — that's what
applying this skill means in practice. **Do not invent new token names**; replace the
`dataviz` placeholder values with the ones below, keep the light/dark/`data-theme`
structure exactly as it is.

## Color

| Role | Value | Source |
|---|---|---|
| Ink / primary text | `#0a0c0e` | dominant color, 430 occurrences, high confidence |
| Page background | `#ffffff` | high confidence |
| Secondary text | `#353c43` | medium confidence |
| Muted / hairline border | `#dce3e9` (`rgb(220,227,233)`) | border scan, high confidence |
| Divider (alt) | `#e5e7eb` | secondary border scan |
| Brand accent (blue) | `#027ac2` (`rgb(2,122,194)`) | link color, focus ring, shadow tint |
| Brand accent (orange) | `#ea592a`, hover/darker `#c44821` | CTA + secondary link color |

Rules:
- `#0a0c0e` and `#ffffff` carry primary/foreground and page/background — do not lighten
  ink to a soft gray; ProductDock's body text is near-black, not `#52514e`.
- Blue (`#027ac2`) is the primary interactive color: it's the CTA button background
  *and* the link/focus accent on the source site (`components.buttons[0].states.default`
  in the raw extraction) — map it to `--color-primary` and `--color-ring`/`--focus-ring`
  both. Primary-button text stays ink (`#0a0c0e`), not white — the extraction shows ink
  text over the blue background, not an inverted white-on-blue button.
- Orange (`#ea592a`) is reserved for secondary emphasis (secondary CTAs, highlighted
  links) — never combine both accents in the same control.
- Dark mode: the extractor only saw the light theme (ProductDock's site doesn't ship
  one). Derive dark values the way `globals.css` already does — invert page/ink, keep
  hairline borders at low-opacity white instead of picking new colors — do not fabricate
  a "brand dark mode" that wasn't observed.

## Typography

- Font family: **Poppins** for both headings and body (`--font-sans` in `globals.css`).
  Keep a system-ui fallback stack — Poppins may fail to load, and the app must not go
  invisible (`font-display: swap` if self-hosted, or `next/font` with a fallback).
- Heading weights are 600, body/link weights split 400 (body) / 500–600 (emphasis,
  links, nav) — don't default everything to 400 or 700.
- Larger headings carry tight, negative letter-spacing that loosens as size drops
  (roughly `-0.04em` at 48px+ down to `0` at 16px). Apply tracking only above ~24px;
  body text stays at normal tracking.
- Line-height tightens as size grows: display sizes near `1.0`–`1.25`, body text
  `1.5`–`1.75`. Don't use one line-height value across the whole type scale.

## Spacing

Extracted values cluster on an 8px rhythm with 4px half-steps for small gaps: `4, 8, 16,
24, 32, 40, 48, 64, 80` px, plus 4/5/6/10px for tight internal padding (icon gaps,
badge padding). Use Tailwind's default spacing scale (already 4px-based) rather than
inventing a parallel one — it already covers this range.

## Radius

Two shapes only, both **high or low confidence, nothing in between**:
- **Pill** (`9999px` / `rounded-full`) — buttons, badges, avatars, tags. This was the
  high-confidence signal (11 occurrences across `div`, `a`, `i`, pill-shaped controls).
- **Small** (`~10px` / `rounded-lg`) — cards and containers.
Don't introduce a medium radius (`6px`/`8px`) as a third option — the source site
doesn't use one, and a third value fragments the scale for no visual gain.

## Borders & elevation

- Hairline `1px solid` dividers in `#dce3e9`, never a heavier rule or a solid gray box
  border on cards — separate content with a hairline or with background-color contrast,
  not a heavy border.
- Only one shadow was observed, a brand-blue-tinted soft shadow on a single hero
  element (`0 10px 40px -10px rgba(2,122,194,.6)`, low confidence). Don't build a
  generic elevation scale (`shadow-sm/md/lg`) from this — one low-confidence sample
  isn't a system. Prefer borders/background over shadow for depth until a real
  component inventory justifies more.

## Interaction states

- **Links**: default color varies by context (white on dark surfaces, ink on light,
  blue/orange for accent links) but hover is consistent — collapse to ink (`#0a0c0e`)
  with an underline. Implement hover as one shared rule, not per-variant colors.
- **Buttons**: background stays constant across default/active; focus state swaps text
  to the orange accent and adds a visible ring — never remove the focus ring, only
  restyle it (`:focus-visible` handling in `globals.css` already does this via
  `--focus-ring`; point that at the accent, don't add a second focus mechanism).
- **Reduced motion**: `globals.css` already zeroes animation/transition durations under
  `prefers-reduced-motion: reduce` — any new animation must be added inside that guard
  too, not bypass it.

## Component boundary (repeats `CLAUDE.md`, kept here because reviewers check both)

- `components/ui/**` is shadcn-generated — apply brand values only through the token
  bridge in `globals.css`, never by hand-editing generated component files.
- `components/common/**` composes `ui/`; brand-specific styling (e.g. the pill/hairline
  rules above) belongs here, not duplicated per-route.

## Accessibility baseline

- Contrast: `#0a0c0e` on `#ffffff` and `#ffffff` on `#0a0c0e` both clear WCAG AA by a
  wide margin — preserve that when substituting the accent colors for text; `#ea592a`
  text on white is borderline for small text, so use it for large text, icons, or
  backgrounds with white text on top, not small body copy.
- Every interactive element keeps a visible `:focus-visible` ring (see above) — no
  `outline: none` without a replacement.
- Icon-only controls (common with the pill-radius / `i` elements observed) need an
  accessible name (`aria-label` or visually-hidden text) — the source site's icon system
  wasn't extractable, so don't assume the icon alone communicates intent.

## When applying this skill

1. **Design stage** (`spec.md` generation): map any new UI surface to the roles above —
   call out which accent (blue vs. orange), which radius (pill vs. small), and confirm
   dark-mode values are derived, not invented.
2. **Build stage**: styling changes go through `globals.css` role tokens; component code
   references Tailwind utility/theme classes, never raw hex values.
3. **Review stage**: flag hardcoded colors/spacing that bypass the token bridge, missing
   focus-visible styles, a third radius value, or a new shadow scale as findings — same
   severity tier as a `nextjs-code-review` architecture finding, not a nit.

## Re-running the extraction

The palette above is a snapshot. To refresh it as the real productdock.com evolves, rerun
`/extract-design-system https://productdock.com/`, diff the new `raw.json` against the
values documented here, and update this file's tables — don't silently drift the two out
of sync.
