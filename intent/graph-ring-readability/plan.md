# Plan: A hub, a ring, and a camera that stays on it

- **Intent:** [`intent.md`](./intent.md) · **Spec:** [`spec.md`](./spec.md)
- **Issue:** none open — `plan-ready.yml` had not opened one when this was written ·
  **Branch:** `plan/graph-ring-readability`
- **Stage:** 3 — plan & design review (AI-Native SDLC, lesson 4)
- **Date:** 2026-09-17

## Context

`/graph` shipped in #22 and does everything the first intent asked for, but Nemanja
opened it and it does not read: a stringy web rather than a hub with clusters, labels
piling on each other and running off the scene, and a free camera you can fly into and
lose yourself in. The spec restructures the same page into three recognisable things —
a hub, a ring of topics at a deliberately wider gap, and branches growing outward from
each topic's spot on the ring — and fences the camera so it can be turned and zoomed
but never flown inside the ring or under it.

No new route, dependency, env var, or server surface. Every change is a number, an
algorithm branch, or a CSS rule inside files that already exist, plus one content edit.

**Spec's own framing, carried into this plan (Areas of concern C-5):** the constants
below are a first attempt, not a final answer. The spec's testable properties (§11) are
what must hold; the numbers behind them are expected to move once someone looks at the
built result. Step 6 is that look, and it is part of the work, not a follow-up.

### Concerns resolved before planning

- **C-2 / Q3 (even ring spacing)** — confirmed by Nemanja on merge: every ring topic
  gets an equal slice regardless of size. Depth ≥ 2 keeps the existing
  leaf-count-proportional cone rule, so a heavy branch shows its weight by reaching
  further and wider *past* the ring.
- **C-1, C-4, C-5** — resolved in the spec in the intent's favour: ship the reshape
  without waiting on the unnamed topics or on content for the empty ring topic.

## Files changed

| File | Change |
| --- | --- |
| `src/lib/graph/layout.ts` | `SHELL_GAP` split into `RING_RADIUS` (hub → ring) and `SHELL_GAP` (ring outward), behind a new `shellRadius(depth)` used by both `layout()` and `sceneRadius()`. Root's children placed on the equator at evenly split azimuth; each ring topic's cone half-angle becomes `(π / n) · CONE_FILL` so a branch can never cross into a neighbour's wedge. `ROOT_HALF_ANGLE` deleted. |
| `src/lib/graph/palette.ts` | `RADII[0]` raised 1.6 → 2.6 so the hub reads unmistakably larger than a ring topic. Still monotonically decreasing. |
| `src/lib/graph/seed.ts` | One content edit: root `name` `"AI"` → `"PD AI"`. |
| `src/app/graph/_components/graph-scene.tsx` | `minPolarAngle`/`maxPolarAngle`/`minDistance` fence the camera; a post-`controls.update()` clamp keeps it outside the ring even when the orbit target has moved off the origin; the opening camera position is derived (azimuth bisecting two ring topics, tilt inside the band); `focusNode` folds the clicked node's parent into its framing extent; the root's label is marked `centred` and exempt from the distance fade. |
| `src/app/graph/_components/graph-labels.tsx` | `LabelPlacement` gains `centred?: boolean`; `apply` uses `translate(-50%, -50%)` for it; spans get `maxWidth` + `overflow: hidden` + `textOverflow: ellipsis` (FR-8 — this does **not** exist today, see Risks); `declutter` clamps its width estimate to that max and uses the centred box geometry for a centred label. |
| `src/lib/graph/layout.test.ts` | New invariants V-1, V-2, V-3, V-5 and a branch-containment test for FR-4; `positions.get("ai")` → `"pd-ai"`. |
| `src/app/graph/_components/graph-labels.test.ts` | Cases for the centred root box and for the truncation-clamped width. |
| `src/lib/graph/tree.test.ts` | Id assertions updated for the renamed root (`"ai"` → `"pd-ai"`, `"ai/n-node/…"` → `"pd-ai/n-node/…"`). **Not in the spec's §7 table — see Risks.** |
| `src/lib/graph/types.ts`, `src/lib/graph/tree.ts` | Docstring id examples only, same rename. **Not in the spec's §7 table.** |
| `CLAUDE.md` | `## Graph data` amended in place: hub/ring shape, the camera's restricted envelope, click framing a parent as well as children, and the new deepest-node id. |
| `intent/graph-ring-readability/spec.md` | §7's file table extended with the three id-rename files above, and §9.6's claim that truncation already exists corrected. Same PR, per the skill's "keep it true" rule. |

