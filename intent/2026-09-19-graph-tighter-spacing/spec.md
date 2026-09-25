# Spec: lower the gap between connected nodes

- **Intent:** [`intent.md`](./intent.md) — *lower the gap between connected nodes*
- **Originator:** Nemanja (product owner)
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** awaiting product owner and engineering review

## Review guide

This spec has two audiences, and it's split so each can stop where their job ends.

- **Product owner:** read **Part A** only. It has everything you need to approve, redirect, or
  cut a decision — what changes on screen, what's still open, and what could go wrong. No file
  names, code, formulas, or rendering mechanics appear in Part A; where a technical choice has a
  consequence you'd care about, it's stated as that consequence, with a pointer into Part B for
  anyone who wants the mechanics.
- **Engineering:** read Part A for the same context the product owner has, then Part B, which is
  where the build actually lives.
- **Both:** read **Areas of concern** at the end. Every item there is written so the product owner
  can act on it without reading Part B.

Section numbers run continuously across both parts, so a cross-reference like "see §9.2" always
points at the same place no matter which part you're in.

---

## Part A - Product

### 1. Summary

Today, opening `/graph` shows the whole tree pulled well back from the camera: there is a lot of
empty space between the four top-level branches, between a parent and its children, and around
the outside of the tree. That first view is what every visitor sees before they click anything,
so the amount of empty space in it is the app's first impression, not an edge case.

This spec pulls connected nodes closer together everywhere in the tree, in the same proportion at
every level, so the whole tree takes up noticeably more of the screen on that first view and every
circle in it looks correspondingly bigger. Nothing about which nodes exist, their names, their
colours, or their true size changes — only how far apart they sit. The gap between the centre and
the ring of four topics shrinks too, by the same proportion as everything else, and stays the
widest gap in the scene, so the middle still reads as the middle. Once you click into the graph,
nothing about this spec changes what you see — the closer spacing is a first-load effect only.

### 2. Scope

#### 2.1 In scope

- Every gap in the tree — between the centre and the ring, and between every later pair of levels
  — shrinks by the same proportion, so the tree occupies visibly more of the screen on first load.
- Circles look correspondingly bigger on that same first view, purely as a result of sitting
  closer to the camera — their true size is untouched (§4, D-2).
- The gap between the centre and the ring keeps being the single widest gap in the scene, at the
  new, smaller scale (§6; Areas of concern, C-2).
- The starting amount of tightening — proposed here, for the originator to judge in the running
  app and accept, loosen, or tighten (§4, D-1; Areas of concern, C-1).

#### 2.2 Out of scope

Restated from the intent, so nothing below is quietly folded into this piece of work:

- The rule that no two circles may ever touch or overlap. It stays exactly as strict as it is
  today — tighter spacing does not get to buy itself room by relaxing it (§6; Areas of concern,
  C-1).
- Each top-level branch keeping its own separate wedge of the graph, never crossing into a
  neighbour's. Unaffected by this work by construction (§9.2).
- How far you can zoom the camera in once you start exploring. That boundary stays exactly where
  it is today, in absolute terms — it does not shrink along with everything else (§4, D-3).
- The view you land on after clicking a node, and its neighbours. Untouched — this is a first-load
  change only.
- Which node names disappear when there isn't room to show them all. The existing rule is
  unchanged; it will simply trigger more often now that circles sit closer together, which the
  originator has already accepted as a fair trade (§5, FR-9).
- Node true size, colour, shape, edge styling, and the seed content itself. None of it changes.

#### 2.3 Deferred

- **A version of this change that shrinks the centre-to-ring gap by a different proportion than
  the rest of the tree**, rather than one shared proportion for everything. Not needed for the
  figure proposed here — a single shared proportion already keeps the centre-to-ring gap
  comfortably the widest one (§6; Areas of concern, C-2) — but it is the natural next lever if a
  future request asks for something markedly tighter than this. Not built now.

### 3. Decisions that close the open questions

All five questions the intent raised were put back to the originator and answered before this
spec was written (intent.md, **Constraints**); nothing about *whether* to build this was left open.
They're restated here only because engineering builds from this document:

