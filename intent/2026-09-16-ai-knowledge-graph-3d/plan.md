# Plan: See our AI learning as a 3D knowledge graph

- **Intent:** [`intent.md`](./intent.md) · **Spec:** [`spec.md`](./spec.md)
- **Issue:** #21 · **Branch:** `plan/ai-knowledge-graph-3d`
- **Stage:** 3 — plan & design review (AI-Native SDLC, lesson 4)
- **Date:** 2026-09-17

> **Depends on the spec amendment.** Planning falsified the spec's R-1, so `spec.md` was
> amended on branch `spec/ai-knowledge-graph-3d-renderer` (D-1, §7.1, §7.2, §7.6, §8.3,
> §11, §13, and a resolution line on all twelve areas of concern). That PR is gate 2 again
> and **merges before step 1 of this plan begins**. This plan is written against the
> amended spec.

---

## What was resolved before planning

The spec's §13 named three blockers and its `## Areas of concern` named five product-owner
decisions. All eight are closed. The two that changed the design:

**The depth ramp is validated** (§13.3, C-4, R-6, gate V-6). `dataviz`'s
`validate_palette.js --ordinal`, run against **this app's** surfaces rather than the
validator's defaults:

```
$ node <dataviz>/scripts/validate_palette.js \
    "#014976,#00619c,#027ac2,#3194de,#50affb" --ordinal --mode light --surface "#ffffff"

Palette (light, surface #ffffff, ordinal ramp): 5 slots
  [PASS] Lightness monotone     steps read light→dark
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #50affb at 2.37:1 vs surface
  [PASS] Single hue             hue spread 1°
  → ALL CHECKS PASS                                              exit 0

$ node <dataviz>/scripts/validate_palette.js \
    "#50affb,#3799e3,#1983cc,#036eaf,#025a90" --ordinal --mode dark --surface "#0a0c0e"

Palette (dark, surface #0a0c0e, ordinal ramp): 5 slots
  [PASS] Lightness monotone     steps read light→dark
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #025a90 at 2.68:1 vs surface
  [PASS] Single hue             hue spread 1°
  → ALL CHECKS PASS                                              exit 0
```

Ramp B as specified: the brand blue `#027ac2` (`--focus-ring`), OKLCH hue held constant,
`#027ac2` itself as the level-2 step. The dark column is **re-stepped for the dark
surface, not mirrored** (NFR-6) — a literal mirror also passes but at only 2.07:1 against
the 2.0 light-end floor, where the shipped column gets 2.68:1. Ramp A is dropped.

**There is no usable `@react-three/fiber`** (§13.1, §13.2, R-1). Every published release —
`9.7.0`, the `10.0.0` alphas, the canaries — caps at `react <19.3`; this repo pins
`19.3.0`. The bound is deliberate, because r3f binds to React's reconciler internals, so
this is an `npm ci` ERESOLVE failure *and* a silent-runtime-breakage risk. **Decision:
vanilla `three@0.186.0` plus `@types/three@0.186.0`, no React binding library.** Neither
has a React peer, so this cannot recur, and no `transpilePackages` entry is needed. The
rejected alternatives and the full reasoning are in the amended §7.2.

### The other calls, in one table