Nothing else changes. `src/lib/graph/**` stays framework-agnostic — plain numbers, no
`three`, no `app/`, no `components/`. `graph-scene.tsx` stays the only place that owns
the renderer.

## Sequence of work

Each step is independently verifiable; run `npm test && npm run typecheck` after each.

**1. `layout.ts` — the ring (FR-2, FR-3, FR-4, FR-5).**

```ts
/** Distance between consecutive shells, from the ring outward. */
const SHELL_GAP = 12;
/** Hub → ring. Deliberately larger than SHELL_GAP: this is the mechanism for FR-2. */
const RING_RADIUS = 20;

function shellRadius(depth: number): number {
  return depth === 0 ? 0 : RING_RADIUS + SHELL_GAP * (depth - 1);
}
```

`sceneRadius()` switches to `shellRadius(node.depth) + radiusForDepth(node.depth)` so
one formula serves both. In the child loop, for `isRoot`:

- direction is `[cos φ, 0, sin φ]` with `φ = index · 2π / n` — a literal horizontal
  circle, elevation exactly 0, azimuth independent of `leafCount` (closes Q3);
- the child's own half-angle is `(Math.PI / n) * CONE_FILL` rather than
  `halfAngleForShare(...)`. With four topics that is 40.5° against a 45° half-slice, so
  a topic's whole subtree stays inside its wedge (FR-4) and, being < 90°, every
  descendant direction keeps a positive radial component — a branch can never grow back
  toward the centre.

Non-root levels are untouched: `halfAngleForShare`, `CONE_FILL`, the golden-angle spiral
and the per-branch phase all keep doing exactly what they do today. A childless ring
topic needs no code — the existing `childrenByParent` loop already does nothing for it
(FR-5).

**2. `palette.ts` — the hub reads larger (FR-1).** `RADII[0] = 2.6`. No other change;
nodes are already unlit `MeshBasicMaterial`, so a sphere's silhouette is already a
flat-coloured disc from any angle and no new geometry is needed.

**3. `layout.test.ts` — the invariants, before the camera work.** V-1 (every depth-1
node at the same distance and the same elevation, ±1e-9), V-2 (adjacent depth-1 azimuths
differ by `2π / n` regardless of `leafCount`), V-3 (`shell(1) − radiusForDepth(0)` >
`shell(3) − shell(2)`, read off laid-out positions rather than exported constants), V-5
(a seed with a childless depth-1 node lays out and that node still gets a ring position),
plus FR-4: for every ring topic, every descendant's azimuth is within
`(π / n) · CONE_FILL` of that topic's azimuth. V-4 and the existing shell/separation
tests stay as they are and must keep passing.

**4. `graph-scene.tsx` — the camera fence (FR-6, NFR-2, NFR-3).**

```ts
const MIN_POLAR = Math.PI * 0.18;   // ~32° — never near the ring's axis
const MAX_POLAR = Math.PI * 0.42;   // ~76° — never level with the ring or below it
const OPENING_POLAR = Math.PI * 0.3;
const RING_CLEARANCE = 1.15;
```

The ring's radius is read off the scene the client already has — `Math.hypot(...)` of any
depth-1 node's position — not re-derived from layout constants, so `lib/graph` keeps its
numbers to itself. `controls.minDistance = ringRadius * RING_CLEARANCE`, and
`minPolarAngle`/`maxPolarAngle` as above. Azimuth stays unrestricted.

`minDistance` alone is not enough: it is measured from `controls.target`, which moves to
the clicked node on focus, so after a focus the viewer could dolly inside the ring while
satisfying it. One clamp after `controls.update()` in `renderFrame` closes that — if
`camera.position.length() < ringRadius * RING_CLEARANCE`, push it back out along its own
direction. It must not call `invalidate()`; the `inFrame` guard exists precisely because
scheduling from inside a frame is a silent 60fps loop.

**5. Opening view, click framing, labels — same file.**