| # | Open question | Decision (from intent.md) |
| --- | --- | --- |
| Q1 | How much tighter? | No figure from the originator; the design stage proposes one and he judges it in the running app (§4, D-1). |
| Q2 | May the centre-to-ring gap shrink? | Yes, proportionally with everything else, as long as it stays the widest gap in the scene. |
| Q3 | Does the camera's closest-zoom boundary move with the shrink? | No — it stays at today's absolute distance; the resulting trade (relatively less zoomed-in detail available) was explicitly accepted (§5, FR-7). |
| Q4 | Are more hidden node names at the opening view acceptable? | Yes, accepted as a trade; the rule for which names disappear is unchanged. |
| Q5 | Does the after-click framing tighten too? | No — first load only. |

This spec's job is to turn those five already-made decisions into a buildable design (Part B) and
to surface the smaller choices that had to be made *underneath* them, which the intent didn't
spell out (§4).

### 4. Decisions added beyond the intent

The intent settled the shape of the outcome and left the exact mechanism and figure for this spec
to propose. None of the following should be treated as settled just because it's written down —
confirm or cut each one.

1. **The starting figure proposed here is a 40% reduction in every gap** — the centre-to-ring gap
   and every later gap between levels, all shrunk by the same proportion (§9.1). This is not a
   number the originator gave; it is this spec's own estimate of a change that is clearly visible
   without crowding the tree, worked out from how much headroom today's spacing has above the
   two rules that must not break (no touching circles, centre-to-ring stays widest — §9.1, §9.2).
   **This is the number the originator is asked to judge in the running app** and accept, loosen,
   or tighten (Areas of concern, C-1).