| # | Call |
| --- | --- |
| **C-1** accessibility | Trade **approved**, and the follow-up intent is opened in the same commit this merges — not afterwards (R-7 is High/High, and this is the app's only product surface) |
| **C-2** legend | **Inline depth key** in the route header — five swatches, five words, reading `lib/graph/palette.ts`. Not the excluded sidebar. A small, deliberate addition over the spec |
| **C-3** depth cap | **Accepted.** Verified to bind on the first commit: 36 nodes, deepest is `ai/n-node/rag/vector-db/pgvector` at depth 4 |
| **C-6** dependencies | **Approved**, and two packages rather than three |
| **C-8** placeholders | Ship verbatim; the naming question goes to Nemanja **before** merge |
| **C-10** popup gesture | **Decided, not built:** double-click on desktop, long-press on tablet. Recorded in `CLAUDE.md` |
| **C-12** theme store | Fixed in a **separate small PR**, not absorbed into this one |
| **D-7, D-8** | Both kept — click-empty / `Escape` returns to overview; one home-page link |

### Still open after this plan

Two, both content, both Nemanja's, both already open in the intent: what `n Node` is
actually called, and real titles for the four note-style labels. They do not block the
build and the seed ships them verbatim — but they block the *outcome*, because the
`n Node` branch is 12 of 36 nodes and the success criterion is that a newcomer can read
the picture unaided. Ten minutes of work; it should happen before merge, not after.

**C-9 is also still open and owned by nobody:** hosting. The deliverable of this plan is a
page that runs on `localhost:3000`. *"A page my team and I can open"* is satisfied by no
intent in this repository.

### One spec detail that was wrong on contact with the code

§7.4 aliased `--graph-edge` to `--gridline`. In dark mode `--gridline` is
`rgb(255 255 255 / 0.08)` (`globals.css:56`, `:68`), which `THREE.Color` cannot parse.
`--graph-edge` now carries its own opaque hex per scope — `#e5e7eb` light, `#2a2f35` dark
— each matching the rendered appearance of the aliased value over `--page`. Corrected in
the spec amendment, not worked around here.

---

## Files changed

### New — `src/lib/graph/` · framework-agnostic, imports nothing from `three`, `app/` or `components/`

| Path | What happens to it |
| --- | --- |
| `seed.ts` | **The content.** Nested `{ name, children? }` `satisfies GraphSeed`, transcribed exactly from the intent's Constraints tree — 36 nodes, five levels, placeholders unedited. The only file a content change touches |
| `types.ts` | `GraphSeed`, `GraphNode` (`id`, `name`, `depth`, `parentId`, `leafCount`), `GraphEdge`, `GraphScene` — the prop payload, plain numbers and strings |
| `schema.ts` | Recursive zod v4 `.strict()` schema: no unknown keys, `name` trimmed / non-empty / ≤ 60 chars, sibling names unique, depth ≤ 4, total ≤ 150 |
| `tree.ts` | `flatten(seed)` — validate, then walk to nodes and edges with slugified path ids (`ai/n-node/rag/vector-db/pgvector`) and a `leafCount` per node. Throws naming the offending id path |
| `layout.ts` | Pure `layout(nodes) → Map<id, [x, y, z]>`. Depth shells, solid-angle cones allocated by child leaf count, golden-angle spiral within a cone, the whole sphere for the root's children. No `Math.random()`, no clock |
| `palette.ts` | `depthToken(depth)` → `--graph-depth-N`, and `radiusForDepth(depth)`. Pure and exported, so the depth key reads the same source the scene does |
| `*.test.ts` | Colocated, house style |

### New — `src/app/graph/`

| Path | What happens to it |
| --- | --- |
| `page.tsx` | Server Component. `import { seed }` → `flatten` → `layout` → pass `GraphScene` down as a prop. Exports `metadata`. Renders the chrome: `<main id="main-content">` — **the root layout's skip link targets that id and nothing else provides it** (`layout.tsx:45`) — one `h1`, a back link, its own `<ThemeToggle />` (it is page-level in this repo, not layout-level, so a new route silently loses it), and the depth key. Never imports `three` |
| `loading.tsx` | Canvas-shaped `Skeleton` with `aria-busy` and an `aria-live="polite"` status line, mirroring the route the way `src/app/loading.tsx` mirrors the home page |
| `error.tsx` | `'use client'`, same props and production-digest-only rule as `src/app/error.tsx` |
| `_components/graph-view.tsx` | `'use client'`. Gate only — `useMounted()` + viewport + WebGL probe, then `next/dynamic(..., { ssr: false })` for the scene, so `three` never sits at module scope |
| `_components/graph-scene.tsx` | `'use client'`. One effect owns the whole scene: `WebGLRenderer`, `PerspectiveCamera`, `OrbitControls` (`three/examples/jsm/controls/OrbitControls.js`, shipped inside `three`), an `InstancedMesh` of node spheres, one `LineSegments` of edges, a `Raycaster` for picking, an `invalidate()` helper, and a teardown that disposes every one of them |
| `_components/graph-labels.tsx` | A fixed pool of 24 absolutely-positioned `div`s, `pointer-events: none`. Project, sort by camera distance, shallower depth breaks ties, root and focused pinned first. Positions and opacity written **to refs, never through React state** |
| `_components/depth-key.tsx` | C-2. Five swatches, five words, reading `palette.ts` |
| `_components/unsupported-notice.tsx` | FR-8. Existing `Card`, two copy variants (too small / no WebGL), copy verbatim from §7.9 |
| `*.test.tsx` | Gate and label-selection tests |

### New — `src/hooks/`

Three hooks, each shaped like the existing `use-mounted.ts` (including its
`react-hooks/set-state-in-effect` disable where an effect sets state):
`use-webgl-support.ts` (one memoised probe, context discarded immediately),
`use-viewport-supported.ts` (`matchMedia("(min-width: 768px)")`, mount-safe), and
`use-theme-tokens.ts` — reads CSS custom properties off `document.documentElement` and
re-reads on **both** a `MutationObserver` for `data-theme` *and* a `matchMedia` change
listener. Deliberately **not** `useUiStore`, per C-12: that store hardcodes
`theme: "light"` and never hydrates, so it does not describe the DOM.

### Amended — four files, all additively

| Path | What happens to it |
| --- | --- |
| `src/app/globals.css` | `--graph-depth-0…4`, `--graph-edge`, `--graph-label-halo` added to all three existing scopes (`:root`, the `prefers-color-scheme: dark` block, `:root[data-theme="dark"]`). **Not** bridged into `@theme inline` — they are not shadcn slots, following the `--accent-secondary` precedent |
| `src/app/page.tsx` | One sentence with a link to `/graph`, as a sibling `Card` in the existing `gap-6` column |
| `CLAUDE.md` | New `## Graph data` section: where the seed lives, the five-level cap and what happens the day it binds, the new tokens, and the popup gesture reserved by C-10 |
| `package.json` + lockfile | `three@0.186.0`, `@types/three@0.186.0` (dev). Exact pins, no carets, per the baseline's NFR-2 |

---

## Sequence of work

Each step is independently verifiable, and the verification is named. Step 0 is the gate;
nothing after it starts until it merges.

The steps fix **invariants, not tuning values**. Camera distances, fog near/far,
`SHELL_GAP` and the label near/far thresholds are deliberately left to the screen — the
right number is the one that looks right, and the tests assert the properties that must
hold regardless of which number that is. Everything else here is decided.

0. **Spec amendment merges** (`spec/ai-knowledge-graph-3d-renderer`). Comment the r3f
   finding on issue #21, label it `blocked-on-spec`, link the PR. Gate 2 again. → then
   this `plan.md` lands.
1. **Seed + schema + flatten.** The content, the invariants, the ids. → V-3, V-5
2. **Layout.** The pure geometry function. Nothing rendered yet. → V-4
3. **Tokens + palette mapping.** `globals.css` in all three scopes, `palette.ts`. → V-6
4. **Route shell.** `page.tsx` with `id="main-content"`, chrome, `h1`, back link,
   `ThemeToggle`, `metadata`, `loading.tsx`, `error.tsx`. Still no canvas. → V-2
5. **Gate + notice.** Viewport, WebGL probe, both copy variants. → V-10, V-18
6. **Canvas, nodes, edges.** `three` enters the tree for the first time, behind
   `next/dynamic`. **This is the riskiest step** — see R-12. → V-8, V-19
7. **Labels.** The 24-element pool and its selection function. → V-14
8. **Controls and fly-to.** Orbit, zoom, click-to-fly, click-empty / `Escape` back to
   overview, panning disabled, reduced motion checked in JS. → V-11
9. **Depth key and theme token re-read.** Both themes, toggled mid-session. → V-15
10. **Budget and frame rate.** Measured on real hardware, numbers recorded back into this
    file. → V-9, V-12
11. **`CLAUDE.md`**, and **open the C-1 accessibility follow-up intent** in the same commit.

Not in this PR: the C-12 `ui-store` hydration fix.

---

## Risks

**Nothing existing changes behaviour.** The four amendments are additive — new tokens in
scopes that already exist, one home-page link, a `CLAUDE.md` section, two dependencies.
`src/lib/env.ts`, `providers.tsx` and `layout.tsx` are untouched, so neither the
client-boundary trap nor the per-request-QueryClient trap is in play. The one behavioural
risk to the rest of the app is R-8.

| ID | Risk | L / I | Mitigation |
| --- | --- | --- | --- |
| ~~R-1~~ | ~~r3f does not match React 19~~ | **closed** | It fired, and is eliminated rather than mitigated: vanilla `three` has no React peer |
| ~~R-6~~ | ~~Ramp fails the validator~~ | **closed** | Validated, both modes, exit 0 |
| R-2 | `three` majors break the scene silently | M / M | Exact pin; majors open a PR a human reads (baseline D-7). Our API surface is small and stable — `InstancedMesh`, `LineSegments`, `Raycaster`, `OrbitControls` |
| R-3 | Tablet frame rate misses NFR-1 (≥ 30 fps) | M / M | Render-on-invalidate, instancing, unlit `MeshBasicMaterial`, ≤ 24 labels. V-12 measures on real hardware |
| R-4 | Labels overlap or flicker at branch boundaries | M / M | Nearest-24 cap with a shallower-depth tiebreak; raycast occlusion for the 24 pooled labels only is held in reserve (§7.8), not built speculatively |
| R-5 | The five-level cap blocks a content edit | **H** / M | It binds on the very first commit. Fails at build naming the node; extending it is a token edit plus a validator re-run. Documented in `CLAUDE.md` so whoever hits it first knows why |
| R-7 | Accessibility debt never paid | H / H | The follow-up intent is opened in the commit that merges this, not "later" (C-1) |
| R-8 | `three` lands in the home page's shared chunk | L / M | `next/dynamic` with `ssr: false` *inside* the client gate; `page.tsx` never imports it. V-9 asserts `/` is unchanged |
| R-9 | `n Node` placeholders ship and become permanent | M / M | Conspicuous by design, and raised to Nemanja before merge (C-8) |
| R-11 | Fog means the validated colour is the pixel colour only where fog has not mixed it | M / L | Intended — receding *is* the encoding — and the reason radius and shell distance carry depth too. Fog near/far tuned so the level-4 step stays distinguishable at overview framing; checked in V-15 |
| **R-12** | **The hand-rolled scene leaks GPU resources and listeners across route changes.** This is the specific cost of dropping r3f, which disposed for us | M / **M** | **The riskiest step in the plan, because it fails silently** — no error, just a browser that has run out of WebGL contexts after a few navigations. One effect, one cleanup: `dispose()` every geometry and material, `renderer.dispose()`, `forceContextLoss()`, cancel the pending frame, remove the resize / pointer / `webglcontextlost` / `MutationObserver` / `matchMedia` listeners. V-19 exists for this and nothing else. If it is wrong, the fix is contained to one cleanup function and reaches no other step |

Step 2 is the one most likely to be *unsatisfying* rather than broken — the solid-angle
allocation could still read as crowded. That is cheap to iterate: it is a pure function
with unit-tested invariants, and tuning `SHELL_GAP` and the cone angles changes no other
file.

**Rollback.** Revert the merge commit. The change is additive apart from the four small
amendments, so reverting removes the route, the tokens, the dependencies and the home-page
link and leaves the baseline exactly as it was. No data, no migration, no deployed state,
no persistence layer to unwind. The one thing a revert does not undo is the spec amendment
in step 0 — correctly, since the r3f finding is true whether or not this feature ships.

---

## Proof

V-1 … V-18 are the spec's §12. V-19 is new, and exists because D-1 changed.

| # | Check | How | Pass |
| --- | --- | --- | --- |
| V-1 | Toolchain green | `npm ci && npm run lint && npm run typecheck && npm test && npm run build` | all exit 0 |
| V-2 | `/graph` is static | `npm run build` route table | `/graph` prerendered |
| V-3 | Schema rejects a stray field | unit: a seed carrying `status: "todo"` | throws, names the node |
| V-4 | Layout invariants | unit: determinism across runs; distance from origin matches the depth shell; no two centres closer than 2.5× the larger radius; children always further out than their parent | pass |
| V-5 | Depth cap enforced | unit: a six-level seed | throws, names the node |
| V-6 | **Depth ramp validated** | `validate_palette.js "…" --ordinal --mode light --surface "#ffffff"` and `--mode dark --surface "#0a0c0e"` | both exit 0 — **run, reports above** |
| V-7 | Env access unchanged | `rg -n 'process\.env\.' src --glob '!src/lib/env.ts'` | no matches |
| V-8 | Draw calls | GL calls counted per rendered frame while orbiting | **pass — 259 frames, 259 `drawElementsInstanced` (nodes) + 259 `drawArrays` (edges) = exactly 1 + 1 per frame**, unchanged at 148 nodes |
| V-9 | Bundle isolation and budget | `npm run build` output; grep every chunk `/` loads for `three` | **pass — `/graph`-only JS 152.7 KB gzip** (budget 400). `/` loads 13 scripts, none containing `three`; `three` sits in one 136.1 KB gzip chunk reached only through the dynamic import |
| V-10 | No-WebGL path | component test, WebGL probe stubbed to `null` | notice rendered, no canvas, **`three` never imported** |
| V-11 | Reduced motion | unit on the tween helper, `matchMedia` stubbed to `reduce` | duration 0, no intermediate frames |
| V-12 | Frame rate | orbit continuously, frames counted in the browser, at 36 and at 148 nodes | **desktop pass — 60 fps (vsync-capped) at both sizes**, and 0 frames at rest within 1s of release. ⚠ **tablet not measured — no tablet available to the build; still owed** |
| V-13 | CSP clean | load `/graph` from the production build, read the browser console | **pass — console entirely clean.** The only Report-Only entries are `unsafe-eval` reports caused by the Playwright harness's own `Runtime.evaluate`, not by the app |
| V-14 | Label cap | unit on the selection function with 150 nodes | ≤ 24 returned; root and focused always present |
| V-15 | Both themes | toggled mid-session in the browser, screenshots in both | **pass — the ramp, the edges and the fog re-read on `data-theme` with no remount and no flash** |
| V-16 | No new server surface | `rg -n "'use server'\|route\.ts\|middleware\.ts" src` | no matches |
| V-17 | Chrome keyboard path | tab through the route in the browser | **pass — skip link → back link → theme toggle, each with a visible focus ring.** The depth key is static text and correctly takes no tab stop, so the order is shorter than this row predicted |
| V-18 | Small-viewport path | component test, `matchMedia` stubbed below the threshold | notice rendered, no canvas mounted |
| **V-19** | **No GPU or listener leak** | navigated `/graph` → `/` → `/graph` ten times in a real browser, instrumenting `getContext` and `window.add/removeEventListener` | **pass — 20 window listeners added, 20 removed; exactly 1 canvas in the DOM after ten round trips; no context-loss events and no "too many active WebGL contexts" warning** |

**Where the tests live.** On the pure `lib/graph/**` functions and the non-canvas chrome.
jsdom has no WebGL, this repo has no `vi.mock` precedent and no `user-event` — and none of
that is a problem here, because the scene is a `next/dynamic` import *behind* the gate, so
the unsupported-path tests (V-10, V-18) never reach `three` at all. House style, from
`theme-toggle.test.tsx`: `@testing-library/react` with `fireEvent`, `findBy*` to cross the
mount boundary, role and accessible-name queries, explicit `vitest` imports, colocated
`*.test.ts(x)`.

## Measurements, recorded at step 10

Taken against `npm run build` + `npm run start`, driven by headless Chrome (the real Chrome
on this machine, not a bundled Chromium), viewport 1440×900.

| Measurement | Budget | Result |
| --- | --- | --- |
| `/graph`-only client JS | ≤ 400 KB gzip (NFR-4) | **152.7 KB gzip** — 136.1 of it `three`, in a chunk only the dynamic import reaches |
| `/` client JS | must not grow (NFR-3) | **unchanged** — 13 scripts, none containing `three` |
| Draw calls per frame | nodes 1, edges 1 (NFR-2) | **1 + 1**, at 36 nodes and at 148 |
| Desktop fps, orbiting | ≥ 60 (NFR-1) | **60**, at 36 nodes and at 148 |
| Frames at rest | render-on-invalidate | **0** within 1s of releasing the orbit |
| Labels on screen | ≤ 24 (NFR-2) | **22** at the overview framing, after the declutter pass |

**Still owed: the tablet number.** NFR-1 asks for ≥ 30 fps on a current tablet and no
tablet was available to this build. Everything the measurement would stress — instancing,
the unlit material, render-on-invalidate, the 24-label cap — is in place and measured on
the desktop, but the number itself is not evidence until someone runs it on the hardware.

### Two things the measurements found, which review would not have

1. **The idle page was rendering at 60 fps for ~3 seconds after every orbit.** Damping
   decays exponentially and every frame of that tail is a rendered frame, so the
   OrbitControls default (`dampingFactor` 0.05) left the GPU busy long after the viewer
   let go. Raised to `0.12`. This is exactly the failure render-on-demand exists to
   prevent, and it is invisible without counting frames.
2. **Labels piled up on each other** at the overview framing — the nearest-24 cap and the
   distance fade are not enough, because two nodes in different branches can project to
   nearly the same pixel however far apart they are in the scene. Fixed with a pure
   screen-space `declutter()` pass (tested), which drops a label that would land on one
   already placed. This is R-4 firing; it is cheaper than the raycast occlusion §7.8 held
   in reserve, and it fixes what was actually wrong on screen.