- *Opening view (FR-7):* position the camera at `OPENING_POLAR` and at the azimuth of
  ring topic 0 plus `π / n`, i.e. bisecting the gap between two topics, at
  `sceneRadius · OVERVIEW_DISTANCE`. Both derived from the depth-1 positions, so the view
  stays correct if a fifth topic is ever added. `flyTo` preserves the viewer's direction,
  so this matters at mount and never fights a later fly-to.
- *Click framing (FR-9):* `focusNode` folds the clicked node's parent position into the
  same `extent` loop it already runs over children. The root has no parent, so clicking
  the hub keeps today's behaviour exactly, as FR-9 requires. `OrbitControls` re-clamps
  polar angle and distance every frame, so the fence applies to every fly-to target with
  no extra logic at the call site.
- *Root label (FR-1, §9.2):* `updateLabels` marks the root's placement `centred: true`
  and gives it `opacity: 1` unconditionally. It is already pinned into the pool first by
  `selectLabelled`, so this removes the fade, not the pinning.

**6. Labels: truncation and the centred box (FR-8).** In `graph-labels.tsx`, add
`LABEL_MAX_PX = 132` (≈20 characters at the existing 6.6px estimate) to the span style
as `maxWidth` with `overflow: hidden` and `textOverflow: ellipsis` — `whiteSpace: nowrap`
is already there. `declutter` must clamp its half-width to `LABEL_MAX_PX / 2`, or a long
title's collision box stays wider than the text actually drawn and suppresses a
neighbour for no reason; and for a `centred` placement the box is
`y ± LABEL_HEIGHT / 2` rather than the `-1.9 … -0.4` offsets a label-above-node uses.

Type stays 13px Poppins weight 500, colour `var(--text-primary)` with the
`--graph-label-halo` ring — per the `design-system` skill: no tracking below 24px, body
weight 500 for emphasis, no raw hex, no new token, no new radius or shadow scale. No new
animation, so the `prefers-reduced-motion` guard in `tween.ts` is untouched.

**7. Retune, on screen (§9.6, C-5).** `npm run dev`, open `/graph`, and look. The
distance-relative constants (`FOG_NEAR/FAR`, `LABEL_NEAR/FAR`, `OVERVIEW_DISTANCE`) are
multiples of `sceneRadius`, which grows 36.4 → 56.4, so they should hold their character
— check, do not assume. Specifically judge by eye: whether `RADII[0] = 2.6` is actually
large enough for "PD AI" to sit *inside* the circle rather than across it; whether the
polar band feels stiff or too permissive; whether `LABEL_MAX_PX` truncates too eagerly.
Every number moved here gets moved in `plan.md` too, in the same PR.

**8. Docs and spec.** Amend `CLAUDE.md`'s `## Graph data` in place — the sentences about
the full-sphere layout, free camera and children-only framing are now wrong, and a stale
CLAUDE.md is read as current by the next session. Amend `spec.md` §7 and §9.6 as listed
above.

## Risks