2. **The tightening comes entirely from moving circles closer together, not from changing any
   circle's true size.** A circle looking bigger on the first view is a side effect of it now
   sitting closer to the camera, exactly the way anything looks bigger the closer it is — nothing
   about a hub's, a group's, or a leaf's actual size changes, and nothing elsewhere that depends on
   those sizes is touched. **This is a choice this spec is making among the options the intent left
   open** ("whether the tightening comes from the spacing itself, from the opening camera distance,
   from node sizes, or from some combination") — confirm this is the right one, rather than, say,
   also wanting bigger circles in their own right.
3. **The camera's closest-zoom boundary becomes a fixed number, decoupled from the tree's own
   size, rather than a proportion of it the way it is today.** The intent was explicit that this
   boundary must not move (Q3); today it is calculated as a proportion of the ring's size, so
   keeping it fixed while the ring itself shrinks means it has to stop being calculated that way
   at all. The consequence beyond this one change: from now on, that boundary will not
   automatically follow if the tree's spacing is adjusted again later — a future change that wants
   the boundary to move too will need to say so and change it on purpose (§9.3).

### 5. Functional requirements

Each of these is something you can point at on screen; verification is §11.

- **FR-1.** On the first view of `/graph`, before anything is clicked, the whole tree fills
  noticeably more of the screen than it does today, with noticeably less empty space around and
  between branches.
- **FR-2.** On that same first view, every circle looks bigger than it does today.
- **FR-3.** No two circles ever touch or overlap, on the first view or at any time afterward —
  unchanged from today.
- **FR-4.** Each of the four top-level topics keeps its own separate slice of the graph; branches
  never cross into each other — unchanged from today.
- **FR-5.** The open space between the centre and the ring of four topics stays visibly the
  largest gap anywhere in the graph, on the first view and afterward.
- **FR-6.** How close the camera can get once you start exploring stops at the same point it does
  today — that boundary does not move.
- **FR-7.** Because the whole graph is now smaller while that boundary stays the same, the
  closest possible view shows relatively less close-up detail than it used to. This is a decided,
  accepted trade (§3, Q3) — not a defect to fix.
- **FR-8.** What you see after clicking a node — that node, its children, and what it hangs off —
  is unchanged by this work.
- **FR-9.** Because circles sit closer together, more node names may be hidden on the first view
  than today; the existing rule for which name wins when two would collide is unchanged. This is
  a decided, accepted trade (§3, Q4) — not a defect to fix.

Checkable, in the intent's own words: on the same screen, the tree occupies visibly more of the
canvas on first load than it does today, and no circle pair sits closer than the existing
no-touching rule allows.

### 6. Risks

| Risk | Why it matters |
| --- | --- |
| **The 40% figure proposed here (§4, D-1) is this spec's estimate, not a number verified against the app's own no-touching rule while this document was being written** (Areas of concern, C-1). | The rule itself is not changing and is expected to hold — the reasoning in §9.1 shows real headroom — but the exact figure the originator sees in the running app may be adjusted down from 40% if engineering's check calls for it, before it is ever shown for judgement. |
| **The relatively-smaller closest-zoom view (already accepted, §5 FR-7) will be more noticeable at a 40% reduction than it would be at a smaller one.** | Worth keeping in mind specifically when judging the proposed figure in the app — it is the one accepted trade that gets more visible the tighter this goes. |
| **More node names will disappear at the opening view than today** (§5, FR-9). | Already an accepted trade in the intent, not a new risk this spec introduces — restated here because it is one of the more visible side effects of the change. |
| **A single shared proportion for every gap keeps the centre-to-ring gap comfortably the widest one at 40%, but that margin narrows the further this is pushed** (§6; Areas of concern, C-2). | Not a problem at the figure proposed here, but a future request for something markedly tighter should not assume "a little more" is free — past a certain point the middle stops reading as the middle, which is one of the three things this work must not break. |

---

## Part B - Technical design

### 7. How this fits the existing app

This changes two numeric spacing constants and how one camera-distance value is computed. It adds
no route, no dependency, no environment variable, no schema change, and touches no seed content.
The tree's angular layout (which direction each branch grows in, and how wide a slice of the ring
or of a parent's cone each child gets) is entirely untouched — this spec only changes *how far
out* along those already-decided directions each shell sits.

| File | Change |
| --- | --- |
| `src/lib/graph/layout.ts` | `RING_RADIUS` and `SHELL_GAP` shrink by a shared multiplier (§9.1: proposed starting point ×0.6 → `RING_RADIUS = 12`, `SHELL_GAP = 7.2`). `shellRadius()`, `layout()`, and every angle-producing function are unchanged — they already treat these two as plain numbers. |
| `src/app/graph/_components/graph-scene.tsx` | The camera's closest-approach distance stops being derived from the (now smaller) ring radius read off the scene's node positions, and becomes a fixed constant equal to today's value (§9.3). `RING_CLEARANCE` and the `ringRadius` reduce it fed become dead code and are removed; `ringNodes` stays, since `openingAzimuth` still needs it. No other constant in this file changes — `overviewDistance()`, fog range, label-fade range, and `controls.maxDistance` already key off the actual node positions and `scene.radius`, so they shrink to match automatically (§9.4). |
| `src/lib/graph/palette.ts` | The `GROUP_RADIUS` doc comment's measured figures (today: "the closest pair involving a group sits 5.98 apart... anything past ~2.39 fails") describe a *distance*, which shrinks by the same proportion as everything else even though `GROUP_RADIUS` itself is not changing. Both figures are recomputed against the new constants and rewritten (§9.1). |
| `CLAUDE.md` | The "`GROUP_RADIUS` is bounded by a test, not by taste" bullet under **Graph data** quotes the same two figures verbatim and needs the same update, for the reason the bullet exists in the first place: a future reader must not tune `GROUP_RADIUS` against a ceiling this change has moved. |
| `src/lib/graph/layout.test.ts` | No new tests. Its existing pairwise-floor test (parametrised over the day-one seed and the 148-node synthetic seed), its wider-gap test, and its non-interleaving test already assert every invariant this change must keep; they are the acceptance gate, re-run unmodified against the new constants (§11). |

### 8. Non-functional requirements

- **No new dependency.** The change is two constant values and one small refactor of an existing
  distance calculation, using arithmetic already in the file.
- **No new draw call, geometry, or DOM node.** Node count, edge count, and the instanced-mesh /
  line-segments rendering approach are unaffected — this changes *where* the same objects sit, not
  what is rendered.
- **No new per-frame cost.** Nothing here adds work inside `renderFrame()`; `overviewDistance()`,
  fog, and label-fade ranges already recompute from the current camera and node positions every
  frame the way they do today (CLAUDE.md, "The opening view is solved, not a constant").
- **The render-on-demand model is unaffected.** No new call to `invalidate()` and no new scheduled
  work is introduced (CLAUDE.md, "The 3D scene renders on demand, not on a loop").
- **Reduced motion is unaffected.** The camera's fly-to tween (`tween.ts`) already reads
  `prefers-reduced-motion` independently of `globals.css`'s CSS-only guard; this spec adds no new
  animation and does not touch that file.
- **Accessibility posture is unchanged.** This is a spacing and camera-distance change to a scene
  already documented as a known accessibility gap (CLAUDE.md, "Accessibility of the scene is known,
  recorded debt"); it neither improves nor worsens that.

### 9. Design

#### 9.1 Shrinking the layout by one shared proportion

Every node's position is `direction × shellRadius(depth)`, where `direction` is a unit vector that
depends only on angles — which branch a node is in, and how wide a slice of its parent's cone it
was given by its share of leaves under it (`halfAngleForShare`, `ringDirection`). Critically,
**no angle in the layout depends on `RING_RADIUS` or `SHELL_GAP`** — only `shellRadius(depth)`
does, and it is linear in both: `shellRadius(depth) = RING_RADIUS + SHELL_GAP × (depth - 1)` for
depth ≥ 1, and `0` at the root.

That means scaling `RING_RADIUS` and `SHELL_GAP` by the same factor `k` scales `shellRadius(depth)`
by exactly `k` at every depth, which scales *every node's position* by exactly `k`, which scales
*every pairwise distance* by exactly `k` — with no change to any angle, so branch separation
(FR-4) is untouched by construction. Node radii (`HUB_RADIUS`, `GROUP_RADIUS`, `LEAF_RADIUS`) are
not part of this scaling — they stay exactly as they are (§4, D-2) — so the existing floor,
`2.5 × the larger of two nodes' radii`, is also unchanged. The ratio between a pair's distance and
its floor therefore scales by exactly `k` too.

CLAUDE.md records one measured data point at today's constants (`k = 1`): the closest pair
involving a group sits `5.98` apart in the 148-node synthetic seed, against a floor of
`2.5 × 1.05 = 2.625` — a ratio of about `2.28`. At the proposed `k = 0.6`, that same pair's
distance becomes `5.98 × 0.6 ≈ 3.59`, against the same, unchanged floor of `2.625` — a ratio of
about `1.37`, which still clears `1` (the floor `layout.test.ts` enforces) with real margin. This
is the reasoning behind the 40% figure in §4, D-1: comfortable margin, not the tightest number that
technically still passes.

This one data point is the closest pair *involving a group* specifically — it is not, on its own,
a proof that no other pair (say, a dense cluster of leaves) is tighter. **`layout.test.ts`'s
pairwise-floor test checks every pair, in both the day-one seed and the 148-node synthetic
envelope, and is the actual gate** (§11, V-1); the number above is this document's reasoning for
why `k = 0.6` is a reasonable place to start, not a substitute for running that test against the
real constants (Areas of concern, C-1).

Proposed starting values: `RING_RADIUS = 12` (from `20`), `SHELL_GAP = 7.2` (from `12`) — a shared
`×0.6`. Because a node's own radius is a small fraction of its distance from the origin (the
deepest node's position magnitude drops from `56` to `33.6`, only `0.42` of which is its own
radius either way), the visible extent of the whole tree shrinks by very nearly the same 40% as
the constants themselves.

#### 9.2 Keeping the centre-to-ring gap the widest gap

`layout.test.ts` asserts the centre-to-ring gap (measured surface-to-surface: `RING_RADIUS -
HUB_RADIUS`) is strictly greater than every later shell-to-shell gap (`SHELL_GAP`, constant at
every depth). `HUB_RADIUS` is a node radius, not a layout constant, and is not part of the §9.1
scaling — so scaling `RING_RADIUS` and `SHELL_GAP` by the same `k` does not scale the *margin*
between them by `k`: the margin is `(k × RING_RADIUS - HUB_RADIUS) - (k × SHELL_GAP)`, and the
fixed `HUB_RADIUS` term means that margin shrinks faster than `k` as `k` gets smaller.

At today's constants: `20 - 2.6 = 17.4` vs. `12` — the centre-to-ring gap is `45%` wider. At the
proposed `k = 0.6`: `12 - 2.6 = 9.4` vs. `7.2` — still `≈31%` wider, comfortably clearing the test.
The point where the two become equal is `k ≈ 0.325` (below which the centre-to-ring gap would stop
being the widest gap in the scene at all) — the proposed `k = 0.6` sits well clear of it, but this
is the reason a much more aggressive tightening than this one could not simply keep scaling both
constants by the same shared factor (§2.3; Areas of concern, C-2).

#### 9.3 Decoupling the camera's closest approach from the ring's size

Today, `graph-scene.tsx` computes the camera's closest allowed distance as `ringRadius ×
RING_CLEARANCE`, where `ringRadius` is read from the actual node positions the server sent
(`ringNodes.reduce(..., Math.hypot(...node.position))`) — at today's constants, `20 × 1.15 = 23`.
Left as-is, this number would shrink along with the ring once `RING_RADIUS` does, which the intent
explicitly rules out (§3, Q3).

This spec replaces that computation with a fixed constant equal to today's result — `23` — used
everywhere the old computed value was: `controls.minDistance`, and the target `keepOutsideRing()`
re-clamps the camera's distance from the origin to every frame (this second half matters
independently, because `OrbitControls`' own `minDistance` is measured from the orbit target, which
moves to the clicked node on focus — CLAUDE.md, "The camera is fenced, on purpose"). `RING_CLEARANCE`
and the `ringRadius` reduce that fed it are removed as dead code once nothing multiplies them.

#### 9.4 What already adapts on its own

`overviewDistance()` fits the camera to the actual node positions per screen axis (CLAUDE.md, "The
opening view is solved, not a constant") — it takes no separate "how far back should the camera
sit" constant of its own. Once §9.1's smaller positions are in effect, this function already
produces a smaller opening distance with no code change, which is the entire mechanism behind
FR-1 and FR-2: the same camera-fit logic, run against a smaller tree, sits closer and makes every
circle subtend a larger angle. Fog range and label-fade range are already multiples of the
*current view distance*, not the scene's fixed radius (CLAUDE.md, same section) — so they track the
new, smaller opening distance automatically. `controls.maxDistance` (`sceneRadius × 5`) is also
read from `scene.radius`, which shrinks with the new layout and needs no separate change.

One interaction is worth recording precisely: `overviewDistance()`'s search starts from
`minOrbitDistance` as a floor (`let distance = minOrbitDistance`) and only ever grows from there.
With `minOrbitDistance` now fixed at `23` (§9.3) rather than shrinking, that fixed number is also a
hidden lower bound on how tight the *opening* view could ever get, independent of how far §9.1's
proportion is pushed. At the proposed `k = 0.6`, the naturally-fitted opening distance is still far
above `23`, so this bound does not bind — it is recorded here because it will, eventually, if a
future request tightens this much further while the boundary in §9.3 stays fixed (Areas of
concern, C-3).

#### 9.5 What does not change

Node radii (`HUB_RADIUS`, `GROUP_RADIUS`, `LEAF_RADIUS`), the angular layout (`halfAngleForShare`,
`ringDirection`, `directionInCone`, `CONE_FILL`), the after-click focus framing (`focusNode()`),
label placement and the declutter/collision rules (`graph-labels.tsx`), colour and hue assignment,
the render-on-demand loop, and the seed content are all untouched by this spec.

### 10. Security

This is a change to two numeric layout constants and one camera-distance calculation, all
pre-existing, pure-arithmetic code paths with no user input, no data flow, and no client/server
boundary crossed.

- **No new dependency.** Nothing here adds a package.
- **No new content path.** No text, markup, or user-controllable value is newly rendered.
- **No CSP impact.** Nothing here adds a font, a worker, or an external fetch.

Everything else in the original scene's security design (`ai-knowledge-graph-3d`'s spec.md, §8)
continues to apply unchanged.

### 11. Verification

| # | Check | How | Pass |
| --- | --- | --- | --- |
| V-1 | No two nodes sit closer than `2.5 ×` the larger of their two radii, at the proposed constants, for both the day-one seed and the 148-node synthetic envelope | Re-run `layout.test.ts`'s existing pairwise-floor test, unmodified, against the new `RING_RADIUS`/`SHELL_GAP` (§9.1) | pass |
| V-2 | The centre-to-ring gap is still strictly the widest gap in the scene, at the proposed constants | Re-run `layout.test.ts`'s existing wider-gap test, unmodified (§9.2) | pass |
| V-3 | No branch's subtree crosses into a neighbouring branch's slice of the ring | Re-run `layout.test.ts`'s existing non-interleaving test, unmodified — unaffected by construction (§9.1), re-run for safety | pass |
| V-4 | The whole tree visibly fills more of the viewport on first load than before this change, on the same screen | Manual, on the built page: compare first load before/after | pass |
| V-5 | Individual circles look visibly bigger on that same first view | Manual, on the built page | pass |
| V-6 | The camera's closest reachable distance matches today's absolute value, not a smaller one | Manual: fly in as close as the camera allows and compare against today's build, or inspect the camera's distance from the origin in dev tools | matches today's value |
| V-7 | Clicking a node and its after-click framing are unaffected | Manual, on the built page: unchanged code path (§9.5) | pass |
| V-8 | No regression to the render-on-demand model | Manual, dev tools frame count: the scene still renders zero frames while idle and the camera is not moving | pass |
| V-9 | No regression on the existing suites | Re-run `tree.test.ts`, `colour.test.ts`, `graph-labels.test.ts`, `graph-view.test.tsx`, `tween.test.ts` | all still pass — none of them depend on the specific values of `RING_RADIUS` or `SHELL_GAP` |
| V-10 | `palette.ts`'s `GROUP_RADIUS` comment and CLAUDE.md's matching bullet quote the recomputed, correct figures for the new constants, not the old ones | Manual doc review at merge time (§7) | pass |
| V-11 | The originator judges the proposed figure in the running app and confirms, loosens, or tightens it | Manual, with Nemanja, per the intent's own process (§3, Q1) | accepted / adjusted |

---

## Areas of concern

**C-1 — The 40% starting figure (§4, D-1; §9.1) was worked out by reasoning from one measured
data point CLAUDE.md already records, not by re-running the app's own full node-overlap check
while this document was written.** That check (every pair, not just the one group-involving pair
quoted) is what actually decides whether 40% is safe, and this document could not execute it.
**Resolved here by treating that check as a hard gate engineering runs before anything is shown
for judgement**: if the full pairwise check does not clear at 40%, the fix is to make the
reduction smaller (closer to today's spacing), never to relax the check itself — the intent is
explicit that the no-touching rule does not get to buy tighter spacing (§2.2). **The decision
needed from you:** none today. You're asked to judge the *built and confirmed-safe* result in the
app, exactly as the intent already asks (§3, Q1) — this is flagged only so you know the number you
see there might land a little short of 40% if the check called for it, not because anyone changed
their mind about the target.

**C-2 — Two decisions the intent already made pull in different directions as the tightening
increases: the centre-to-ring gap may shrink "proportionally with everything else," but it must
also stay the widest gap in the scene — and the hub's own circle does not get smaller.** Because
of that fixed circle size, the centre-to-ring gap's margin over the other gaps shrinks *faster*
than the tightening itself as it increases (§9.2 has the exact numbers). At the figure proposed
here it is not close to a problem — the margin is still about 31%, down from about 45% today — but
it cannot be pushed indefinitely by the same method. **Resolved here by choosing a figure with a
real safety margin rather than the tightest number that still technically clears the test.** **The
decision needed from you:** if, after seeing this in the app, you ask for something noticeably
tighter than what's proposed, say so explicitly rather than treating "a bit more" as free — past a
certain point the middle stops reading as the middle, which the intent lists as one of the three
things this work must never break.

**C-3 — The same fixed camera boundary the intent asked to be kept absolute (§3, Q3) also puts an
invisible ceiling on how close the *opening* view could ever get, if a future request tightens the
spacing much further than what's proposed here.** The opening view's distance can never go below
that fixed boundary, however small the tree gets. At the figure proposed here the natural opening
distance sits far above that boundary, so nothing about this piece of work is affected. **Resolved
here by leaving it recorded rather than solving a problem that doesn't exist yet.** **The decision
needed from you:** none today — this is a heads-up for whoever handles the next request to tighten
this further, so that a stalled-out opening view isn't a surprise the first time someone asks for
"even tighter" a second time.
