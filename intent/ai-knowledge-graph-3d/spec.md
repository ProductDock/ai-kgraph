# Spec: See our AI learning as a 3D knowledge graph

- **Intent:** [`intent.md`](./intent.md) — *A map of what we are learning about AI, as a
  space you can move around in rather than a flat diagram*
- **Originator:** Nemanja (nemanja.vasic@productdock.com)
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** approved (merged in #17) — **amended at Stage 3 on 2026-09-17**, see the note below

> **Read `## Areas of concern` before approving.** Two of the intent's constraints
> contradict standards this repository already holds itself to (accessibility, and
> colour-alone encoding), and one constraint has an implication the intent did not
> anticipate (a hard depth cap). Each is recorded in §14 and cross-referenced from the
> section it affects.
>
> **Amended 2026-09-17, at Stage 3** (issue #21, branch `plan/ai-knowledge-graph-3d`).
> Planning falsified R-1: **no published `@react-three/fiber` accepts the React version
> this repo pins**, so D-1, §7.1, §7.2, §7.6, §8.3, §11 and §13 now specify vanilla
> `three` with no React binding library. The depth ramp has since been generated and
> validated in both modes, which closes C-4 and R-6. Amended passages are marked
> *Amended at Stage 3*.

---

## 1. Summary

Add one route, `/graph`, that renders the committed AI-topic tree as nodes and edges in
3D space, with colour encoding depth, labels that resolve as you approach, and orbit /
zoom / click-to-fly navigation. Desktop and tablet only; anything else gets a plain
message.

The data is a static seed module in the repository. There is no backend, no database, no
in-app editing, no API route, no server action and no new environment variable. Adding a
topic is a file edit and a PR.

This is the first product surface in an app that until now shipped only a baseline
(`intent/nextjs-project-baseline`). Everything the reference app does beyond the graph
itself — status, assignees, popups, per-topic pages, the sidebar, filtering — is out of
scope by explicit instruction of the intent and must not be designed or stubbed here.

---

## 2. Scope

### 2.1 In scope

| #    | Deliverable                                                                          |
| ---- | ------------------------------------------------------------------------------------ |
| S-1  | `/graph` route: server-rendered shell + client-mounted WebGL scene                    |
| S-2  | Static seed tree as a typed module, with build-time validation of its invariants      |
| S-3  | Deterministic 3D tree layout as a pure, unit-tested function                          |
| S-4  | Node and edge rendering, one draw call each, instanced                                |
| S-5  | Depth→colour encoding driven by new role tokens in `globals.css`, both themes          |
| S-6  | Distance-faded DOM label layer with a hard cap on concurrent labels                   |
| S-7  | Orbit / zoom / click-to-fly camera, with `prefers-reduced-motion` honoured in JS      |
| S-8  | Capability + viewport gate, and the plain message for phone / no-WebGL / context loss |
| S-9  | Route chrome: `h1`, theme toggle, back link, `loading.tsx`, `error.tsx`, metadata     |
| S-10 | Two new dependencies, pinned exactly, with their supply-chain rationale recorded     |
| S-11 | `CLAUDE.md` amendment: where the seed lives, the depth cap, the token additions       |

### 2.2 Explicitly out of scope

Restated from the intent so that anything below becomes a **new intent**, not Stage 3
scope creep:

- Node status (Done / In Progress / Todo), and any field that would carry it.
- Assignees, contributors, tallies.
- The node popup, the "Open page" link, per-topic explanation pages.
- The right-hand sidebar — statistics, **legend**, contributor tallies (see §14, C-2).
- Status filtering, search, any filter control.
- Any 2D or text fallback view of the graph (§7.9).
- Editing the graph in the app; any persistence, API route, server action or database.
- Accessibility of the scene itself — keyboard reachability and screen-reader semantics
  (accepted as debt by the intent; see §9.4 and §14, **C-1**).
- Deployment or hosting of the page (see §14, **C-9**).

### 2.3 Deferred with a named seam

Not built, but the design is shaped so they land cleanly:

- **Per-node interaction (popup).** Single click is spent on camera focus. The picking
  code returns a node id to one handler; a second gesture attaches there (§7.7, C-10).
  *Amended at Stage 3:* the replacement gesture is now **decided** — double-click on a
  desktop, long-press on a tablet — and recorded in `CLAUDE.md`. Decided, not built.
- **Depth legend.** The depth→token mapping is a pure exported function
  (`lib/graph/palette.ts`), so a legend reads the same source the scene does.
- **Extra node fields.** The seed schema is `.strict()` — adding `status` later is one
  schema line and one seed edit, and until then a stray field fails the build (§7.3).

---

## 3. How this sits in the existing app

Nothing existing moves or changes behaviour. The change is additive except for three
files, each amended in a way the baseline spec already anticipated:

| File                     | Change                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| `src/app/globals.css`    | **Additive** — new `--graph-*` role tokens in the three existing scopes    |
| `src/app/page.tsx`       | **Additive** — one link to `/graph` (§7.10, D-8)                           |
| `CLAUDE.md`              | **Additive** — a `## Graph data` section                                   |
| `package.json` / lock    | One dependency + one dev dependency (§7.2)                                |

The baseline's rules are followed as written, not reinterpreted:

- `lib/` stays framework-agnostic. `src/lib/graph/**` imports nothing from `app/` or
  `components/`, and imports nothing from `three` — it produces plain numbers. That rule
  is what keeps D-1 a contained decision: the ids, the geometry and the invariants are all
  settled outside any rendering library, so changing the renderer changes no `lib/` file.
- `components/ui/**` is untouched. No new shadcn component is generated; the existing
  `Card` is reused for the unsupported-device notice.
- Everything used only by `/graph` lives in `src/app/graph/_components/`, per the
  one-route rule. Nothing is promoted to `components/common/`.
- `process.env` appears nowhere new. `src/lib/env.ts` is unchanged, and
  `ANTHROPIC_API_KEY` stays out of it.
- The state-management table is obeyed: the graph is **server data for initial render**,
  so it is computed in a Server Component and passed as a prop. **No React Query, no
  Zustand, no new store** (§7.6).

---

## 4. Decisions that close the intent's open questions

The intent left two questions genuinely open and marked the rest answered. The table
below records the answered ones as binding, closes the design questions the intent did
not know it was asking, and hands the two content questions back.

| #        | Question                                                    | Decision                                                                                                                                                                                                                                                                                             |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-1**  | Which 3D library?                                           | **`three` alone — no `@react-three/fiber`, no `@react-three/drei`.** *Amended at Stage 3.* The original answer was `three` + `@react-three/fiber`; planning found that **no published `@react-three/fiber` release accepts React 19.3.0**, which this repo pins. Every one of them — 9.7.0, the 10.x alphas and the canaries — caps at `react <19.3`, because r3f binds to React's reconciler internals. That is an `npm ci` ERESOLVE failure *and* a runtime-compat risk, not a warning to silence. Rationale and rejected alternatives in §7.2. |
| **D-2**  | Force-directed layout, or computed?                         | **Computed, deterministic, no physics.** A pure function of the seed. The same commit always produces the same picture, the layout is unit-testable, and there is no simulation cost on a tablet. A force layout on a strict tree buys organic spacing at the price of a non-reviewable, non-testable scene. |
| **D-3**  | Where does the seed live, and in what format?               | **`src/lib/graph/seed.ts`** — a TypeScript module with `satisfies GraphSeed`, so a bad edit is a red squiggle before it is a failed build. Validated again by zod at build time for the invariants types cannot express (§7.3).                                                                          |
| **D-4**  | How is depth coloured?                                      | **A five-step single-hue ordinal ramp on the brand blue**, declared as `--graph-depth-0…4` role tokens and read from CSS by the scene, so `globals.css` stays the single source of truth for colour (§7.4). *Amended at Stage 3:* the ramp is generated and **validated in both modes**; the shipped hexes are in §7.4 and C-4 is closed. |
| **D-5**  | How deep can the tree go?                                   | **Five levels, hard-capped and enforced.** One palette step per level; a sixth level fails the build with a message naming the offending node. ⚠ This is the one place the design constrains content the intent expected to be unconstrained — see §14, **C-3**.                                        |
| **D-6**  | How are labels drawn?                                       | **A DOM overlay, not in-scene text.** Uses the Poppins already loaded by `next/font`, needs no font atlas in `public/`, costs no new CSP directive, and leaves real text in the DOM as the future accessibility seam (§7.8).                                                                             |
| **D-7**  | What does a click on empty space do?                        | **Returns to the overview framing; `Escape` does the same.** ⚠ Spec-added: the intent does not mention it. Without it, a viewer who flies into a leaf four levels deep has no way back except reloading. Cheap to cut if the PO disagrees.                                                              |
| **D-8**  | Is `/graph` linked from anywhere?                           | **One link on the home page.** ⚠ Spec-added, and in tension with *"the home page is left free"* — one link is not a landing page, and an unlinked route is one nobody finds. Cut it and the route is reachable by URL only.                                                                             |
| **D-9**  | Light or dark scene?                                        | **Both. The scene follows the app theme**, reading its colours from the same tokens as the rest of the app and re-reading them when the theme changes (§7.5). Dark values are derived the way `globals.css` already derives them — not invented.                                                        |
| **D-10** | What should `n Node` be called?                             | **Still open. Handed back to the originator.** It ships on screen as `n Node` otherwise, on a branch holding a third of the tree. See §14, **C-8**.                                                                                                                                                    |
| **D-11** | Real titles for the four verbatim note-style labels?        | **Still open. Handed back to the originator.** Same consequence, same concern.                                                                                                                                                                                                                        |

---

## 5. Functional requirements

Each is independently verifiable; verification is §12.

**FR-1 — The tree renders in 3D.** Nodes are spheres positioned in three dimensions,
edges are straight segments between parent and child, rendered in a WebGL canvas with a
perspective camera. Not an isometric or projected 2D layout.

**FR-2 — The seed is the only content source.** One root (`AI`), the day-one tree from
the intent's Constraints section transcribed exactly — including the four verbatim labels
and both `n Node` placeholders, unedited, until D-10/D-11 are answered.

**FR-3 — The structure is a tree by construction.** The seed is nested; a node is a
child *by being nested inside its parent*. A cross-branch edge, a cycle or a second
parent is not expressible in the format, so it cannot be introduced by a bad edit. This
is stronger than validating for it.

**FR-4 — Every node carries a readable title**, at all times, in the data. Whether it is
*drawn* depends on distance (FR-7); whether it *exists* never does.

**FR-5 — Depth is encoded by colour.** Level 0 (root) through level 4, one ramp step
each, taken from the tokens in §7.4. Colour is never the only channel: node radius
decreases with depth as well (§9.2, and §14, **C-2**).

**FR-6 — Navigation is orbit, zoom, click-to-fly.** Drag (one finger on a tablet)
orbits; scroll or pinch zooms; a click or tap on a node flies the camera to frame that
node and its children and makes it the new orbit centre. Panning is disabled — it is not
in the intent and it is the fastest way to lose the graph off-screen.

**FR-7 — Labels fade with distance and never pile up.** A label is fully opaque within a
near threshold, fades to nothing by a far threshold, and at most 24 labels are drawn at
once, nearest first, with shallower depth winning ties. The root's label and the focused
node's label are always drawn.

**FR-8 — The page states its limits plainly.** On a viewport narrower than the tablet
threshold, on a device with no usable WebGL context, or after an unrecoverable WebGL
context loss, the page renders a short message instead of the scene. No partial scene, no
spinner that never resolves, no console error as the only signal.

**FR-9 — The scene respects `prefers-reduced-motion`.** The camera tween becomes an
instant cut and no idle motion runs. The `globals.css` reduced-motion guard does **not**
reach `requestAnimationFrame`-driven three.js animation, so this is handled in JS (§9.3).

**FR-10 — The route is statically prerendered.** `/graph` uses no dynamic API; the seed
is read and the layout computed at build time, and the client receives positions, not an
algorithm.

---

## 6. Non-functional requirements

| ID     | Requirement                                                                                     | Verification |
| ------ | ----------------------------------------------------------------------------------------------- | ------------ |
| NFR-1  | 60 fps sustained while orbiting on a current desktop; ≥ 30 fps on a current tablet, at 150 nodes | V-12         |
| NFR-2  | Nodes render in one draw call; edges in one; ≤ 24 label elements exist in the DOM                | V-8, V-14    |
| NFR-3  | `three` appears only in the `/graph` route chunk — the home page's JS does not grow              | V-9          |
| NFR-4  | `/graph` client chunk ≤ 400 KB gzip; measured and recorded in `plan.md`                          | V-9          |
| NFR-5  | The depth ramp passes the `dataviz` ordinal checks in **both** modes against **this app's** surfaces | V-6      |
| NFR-6  | Both themes are authored and visually checked; neither is an automatic flip of the other         | V-15         |
| NFR-7  | No new CSP violation is reported on `/graph` under the existing Report-Only policy               | V-13         |
| NFR-8  | No new environment variable, server action, API route or middleware                              | V-7, V-16    |
| NFR-9  | A malformed seed fails `npm run build` with a message naming the node                            | V-3, V-5     |
| NFR-10 | The page chrome (header, links, toggle) meets WCAG 2.2 AA. **The scene does not** — see C-1      | V-17         |

---

## 7. Design

### 7.1 File layout

```
src/app/graph/
├── page.tsx                    Server Component — reads seed, computes layout, metadata, chrome
├── loading.tsx                 skeleton with aria-busy (the scene chunk is large)
├── error.tsx                   'use client' route boundary — generic message + digest, no raw error
└── _components/
    ├── graph-view.tsx          'use client' — capability/viewport gate, dynamic import of the scene
    ├── graph-scene.tsx         'use client' — the whole imperative three.js scene in one effect
    ├── graph-labels.tsx        DOM overlay label layer
    ├── depth-key.tsx           the inline depth legend (C-2)
    └── unsupported-notice.tsx  the plain message (FR-8), one component, two copy variants

src/lib/graph/                  framework-agnostic; imports nothing from three, app/ or components/
├── seed.ts                     THE CONTENT. Nested {name, children?}. Edited by PR.
├── types.ts                    GraphSeed, GraphNode, GraphEdge, GraphScene
├── schema.ts                   zod, recursive, .strict()
├── tree.ts                     validate + flatten to nodes/edges with ids and depth
├── layout.ts                   pure 3D layout — the only place geometry is decided
└── palette.ts                  depth → token name, with the cap rule

src/hooks/
├── use-theme-tokens.ts         reads CSS custom properties; re-reads on theme change
├── use-webgl-support.ts        one probe, memoised
└── use-viewport-supported.ts   matchMedia wrapper, mount-safe
```

### 7.2 Dependencies

*Amended at Stage 3 — this section originally added three packages.*

| Package         | Type | Version    | Why                                                        |
| --------------- | ---- | ---------- | ---------------------------------------------------------- |
| `three`         | dep  | `0.186.0`  | The renderer. There is no lighter way to satisfy "must be 3D". |
| `@types/three`  | dev  | `0.186.0`  | `three` ships no types.                                    |

Both pinned exactly, per the baseline's NFR-2. Neither has a React peer dependency, so
neither constrains a future React upgrade, and no `transpilePackages` entry is needed —
`three` ships ESM.

**`@react-three/fiber` is deliberately not used** (D-1). It was the original choice, for
one reason: it keeps the scene declarative and in the same idiom as the rest of the app.
That reason is real but it is idiom, not capability — and it is unavailable at any
version:

| `@react-three/fiber` | `react` peer range | this repo pins |
| -------------------- | ------------------ | -------------- |
| `9.7.0` (latest)     | `>=19 <19.3`       | **`19.3.0`**   |
| `10.0.0-alpha.5`     | `>=19.0 <19.3`     | `19.3.0`       |
| `canary`             | `>=19.0 <19.3`     | `19.3.0`       |

The upper bound is deliberate on r3f's part — it binds to React reconciler internals, the
way `react-reconciler` requires an exact React pairing — so the two ways past it are both
bad trades. Forcing it with `overrides` or `legacy-peer-deps` overrides a constraint the
maintainers set for a reason, and the failure mode is a silent rendering bug rather than a
build error. Pinning React down to `19.2.8` would downgrade React across the whole app for
one route's convenience, against a baseline intent that declared the stack fixed, and
would gate every future React bump on r3f's ceiling.

Vanilla `three` costs roughly 150 lines of imperative setup in a single effect, and that
is affordable *here* specifically because the scene is static: 36 nodes, one
`InstancedMesh`, one `LineSegments`, render-on-invalidate, no animation loop at rest. It
also removes a whole class of future breakage, since `three` never has an opinion about
React. What it does **not** remove is resource disposal, which r3f would have handled —
that is now this design's own obligation, recorded as R-12 with V-19 to prove it.

**`@react-three/drei` is not used either.** It would have been added for two things:

- `OrbitControls` — available directly as `three/examples/jsm/controls/OrbitControls.js`,
  which ships inside `three` itself.
- `<Text>` — backed by `troika-three-text`, which builds its typesetting worker from a
  `blob:` URL. Under the enforced CSP this repo is heading toward (`default-src 'self'`,
  no `worker-src`), that is a blocked worker, and it would also have meant shipping a
  second copy of Poppins as a `.woff` in `public/`. D-6 removes the need entirely.

### 7.3 The seed and its validation

```ts
// src/lib/graph/seed.ts  — the only file a content change touches
export const seed = {
  name: "AI",
  children: [
    { name: "AI Agents", children: [ /* … */ ] },
    // …
  ],
} satisfies GraphSeed;
```

`GraphSeed` is `{ name: string; children?: GraphSeed[] }` and nothing else. The nesting
*is* the parent relationship (FR-3).

`schema.ts` re-validates with zod at module load in `tree.ts`, which runs at build time
in the Server Component. It enforces what the type cannot:

| Rule                                         | Why                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `.strict()` — no unknown keys                | Mechanically enforces the intent's "names and children only" constraint     |
| `name` non-empty, trimmed, ≤ 60 characters   | A label longer than that cannot be drawn readably at any distance           |
| Sibling names unique                         | Ids are slugs of the name path; duplicate siblings would collide            |
| Depth ≤ 4 (five levels)                      | One palette step per level (D-5, C-3)                                       |
| Total nodes ≤ 150                            | The performance envelope in NFR-1 was designed for the intent's "under 100" |

Each failure throws with the offending node's id path in the message, so a bad PR fails
`npm run build` and says where.

**Ids** are the slugified name path — `ai/ai-agents/workflows/n8n`. Derived, stable
across reorderings of siblings, and usable directly as React keys and as the focused-node
identifier.

The day-one tree is 36 nodes over 5 levels, which is the cap exactly (§14, C-3).

### 7.4 Colour: the depth ramp

Depth is an **ordinal** encoding — ordered, discrete levels — so the `dataviz` rule that
applies is *sequential/ordinal: one hue, light→dark*, not the categorical palette. A
multi-hue scheme (the whiteboard's blue/red/gold) is explicitly rejected here: the intent
itself says the whiteboard colours are *the scheme, not the hues to ship*, and a
rainbow across an ordered variable is the anti-pattern the skill names directly.

**Direction: contrast with the surface decreases with depth.** The root is the
highest-contrast mark on screen and leaves recede — which is also what "which areas are
thin" wants you to see. On light this means dark→light; on dark, light→dark. The dark
column is **selected for the dark surface**, not flipped.

New role tokens, added to all three existing scopes in `globals.css` (`:root`, the
`prefers-color-scheme: dark` media block, and `:root[data-theme="dark"]`), following the
`--accent-secondary` precedent: **not** bridged into `@theme inline`, because they are not
shadcn slots.

```css
--graph-depth-0 … --graph-depth-4   /* the ramp, root → leaf */
--graph-edge                        /* recessive chrome; its own opaque value per scope */
--graph-label-halo                  /* = --page; the 2px surface ring behind label text */
```

⚠ *Amended at Stage 3 —* `--graph-edge` **cannot alias `--gridline`.** In dark mode
`--gridline` is `rgb(255 255 255 / 0.08)` (`globals.css:56`, `:68`) and `THREE.Color`
cannot parse a functional `rgb()` with an alpha channel. `--graph-edge` therefore carries
its own opaque hex per scope — `#e5e7eb` light, `#2a2f35` dark — each chosen to match the
rendered appearance of the aliased value composited over `--page`. `--graph-label-halo`
aliases `--page`, which is already an opaque hex, so that one stands as written.

**The ramp values — validated, and final.** *Amended at Stage 3; this replaces the two
candidates the spec originally offered.* Ramp B was generated as described and passes; Ramp
A is not needed and is dropped.

Ramp B is the brand blue `#027ac2` (`--focus-ring`) with its OKLCH hue held constant at
`h ≈ 245.6°`, `#027ac2` itself as the level-2 step, chroma ≥ 0.098 at every step, and
adjacent-step ΔL ≥ 0.06:

| Depth | Light (`--page` `#ffffff`) | Dark (`--page` `#0a0c0e`) |
| ----- | -------------------------- | ------------------------- |
| 0 root| `#014976`                  | `#50affb`                 |
| 1     | `#00619c`                  | `#3799e3`                 |
| 2     | `#027ac2`                  | `#1983cc`                 |
| 3     | `#3194de`                  | `#036eaf`                 |
| 4 leaf| `#50affb`                  | `#025a90`                 |

Contrast with the surface decreases with depth in both modes, so the root is the
highest-contrast mark on screen and leaves recede.

**The dark column is selected for the dark surface, not flipped** (NFR-6). A literal
mirror of the light column also passes, but only at 2.07:1 against the 2.0 light-end floor;
the column above is re-stepped and lifted to 2.68:1, which is the margin worth having.

**Validation was a blocking gate and has now been run**, in both modes, against this app's
own surfaces rather than the validator's defaults:

```
node <dataviz-skill>/scripts/validate_palette.js \
  "#014976,#00619c,#027ac2,#3194de,#50affb" --ordinal --mode light --surface "#ffffff"
  → [PASS] Lightness monotone / Adjacent ΔL / Light-end contrast (#50affb 2.37:1) / Single hue (1°)
  → ALL CHECKS PASS, exit 0

node <dataviz-skill>/scripts/validate_palette.js \
  "#50affb,#3799e3,#1983cc,#036eaf,#025a90" --ordinal --mode dark --surface "#0a0c0e"
  → [PASS] Lightness monotone / Adjacent ΔL / Light-end contrast (#025a90 2.68:1) / Single hue (1°)
  → ALL CHECKS PASS, exit 0
```

C-4 and R-6 are closed. The full reports are in `plan.md`; re-run both if any value here
is ever edited.

**Not used in the scene:** `--accent-secondary` (brand orange). The `design-system` skill
reserves it for secondary emphasis and forbids combining both accents; a sixth hue on
screen would also read as a sixth depth level. The focused node is marked with a 2px
`--graph-label-halo` (surface-colour) ring and a size bump instead — which is the mark
spec `dataviz` documents for overlapping marks anyway.

**Materials must not destroy the validated colours.** Node spheres use an **unlit**
material (`MeshBasicMaterial`) so the pixel colour is the token colour. Lit materials
would shade every node away from the value that was validated and make the check
meaningless. Form comes from size, occlusion and motion parallax, not from shading. Scene
fog is set to `--page` so distant nodes recede into the surface, consistent with the label
fade.

### 7.5 Reading tokens into the scene

three.js cannot read CSS custom properties. Rather than duplicating hexes into TypeScript
— which is exactly the "hardcoded colour bypassing the token bridge" the `design-system`
skill says to flag at review — `use-theme-tokens.ts` reads them once on mount via
`getComputedStyle(document.documentElement)` and converts to `THREE.Color`.

It must re-read on **both** ways the theme can change:

- a `MutationObserver` on `<html>`'s `data-theme` attribute (the toggle), and
- a `matchMedia("(prefers-color-scheme: dark)")` change listener (the OS).

It deliberately does **not** subscribe to `useUiStore`. That store initialises `theme` to
`"light"` unconditionally and is never hydrated from `localStorage` or the OS, so it does
not describe the DOM — see §14, **C-12**. The DOM is the truth; read the DOM.

### 7.6 Rendering pipeline and the client boundary

*Amended at Stage 3 — the pipeline is unchanged in shape, but the scene is now plain
three.js rather than a `<Canvas>` reconciler tree.*

```
graph/page.tsx            Server Component. import { seed } → validate → flatten → layout
   │                      → GraphScene (plain arrays of numbers and strings)
   ▼  props
graph-view.tsx            'use client'. Gate only: viewport + WebGL. No three import at
   │                      module scope — the scene is a next/dynamic import with ssr:false.
   ▼
graph-scene.tsx           'use client'. One effect owns a WebGLRenderer, a
                          PerspectiveCamera, OrbitControls, an InstancedMesh of nodes, a
                          LineSegments of edges, a Raycaster for picking — and disposes
                          every one of them on cleanup.
```

Four points the `nextjs-code-review` checklist is specifically about:

1. **`ssr: false` cannot be used from a Server Component** in the App Router. The dynamic
   import therefore lives in `graph-view.tsx`, which is already a Client Component for the
   gate. `page.tsx` stays a Server Component and never imports `three`.
2. **The client boundary is drawn at the gate, not at the page.** `page.tsx`, the header,
   the `h1`, the depth key and the back link all stay server-rendered; only the scene
   subtree is client.
3. **No data fetching of any kind.** The seed is an import, the layout is synchronous, the
   route is static (FR-10). There is no `fetch`, so there is no cache or revalidation
   decision to make, and per the `CLAUDE.md` state table this is server data for initial
   render — **not** React Query, and **not** Zustand. The focused node id is one
   component's own state: `useState` in `graph-scene.tsx`.
4. **React never owns the scene graph.** The effect creates the three.js objects once and
   mutates them imperatively; React owns the `<canvas>` element, the focused-node id and
   nothing else. Node positions, label positions and label opacity are written to refs,
   never through state — sixty state updates a second would re-render the tree
   continuously.

**Render on demand, not on a loop.** The scene is static, so a frame is rendered only when
something invalidates it: an orbit change, a camera tween step, a theme change, a hover.
At rest nothing is scheduled, which is the difference between a warm tablet and a cool
one. With vanilla `three` this is an explicit `invalidate()` helper that schedules one
`requestAnimationFrame` if none is pending — r3f's `frameloop="demand"` no longer provides
it, so every animation source must call it.

**Cleanup is now this design's obligation, not the library's.** The effect's teardown
must `dispose()` every geometry and material, call `renderer.dispose()` and
`forceContextLoss()`, cancel any pending frame, and remove the resize, pointer,
`webglcontextlost`, `MutationObserver` and `matchMedia` listeners. Getting this wrong
degrades the whole app after a few navigations, and it degrades silently — the browser
simply runs out of WebGL contexts. See R-12 and V-19.

### 7.7 Layout algorithm (`lib/graph/layout.ts`)

Pure: `layout(nodes) → Map<id, [x, y, z]>`. No randomness, no time, no `Math.random()`.

1. **Shells by depth.** Radius from origin is a function of depth alone —
   `R(d) = d × SHELL_GAP`, root at the origin. Four shells; constants tuned at Stage 3,
   invariants fixed here.
2. **Solid-angle allocation.** Each node receives a cone of directions around its own
   outward vector. A node's cone is subdivided among its children **in proportion to each
   child's leaf count**, so a heavy branch gets room and a leaf gets a sliver. This is what
   keeps clusters from overlapping — the failure the intent is moving away from.
3. **Within a cone**, children are placed on a golden-angle (Fibonacci) spiral, which
   spreads *n* directions evenly without `n`-specific special cases.
4. **The root's children** use the whole sphere rather than a cone, which is what produces
   the "hub with clusters radiating out" shape the intent asked for.

Unit-tested invariants (V-4): determinism across runs; every node's distance from the
origin matches its depth shell; no two node centres closer than 2.5× the larger node's
radius; children are always further from the origin than their parent.

**Node radius by depth:** monotonically decreasing (root largest). This is the secondary
encoding that keeps depth from being carried by colour alone (§9.2).

### 7.8 Labels (`graph-labels.tsx`)

A single absolutely-positioned overlay `div` over the canvas, `pointer-events: none` so
it never swallows an orbit drag.

- A **fixed pool of 24 label elements**. Never more; never a DOM node per graph node.
- On each rendered frame (throttled to ~30 Hz), project every node with `camera.project`,
  sort by camera distance, take the nearest 24 (ties broken by shallower depth), and
  assign them to the pool.
- Positions and opacity are written **imperatively to refs**, not through React state —
  60 state updates a second would re-render the tree continuously.
- Opacity ramps from 1 at the near threshold to 0 at the far threshold; a label at 0 is
  `visibility: hidden` so it is not read or hit-tested.
- The root's label and the focused node's label are pinned into the pool first (FR-7).
- Typography: Poppins 500, 13px, `--text-primary`, normal tracking (the `design-system`
  tracking rule applies above ~24px only), with a 2px `--graph-label-halo` ring via
  `text-shadow` so text stays legible where it crosses a node.

**Occlusion** (a label for a node behind the hub) is handled by distance and the 24-label
cap in the first pass. If it reads badly in review, add a raycast test for the pooled
labels only — 24 rays at 30 Hz against ~36 spheres is affordable. Specified as a
contingency, not built speculatively.

### 7.9 Capability and viewport gate (`graph-view.tsx`)

Three conditions, one message component, two copy variants:

| Condition               | Detection                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Viewport too small      | `matchMedia("(min-width: 768px)")` — **not** user-agent sniffing, which lies and rots      |
| No usable WebGL         | One-shot probe: `canvas.getContext("webgl2") \|\| canvas.getContext("webgl")`, then discard |
| Context lost at runtime | `webglcontextlost` listener on the canvas + an error boundary around the scene             |

The gate runs after mount (`useMounted`, already in the repo), because none of the three
is knowable during server rendering. Before mount the page renders the skeleton, so there
is no hydration mismatch and no flash of the wrong state.

There is **no 2D or text fallback** — deliberately, per the intent: a second view is a
second thing to keep in sync. The consequence is a dead end for phone users, recorded as
§14, **C-11**.

Copy (plain, no jargon, matching the app's existing voice):

- Too small: *"This view needs a bigger screen. The graph is built for a desktop or a
  tablet — open it there and you'll be able to move around it."*
- No WebGL: *"This browser can't draw the graph. It needs WebGL, which this browser or
  machine doesn't have available. A recent Chrome, Firefox, Safari or Edge on a desktop
  or tablet will work."*

### 7.10 Route chrome

A slim header — `h1` ("AI knowledge graph"), a back link to `/`, and the existing
`ThemeToggle` — above a canvas that fills the rest of the viewport. Hairline
`--border` beneath the header, no shadow, `--page` background.

- One `h1` per page; 30px, weight 600, tracking `-0.02em`, line-height 1.15 (the
  `design-system` scale: tracking applies above ~24px).
- `touch-action: none` on the **canvas only**, so pinch-zoom drives the camera on a tablet
  without also scrolling the document, while the header stays normal.
- `metadata` exported from `page.tsx`: title *"AI knowledge graph"*, a one-line
  description. No dynamic segment, so no `generateMetadata`.
- `loading.tsx` uses the existing `Skeleton` with `aria-busy` and an `aria-live="polite"`
  status line — the scene chunk is the largest download in the app.
- `error.tsx` renders a generic message plus `error.digest` and **never** `error.message`
  in production, per the baseline's §8.6.
- The home-page link (D-8) is a single sentence with a link, inside the existing card.

---

## 8. Security design

> **Applied policy source: the vendored `security-review` skill** (OWASP-derived,
> `.agents/skills/security-review`) **plus the baseline spec's §8.** Neither is
> ProductDock policy — no reviewed security policy exists in this repository. See §14,
> **C-7**, which carries forward the baseline's C-1.

### 8.1 What this change adds to the attack surface

Almost nothing, and that is the main security property worth stating: **no server action,
no API route, no middleware, no environment variable, no network request at runtime, no
user input, no persistence, no authentication surface.** The route is a static page plus a
JavaScript bundle that draws numbers baked in at build time.

| Asset            | Threat                                    | Control                                                            |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Seed content     | Script injection via a node title         | §8.2                                                               |
| Build pipeline   | Malicious or compromised new dependency   | §8.3                                                               |
| The rendered page| CSP regression from the new renderer      | §8.4                                                               |
| Error output     | Stack traces leaked to the viewer         | `error.tsx` per baseline §8.6                                      |
| Secrets          | `ANTHROPIC_API_KEY` drifting into the app | Unchanged: `src/lib/env.ts` is not touched (V-7)                   |
| Visitor privacy  | WebGL fingerprinting surface              | §8.5                                                               |

### 8.2 Seed content is data, never markup

Node titles come from a committed file reviewed in a PR, so they are not
attacker-controlled in the ordinary sense — but the rule is structural, not a matter of
trust:

- Labels are rendered as React text children and as `textContent` on the pooled label
  elements. **`dangerouslySetInnerHTML` and `innerHTML` are forbidden in this feature**,
  with no exception for "it's our own content".
- Node ids are slugified (`[a-z0-9-/]` only) before being used as keys or in any selector.
- The zod schema bounds length and rejects unknown keys, so a seed edit cannot smuggle in
  a field that some later component renders unescaped.

There is no filesystem read, no path parameter and no dynamic route, so the baseline's
§8.7 traversal concern does not arise here.

### 8.3 Supply chain

*Amended at Stage 3: two new packages, not three.* One of them is large. Per the skill's
supply-chain guidance and the baseline's NFR-2:

- **Exact pins, no ranges.** `npm ci` in CI, lockfile committed.
- **Verify the package names character by character before installing** — `three`, not
  `three.js`; `@types/three`, not `@types/threejs`. Typosquats on popular 3D packages are
  a known pattern.
- **Review the added transitive tree in the lockfile diff** as part of the PR. Dropping
  both `@react-three/fiber` and drei (D-1) is partly a security decision: between them
  they account for roughly twenty small transitive packages that no longer need reviewing.
  `three` itself has no runtime dependencies.
- `npm audit --audit-level=high` already runs in `verify.yml` (non-blocking); the result
  for the new tree is recorded in the PR.
- `three` ships frequent majors with breaking changes. It falls under the baseline's D-7
  rule: majors open a PR a human reads, never auto-merge.

### 8.4 Content Security Policy

The existing policy is `Report-Only` (`default-src 'self'`, `script-src 'self'
'unsafe-inline'`, `img-src 'self' data:`, `font-src 'self'`, `frame-ancestors 'none'`).

**This design needs no change to it.** WebGL itself is not a CSP-governed capability, and
the three things that would have forced a change are all avoided by design:

- no `blob:` worker (drei/troika dropped — D-1, §7.2),
- no external font fetch (labels are DOM text in the already-self-hosted Poppins — D-6),
- no `new Function`/`eval` in the runtime path.

This is worth stating because it is a *result of design choices*, not luck: had the spec
reached for drei's `<Text>`, enforcing the CSP later would have required `worker-src
'self' blob:` and possibly `script-src 'unsafe-eval'`. V-13 verifies the claim in a
browser; if a violation appears, the fix is to remove the cause, not to widen the policy.

Note the standing limitation, unchanged by this work: the policy is Report-Only with no
collector, so V-13 is an observation in a dev console, not an enforced control (C-7).

### 8.5 Privacy

The graph holds topic names only — no assignees, no contributors, no personal data
(the intent removed them from scope, which is also what keeps the baseline's C-10 from
applying here). `/graph` renders nothing from `intent/**` or `docs/`.

One new item, small and worth one line: WebGL exposes GPU and driver strings to any script
on the page and slightly widens the browser-fingerprinting surface for visitors. The app
collects, stores and transmits none of it — there is no analytics and no network call —
but the capability is now reachable on this route where it was not before.

---

## 9. UX and visual standards

> **Applied policy source: the `design-system` skill** (ProductDock brand, extracted from
> productdock.com 2026-09-10) **and the `dataviz` skill.** The `design-system` skill is an
> extraction from a marketing site, not a reviewed brand policy — `CLAUDE.md` says so
> itself — and it covers no 3D or data-visualisation case at all. See §14, **C-5**.

### 9.1 Brand mapping for every new surface

| Surface                     | Token / rule                                                                     |
| --------------------------- | -------------------------------------------------------------------------------- |
| Page and scene background   | `--page`; scene fog matches it exactly                                           |
| Header rule                 | 1px `--border` hairline. No shadow — one low-confidence sample is not a scale     |
| `h1`                        | Poppins 600, 30px, tracking `-0.02em`, line-height 1.15                          |
| Body copy, notice text      | Poppins 400, 16px, line-height 1.5, `--text-primary` / `--text-secondary`         |
| Labels in the scene         | Poppins 500, 13px, normal tracking, `--text-primary`                             |
| Links (back link, home link)| Blue accent by default; hover collapses to ink + underline — the one shared rule  |
| Unsupported notice          | Existing `Card` → `rounded-xl` (10px). No third radius is introduced             |
| Any button                  | Pill (`rounded-lg` → `9999px`). None is added by this change                      |
| Accent                      | Blue only. `--accent-secondary` is not used on this route (§7.4)                 |
| Focus                       | The existing `:focus-visible` ring on every interactive element. No `outline: none`|

Dark mode is derived exactly as `globals.css` already derives it — neutrals invert, brand
hue holds — and the ramp's dark column is selected against `#0a0c0e`, not flipped (D-9,
NFR-6).

### 9.2 Data-visualisation rules applied

- **Ordinal encoding → one hue, ordered steps.** Not the categorical palette, not a
  rainbow (§7.4).
- **Never colour alone.** Depth is carried by colour *and* node radius *and* position in
  the tree (shell distance from the hub). This matters for the ~8% of male viewers with a
  colour-vision deficiency, for whom five steps of one hue are five steps of one grey.
  ⚠ The complete answer is a legend, and the legend lives in the sidebar the intent put
  out of scope — see §14, **C-2**.
- **Status colours are reserved** and unused here. Nothing in this feature has a status
  (that is a deferred feature), so `--status-*` must not appear in the scene.
- **Text wears text tokens**, never a ramp colour: labels are `--text-primary` regardless
  of the node's depth.
- **Recessive chrome.** Edges use `--graph-edge` (`--gridline`), the thinnest line the
  renderer gives.
- **Run the validator; do not eyeball it** (§7.4, V-6).

### 9.3 Motion

- Camera fly-to: 600 ms, cubic ease-out, camera **and** orbit target tweened together.
- Hover on a node: 120 ms radius bump.
- No idle auto-rotation, ever — it fights the viewer for control of the camera and it
  keeps a tablet GPU busy on a page nobody is touching.
- **`prefers-reduced-motion: reduce` is honoured in JavaScript** via `matchMedia`, read at
  the start of each tween: the camera cuts instantly to the framed position and the hover
  bump is applied without interpolation. The `globals.css` guard only zeroes CSS
  animations and transitions; it has no effect on a three.js tween, so a JS check is the
  only thing that makes this true (FR-9, V-11).

### 9.4 Accessibility — what ships, and what does not

**The page chrome meets WCAG 2.2 AA.** `<html lang>` is set by the root layout; one `h1`;
the skip link already works; the back link, home link and theme toggle are keyboard
reachable with a visible focus ring and ≥ 24×24px targets; the notice is real text, not an
image; the loading skeleton announces politely; contrast is unchanged from the baseline.

**The scene does not, and the intent accepts that.** Concretely, what is being knowingly
shipped:

- **WCAG 2.1.1 (Keyboard)** — nodes cannot be reached, focused or activated by keyboard.
- **WCAG 4.1.2 (Name, Role, Value)** — the canvas is one opaque element to a screen
  reader; no node has a name or a role.
- **WCAG 1.4.11 (Non-text Contrast)** — the deepest ramp steps sit close to the surface by
  design (that is what "recede" means), so the outermost nodes will not clear 3:1 against
  the background.

This is recorded debt with a named consequence, not an oversight — see §14, **C-1**. Two
things in this design deliberately keep the door open: labels are real DOM text (D-6), and
picking already resolves to a node id in one handler (§2.3), which is what a roving-tabindex
implementation would need.

---

## 10. What "done" means

Someone on the team, on a desktop or tablet, opens `/graph` and — without being told
anything — can see the hub, see which branches are dense and which are thin, orbit the
whole thing, and fly into a branch to read its titles. A colleague adds a topic by editing
one file in a PR, and the picture changes on the next deploy. Nobody had to make a
structural decision to do either.

---

## 11. Risks

| ID   | Risk                                                                    | Likelihood | Impact   | Mitigation                                                                                          |
| ---- | ----------------------------------------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------------------------- |
| ~~R-1~~ | ~~`@react-three/fiber` major does not match React 19 / Next 16~~            | —          | —        | **Closed at Stage 3, and it fired.** No published r3f accepts React 19.3.0. Eliminated rather than mitigated: D-1 now specifies vanilla `three`, which has no React peer at all |
| R-2  | `three` majors break the scene silently                                 | Medium     | Medium   | Exact pins; majors open a PR a human reads (baseline D-7)                                            |
| R-3  | Tablet frame rate misses NFR-1                                          | Medium     | Medium   | render-on-invalidate, instancing, unlit materials, ≤ 24 labels. V-12 measures on real hardware        |
| R-4  | Labels overlap or flicker at branch boundaries                          | **Medium** | Medium   | Nearest-24 cap + depth tiebreak; raycast occlusion held in reserve (§7.8)                            |
| R-5  | The 5-level cap blocks a content edit                                   | Medium     | Medium   | Fails loudly at build with the node named; extending the ramp is a token edit + a validator run (C-3) |
| ~~R-6~~ | ~~The depth ramp fails the validator in one mode~~                          | —          | —        | **Closed at Stage 3.** Ramp B validated, both modes, exit 0 (§7.4)                                  |
| R-7  | Accessibility debt is never paid                                        | **High**   | **High** | C-1 asks for a follow-up intent to be opened at the same time as this one merges                     |
| R-8  | The bundle lands on the home page's shared chunk                        | Low        | Medium   | `next/dynamic` with `ssr:false` inside the client gate; V-9 asserts it                               |
| R-9  | Placeholder labels (`n Node`) ship and become permanent                 | **Medium** | Medium   | C-8; they are conspicuous by design, and the intent already flags them                               |
| R-10 | Click-to-fly locks in a gesture the deferred popup needs                | High       | Low      | Named in the intent; C-10 asks for the popup's gesture to be chosen now, not built now               |
| R-11 | The validated colour is the *pixel* colour only where fog has not mixed it — deep nodes recede into `--page` by design | Medium | Low | Intended, and the reason radius and shell distance also carry depth. Fog near/far tuned so the level-4 step stays distinguishable at overview framing; checked in V-15 |
| R-12 | **New at Stage 3.** The hand-rolled scene leaks GPU resources and listeners across route changes if it does not dispose cleanly | Medium | **Medium** | This is the specific cost of dropping r3f, which disposed for us. One effect, one cleanup: `dispose()` every geometry and material, `renderer.dispose()`, `forceContextLoss()`, cancel the pending frame, remove every listener and the `MutationObserver`. Proven by V-19 |

**Rollback.** Entirely additive apart from three small amendments (§3). Reverting the merge
commit removes the route, the tokens and the dependencies, and leaves the baseline exactly
as it was. No data, no migration, no deployed state.

---

## 12. Verification

| #    | Check                                  | How                                                                                                  | Pass                                          |
| ---- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| V-1  | Toolchain green                        | `npm ci && npm run lint && npm run typecheck && npm test && npm run build`                             | all exit 0                                    |
| V-2  | `/graph` is static                     | `npm run build` route table                                                                            | `/graph` marked static/prerendered             |
| V-3  | Seed schema rejects a stray field      | unit test: a seed with `status: "todo"` fails                                                          | throws, message names the node                 |
| V-4  | Layout invariants                      | unit test: determinism, shell radius by depth, min separation, child further than parent               | pass                                          |
| V-5  | Depth cap enforced                     | unit test: a 6-level seed fails                                                                        | throws, message names the node                 |
| V-6  | **Depth ramp validated**               | `validate_palette.js … --ordinal --mode light --surface "#ffffff"` and `--mode dark --surface "#0a0c0e"` | both exit 0 — **run at Stage 3; reports in §7.4 and `plan.md`** |
| V-7  | Env access unchanged                   | `rg -n 'process\.env\.' src --glob '!src/lib/env.ts'`                                                   | no matches                                    |
| V-8  | Draw calls                             | three.js `renderer.info.render.calls` while orbiting                                                   | nodes 1, edges 1                              |
| V-9  | Bundle isolation and budget            | `npm run build` output; grep the shared chunk for `three`                                              | `/` unchanged; `/graph` chunk ≤ 400 KB gzip    |
| V-10 | No-WebGL path                          | component test with the WebGL probe stubbed to `null`                                                  | notice rendered, no canvas                    |
| V-11 | Reduced motion                         | unit test on the tween helper with `matchMedia` stubbed to `reduce`                                    | duration 0, no intermediate frames            |
| V-12 | Frame rate                             | manual: orbit continuously on a desktop and on a tablet at 150 nodes                                   | ≥ 60 / ≥ 30 fps; numbers recorded in `plan.md` |
| V-13 | CSP clean                              | load `/graph`, read the browser console                                                                | no new Report-Only violation                  |
| V-14 | Label cap                              | unit test on the label-selection function with 150 nodes                                               | ≤ 24 returned; root and focused always present |
| V-15 | Both themes                            | manual: load in light and dark, toggle mid-session                                                     | ramp re-reads; no flash; neither mode is a flip |
| V-16 | No new server surface                  | `rg -n "'use server'|route\.ts|middleware\.ts" src`                                                     | no matches                                    |
| V-17 | Chrome keyboard path                   | manual: tab through header, links, toggle                                                              | focus always visible, order sensible          |
| V-18 | Small-viewport path                    | component test with `matchMedia` stubbed below the threshold                                           | notice rendered, no canvas mounted            |
| V-19 | **No GPU or listener leak**            | navigate `/graph` → `/` → `/graph` ten times; watch `renderer.info.memory.geometries` and `.textures`, and assert the resize / pointer / `webglcontextlost` / `MutationObserver` / `matchMedia` listeners are gone | counts return to baseline; no listener growth |

V-6 is the gate the `dataviz` skill exists to enforce, and V-2, V-9 and V-16 are the ones
that prove this stayed a static page with no new server surface. **V-19 is new at Stage 3**
and exists only because D-1 changed: r3f would have disposed the scene's resources for us,
and nothing does now.

---

## 13. Handoff to engineering

Read with [`intent.md`](./intent.md), then run `/plan-from-spec ai-knowledge-graph-3d`.

**Resolve before writing `plan.md` — all three are now resolved**, and this section is
kept as the record of how:

1. ~~The `@react-three/fiber` major that supports React 19 under Next 16, and whether
   `transpilePackages` is needed (R-1).~~ **There is none.** Every published release caps
   at `react <19.3`; this repo pins `19.3.0`. D-1 and §7.2 now specify vanilla `three`,
   and no `transpilePackages` entry is needed.
2. ~~The exact resolved versions.~~ **`three@0.186.0`, `@types/three@0.186.0`**, both
   pinned exactly. `@react-three/fiber` is not installed.
3. ~~Ramp B's five light and five dark hexes, generated and validated.~~ **Generated and
   validated, both modes, exit 0.** The hexes and the reports are in §7.4.

**Suggested sequence** — each step independently verifiable:

seed + schema + flatten (V-3, V-5) → layout (V-4) → tokens + palette mapping (V-6) →
route shell, chrome, metadata, loading/error (V-2) → gate + notice (V-10, V-18) → canvas,
nodes, edges (V-8, V-19) → labels (V-14) → controls and fly-to (V-11) → depth key and
theme token re-read (V-15) → budget and frame rate (V-9, V-12) → `CLAUDE.md`.

*Amended at Stage 3:* the depth key (C-2) joins the theme step, and V-19 joins the canvas
step. The order is otherwise as written and is followed by `plan.md`.

`plan-from-spec` step 2 requires raising a non-empty `## Areas of concern` with the policy
owner before planning. **C-1, C-2, C-3, C-6 and C-8 are decisions for the product owner.
Do not plan around them silently.**

*Amended at Stage 3:* all of them were raised and answered. Each concern below now carries
a **Resolved at Stage 3** line recording the call and where it is implemented. The
reasoning is in `plan.md`; the calls themselves are summarised here so the spec stays
readable on its own.

---

## Areas of concern

**C-1 — The intent's "no accessibility" constraint contradicts a standard this repo
already committed to. (Highest.)** The intent records zero accessibility work as an
accepted trade. The baseline spec's NFR-5 says *"WCAG 2.2 AA for all shipped surfaces"*
and the `design-system` skill carries an accessibility baseline this spec was told to
apply. **Both cannot hold.** This spec resolves the contradiction in the intent's favour —
chrome conforms, the scene does not — because the intent is the newer and more specific
instruction, but the resolution should be a decision, not an inference. What ships is a
public page that fails WCAG 2.1.1, 4.1.2 and (at the outer ramp steps) 1.4.11. Two further
points the intent did not weigh: this is the app's **only product surface**, so "the
inaccessible part" is the whole product, not a corner of it; and ProductDock is EU-based,
where the European Accessibility Act has applied since June 2025 — irrelevant for an
internal tool, material the moment this is shown to a client or published as a commercial
service. **Recommendation: approve the trade explicitly and open the follow-up intent at
the same time this one merges**, rather than after. §7.8 and §2.3 keep the door open
cheaply (DOM labels, a single picking handler); that door closes quietly if nobody walks
through it (R-7).

**Resolved at Stage 3: the trade is approved, and the accessibility follow-up intent is opened in the same commit this merges** — not afterwards. R-7 rates "debt never paid" High/High and this is the app's only product surface, so a scheduled intent is the only thing that keeps §2.3's door open. §7.8's DOM labels and the single picking handler stand as the named seam.

**C-2 — Depth is encoded by colour, and the legend that would explain it is out of
scope.** `dataviz` is unambiguous: identity must never be carried by colour alone, and any
encoding with two or more levels ships a legend. The intent puts the sidebar — explicitly
including the legend — out of scope. The mitigation in §9.2 is real but partial: node
radius and shell distance also carry depth, so a viewer with a colour-vision deficiency
can still read the structure from size and position. What they cannot do is read *"blue
step 3 means level 3"*, because nothing on screen says so. **This is a genuine
unsatisfiable pair, resolved in the intent's favour, and the PO should confirm it.** The
cheapest fix that does not reopen the excluded sidebar is a single inline depth key in the
header — roughly five swatches and five words. It is not in this spec's scope because the
intent excluded it; it would be a small, contained addition if the PO wants it.

**Resolved at Stage 3: the cheapest fix is taken.** An inline depth key ships in the route header — five swatches, five words, reading `lib/graph/palette.ts` so it cannot drift from the scene. It is not the excluded sidebar, and it closes the `dataviz` gate for roughly twenty lines. Recorded as a small, deliberate addition over this spec rather than pretended to be in it.

**C-3 — A hard five-level cap on a tree the intent said would nest "as deep as the content
needs".** One colour per level (a fixed constraint) plus a validated finite ramp (a
`dataviz` gate) forces a maximum depth. Five was chosen because the day-one tree is
exactly five levels — which means **the cap binds on the very first commit**: adding one
child under `pgvector` fails the build. This is not hidden, it fails loudly and names the
node, and extending the ramp is a token edit plus a validator run — but it is a real
constraint the intent did not anticipate. The alternative — an unbounded ramp — is worse:
beyond about six steps of one hue, adjacent levels stop being distinguishable and the
encoding silently stops meaning anything. **PO decision: accept the cap, or accept that
depth colour stops being reliable past level five.**

**Resolved at Stage 3: the cap is accepted as specified.** Verified against the day-one tree — 36 nodes, deepest is `ai/n-node/rag/vector-db/pgvector` at depth 4 — so the cap does bind on the first commit, exactly as this concern says. Accepted because it fails loudly and names the node, and extending it is a token edit plus a validator re-run. Clamping deeper nodes to the level-4 colour was rejected: it would let depth colour stop being truthful with nothing on screen saying so.

**C-4 — The colour ramp in this spec has not been validated.** §7.4 specifies the
construction, the thresholds, the surfaces and the exact commands, but the validator could
not be executed in the session that produced this spec, so **no ramp here is confirmed to
pass**. Two consequences. First, V-6 is a blocking gate at Stage 3, not a checkbox —
the hexes are not final until it exits 0 in both modes. Second, this app's surfaces
(`#ffffff`, `#0a0c0e`) are not the validator's defaults (`#fcfcfb`, `#1a1a19`), so even
Ramp A's published numbers do not transfer and must be re-measured. Do not ship colours
from this document on the strength of this document.

**Resolved at Stage 3: closed.** The validator has been run in both modes against `#ffffff` and `#0a0c0e`. Ramp B passes; the hexes and reports are in §7.4 and `plan.md`. Ramp A is dropped.

**C-5 — There is still no reviewed brand policy, and the one that exists says nothing
about 3D.** `CLAUDE.md`'s own "Not organisational policy" note applies unchanged: the
`design-system` skill is an extraction from a marketing website, with no observed dark
theme and no component inventory. It has nothing at all to say about a 3D scene — node
form, fog, camera feel, depth cueing, scene surface, label treatment in perspective. Every
such decision in §7 and §9 is derived from adjacent rules (use the accent, don't invent a
shadow scale, keep tokens role-named) rather than taken from a standard. The derivation is
defensible; it is not authoritative, and the first person to say "that doesn't look like
us" will be right without contradicting anything written down.

**Resolved at Stage 3: acknowledged, not closed — because it cannot be closed from here.** Every 3D decision in §7 and §9 remains derived rather than authoritative, and the first person to say "that doesn't look like us" will be right. What this spec can do, it does: the ramp is brand-hued and validated, no shadow scale is invented, no third radius is introduced, and all colour stays in role tokens in `globals.css`, so a future brand review changes token values and not component code.

**C-6 — Three dependencies added to a stack the baseline intent declared "fixed".** The
baseline says the stack *"is fixed and is not open for design debate"*, and `three` /
`@react-three/fiber` / `@types/three` are not on it. The addition is unavoidable — "must
be rendered in 3D, not 2D" is the intent's one non-negotiable constraint, and nothing on
the fixed list draws WebGL — but it is a scope decision and it belongs to the PO, exactly
as `zod` did in the baseline (that spec's C-3). Worth naming the weight honestly: `three`
is by a wide margin the largest dependency in this repository and the only one whose major
releases routinely break rendering code.

**Resolved at Stage 3: approved, and smaller than specified** — one dependency plus one dev dependency, not three. `@react-three/fiber` is gone for the compatibility reason in D-1, which also removes about twenty transitive packages from the review surface. `three` remains the largest dependency in the repository and the honest weight of the decision is unchanged.

**C-7 — The security policy applied here is generic, and the CSP is still not
enforced.** The baseline's C-1 is only half-closed: a `security-review` skill now exists in
this repository, but it is a vendored OWASP-derived review skill, not ProductDock policy,
and nothing in it was written with this app in mind. §8 is therefore platform-standard
practice plus the intent's constraints, unreviewed by a policy owner. Separately, the CSP
remains `Report-Only` with no report collector, so V-13 ("no new violations") is an
observation made in one developer's browser console, not an enforced control. The claim in
§8.4 that this design needs no CSP change is sound and is a real design win — but it is a
claim about a policy that is not currently enforcing anything.

**Resolved at Stage 3: acknowledged, not closed.** §8's policy source is still generic and the CSP is still Report-Only with no collector, so V-13 remains an observation rather than an enforced control. Nothing in this change makes it worse, and the §8.4 claim got stronger: with both r3f and drei gone, the feature has no worker, no `blob:` URL and no external fetch at all.

**C-8 — Six of the thirty-six labels are placeholders, and the intent's success criterion
is precisely that a newcomer can read the picture unaided.** Two branches are named
`n Node`, and four labels are notes-to-self (*"Find agent example max 5-10"*, *"Bring your
own but check with us"*, *"what else is hyped now or active"*, *"something else"*). The
intent leaves both open with Nemanja as owner, and this spec ships them verbatim rather
than inventing names. The collision is worth stating plainly: the `n Node` branch holds
twelve of thirty-six nodes — a third of the graph — and the stated outcome is *"someone
who has never seen it can open the page and tell which areas of AI we have mapped out"*.
They cannot do that for a third of the tree. **Not a blocker for the build; a blocker for
the outcome.** These can be answered in ten minutes and should be, before Stage 3 rather
than after.

**Resolved at Stage 3: the labels ship verbatim, and the question is put to the originator before merge rather than after.** This spec is right not to invent names. But the collision stands as written — the `n Node` branch is 12 of 36 nodes and the success criterion is that a newcomer can read the picture unaided — so `plan.md` carries it as a blocker for the *outcome* while the build proceeds.

**C-9 — Nobody owns getting this in front of the team.** The intent's outcome is *"a page
in the app that my team and I can open"*. Hosting, deployment and domains were out of
scope in the baseline (its D-5 and C-6) and are out of scope here, and no intent in this
repository owns them. As things stand, the deliverable is a page that runs on
`localhost:3000` on one laptop. That may be exactly right for now — but *"my team can open
it"* is not satisfied by this spec or by any other, and no one is currently accountable
for closing the gap.

**Resolved at Stage 3: recorded, still unowned.** No intent in this repository owns hosting, and this plan does not take it on. The deliverable remains a page that runs on `localhost:3000`, and *"my team can open it"* is satisfied by nothing currently written down.

**C-10 — The click gesture is spent, and the replacement should be chosen now.** The
intent records this consequence itself: click flies the camera, so the deferred node popup
needs a different gesture. Choosing it now costs nothing and constrains nothing — the
options are double-click, long-press (needed for tablets either way) or a modifier-click.
Choosing it later means either changing camera behaviour people have already learned, or
accepting whatever gesture happens to be left over. It is not built here; it should be
decided here.

**Resolved at Stage 3: decided, not built.** Double-click on a desktop, long-press on a tablet, reserved for the deferred node popup and recorded in `CLAUDE.md`. Long-press is needed for tablets in any case, which is what makes the pair the cheap answer.

**C-11 — Phone users get a dead end, by design.** No 2D or text fallback is built, which
is the right call for scope, but the consequence should be conscious: a link to `/graph`
shared in Slack opens to "this needs a bigger screen" for anyone reading on a phone, which
is most people, most of the time. The mitigation costs one sentence, not a second view —
the notice already tells them what to open it on. Flagged because "phones are deferred"
reads as a smaller decision on paper than it feels like in a group chat.

**Resolved at Stage 3: accepted as written.** No fallback view is built. The notice copy in §7.9 already names what to open it on, which is the whole of the mitigation this concern asks for.

**C-12 — A pre-existing theme-store defect that this feature has to route around.**
`src/stores/ui-store.ts:12` initialises `theme` to `"light"` unconditionally, and nothing
hydrates it from `localStorage` or the OS setting — while the inline script in
`layout.tsx` sets `data-theme` on `<html>` from `localStorage` before first paint. The
store and the DOM therefore disagree on any load where the stored or OS theme is dark: the
toggle shows the wrong icon and its first click can be a visible no-op. This is not caused
by this change, and §7.5 works around it by reading the DOM rather than the store, so the
scene stays correct either way. But the workaround is only necessary because the store is
wrong. It is a few lines to fix (hydrate from `localStorage` / `matchMedia` on mount) and
is worth a separate small PR rather than being absorbed silently into this one.

**Resolved at Stage 3: a separate small PR, not absorbed into this one.** §7.5's DOM read is correct on its own merits — the DOM is the truth for theme — so this feature does not depend on the fix landing first. But the store is still wrong for the theme toggle itself, and fixing it here would hide a pre-existing defect inside a feature PR.