| Risk | What depends on it / what happens if it's wrong | Response |
| --- | --- | --- |
| **Narrowing the ring cones crowds the deeper shells.** Today `AI Agents` gets a 92° half-angle (`halfAngleForShare(π, 0.59, 4)`); on the ring it gets 40.5°. The same subtree now has to fit in a much narrower cone. | `layout.test.ts`'s existing "keeps node centres apart" case — which runs a 7-area / 148-node synthetic seed, where the cone is only 23° — is the first thing that breaks. This is **the riskiest step**, and it fails loudly in a unit test rather than quietly on screen. | Raise `SHELL_GAP` and `RING_RADIUS` — §9.6 explicitly authorises retuning them. `SHELL_GAP = 12` / `RING_RADIUS = 20` are already raised from 9 for this reason. Never weaken the separation test to make the layout fit. |
| **Renaming the root changes every node id**, because ids are the slugified name path: `ai/n-node/rag/vector-db/pgvector` → `pd-ai/…`. | `tree.test.ts` asserts two of those ids literally, and `layout.test.ts` one. None of them is in the spec's §7 change table, and nothing else in the app persists an id — no URL state, no storage, no deep links. Harmless today; it would be a breaking change the day ids become links. | Update the three tests and the two docstring examples, and extend §7's table in the same PR so the table stays true. Recorded here so a future deep-link feature knows ids are name-derived and a rename moves them. |
| **FR-8's truncation does not exist to be "kept".** §9.6 says the label keeps "its existing fixed-width, ellipsis approach"; `graph-labels.tsx` has `whiteSpace: nowrap` and no width bound at all. | Read literally, §9.6 would have this step skipped and FR-8 would ship unmet — the exact "long titles ran across the scene" complaint in the intent. | Build it as new work (step 6) and correct §9.6. Not handed back as a blocked spec: FR-8 states the requirement unambiguously, §7 already lists the file as changing, and §9.6 fixes the rule (fixed width, ellipsis, tablet check) — nothing about *what* to build is in doubt. |
| **`minDistance` is measured from the orbit target, not the origin.** | After clicking a deep node, the fence would stop protecting the hub's interior, and FR-6's "can never be moved into the space between the centre and the ring" would be false in exactly the state a viewer reaches by using the feature. §9.5's claim that the fence "applies automatically" is true only of the target-relative clamp. | The origin-relative clamp in step 4. It is four lines and it makes V-6 checkable in the focused state, not just from the overview. |
| **Camera freedom is removed permanently** (spec C-3). Anyone used to flying anywhere loses it. | Not a defect — the intent's central decision. | Recorded, not mitigated. |
| **The empty ring topic ships visibly lopsided, and two topics are still called "n Node"** (C-1, C-4). | The new layout makes density differences *more* visible, so the empty branch will stand out more than before, and roughly a third of the ring still cannot be read by a newcomer — the failure this work exists to prevent, moved one level down. | Out of scope by decision. Both are Nemanja's content calls; worth closing shortly after merge or the success criterion stays false regardless of how well the shape reads. |
| **Tablet legibility is unverified** (Q2/Q5, NFR-6, V-10). | A readability redesign could be right on desktop and wrong at 820px. `LABEL_MAX_PX` was picked on a desktop. | V-10 is a gate, not a nicety: check at 820×1180 in step 7 and revise the width and text size before calling this done. Q5 still has no owner — recommend assigning one. |

**Rollback:** one `git revert` of the feature commit. Nothing is migrated, persisted or
published; the change is constants, one algorithm branch, CSS properties and a name in
the seed. Reverting restores the old ids as a side effect, which is why the id rename is
safe to make now.

**Open questions this plan does not close:** Q1 (is "PD AI" the root's real name), Q6
(the unnamed placeholders) and the content half of Q4 (filling the empty ring topic) are
content decisions the spec handed back to Nemanja, and this plan does not invent answers.
Q2 and Q5 are closed only conditionally — step 7's tablet check is what closes them, and
if it fails the width and text size change before merge.

## Proof

Runnable, in order. This is the Stage 4 feedback loop.

```bash
npm test                       # V-1..V-5 + FR-4 containment + every carried-over case
npm run typecheck
npm run lint
npm run build                  # the seed's .strict() schema and the depth cap run here
npm run dev                    # then the manual checks below at /graph
```

Manual, at 1440×900 and at 820×1180 (the tablet threshold is `min-width: 768px`), in
both themes:

| # | Check | Pass |
| --- | --- | --- |
| V-6 | Drag to every extreme, then scroll/pinch fully in — from the overview **and** after clicking a node four levels deep | stops short of looking down the ring's axis, stops short of level-and-below, and never gets inside the ring |
| V-7 | Fresh load | all four ring topics in distinct screen regions, none behind another |
| V-8 | Click each ring topic and at least one depth-4 node; after the tween settles | the edge up to the parent and all edges down to children are in frame |
| V-9 | The hub | "PD AI" sits centred inside the circle, full opacity at every distance |
| V-10 | At 820×1180 | root, ring and truncated labels all legible — or `LABEL_MAX_PX` and the text size are revised before this is called final |
| V-11 | Re-run `ai-knowledge-graph-3d`'s V-1..V-19 | node/edge/draw-call counts, bundle size, CSP and disposal all unaffected |

`rg -n 'process\.env\.' src --glob '!src/lib/env.ts'` must stay empty, and no geometry,
material or listener is added in step 4/5 without a matching line in the teardown — the
failure mode is a browser that silently runs out of WebGL contexts.

## Could another engineer build this without asking a question?

Yes, with one judgement left open on purpose: the exact numbers in steps 1, 2, 4 and 6.
Every one of them is a starting value with a test or an on-screen check that says whether
it is good enough, and step 7 is the licence to move them. Everything structural — which
file, which function, which invariant, what happens to the root — is decided here.
