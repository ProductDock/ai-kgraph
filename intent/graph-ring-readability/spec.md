# Spec: A hub, a ring, and a camera that stays on it

- **Intent:** [`intent.md`](./intent.md) — *Make the 3D graph readable — a hub, a ring, and
  a camera that stays put*
- **Originator:** Nemanja (nemanja.vasic@productdock.com)
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** merged (#24), then amended during Stage 4 — see *Amendments from the build*

> **Four claims in this spec were falsified by building it.** They are corrected in place
> below and listed in *Amendments from the build* at the end, per the playbook's rule that
> a spec later stages read as approved intent must stay true. Nothing about the product
> requirements (Part A, FR-1…FR-9) changed.

## Review guide

This spec has two audiences and is split so each can stop where their job ends.

- **Product owner:** read **Part A** only. It has everything you need to approve, redirect,
  or cut a decision — what changes on screen, what's still open, and what could go wrong.
  You do not need Part B to review this.
- **Engineering:** read Part A for the same context the product owner has, then Part B,
  which is where the build actually lives.
- **Both:** read **Areas of concern** at the end. Every item there is written so the
  product owner can act on it without reading Part B.

Section numbers run continuously across both parts, so a cross-reference like "see §9.3"
always points at the same place no matter which part you're in.

---

## Part A - Product

### 1. Summary

`/graph` shipped and works, but it doesn't read. The intent's diagnosis, made by looking at
a working build rather than guessing on paper: the picture looks like a stringy web, not a
hub with clusters hanging off it, and a camera that can go anywhere lets a viewer fly into
the middle and lose all sense of orientation.

This spec restructures the same page into three things a viewer can recognise at a glance —
a **hub** in the centre, a **ring** of topics around it holding a clear gap from the hub,
and each topic's own **branches growing outward** from its spot on the ring — and it puts a
fence around the camera so it can be turned and zoomed but never flown into or under. It
also fixes the two smaller readability problems the intent named: labels that pile up or run
off the edge of the scene, and a camera that used to open on a view where topics lined up
behind one another.

Nothing about *what* is in the graph changes, except one line of content the intent already
put on screen when it was demoed: the centre now reads "PD AI" instead of "AI" (§3, first
row). No new route, no new way of interacting beyond what already existed, no new device
support. This is a reshape of an existing page, not a new feature.

### 2. Scope

#### 2.1 In scope

- One visibly larger circle at the centre, with its name inside it rather than floating
  beside it.
- A clearly wider gap between that centre circle and the ring of topics around it, compared
  to the gaps further out.
- Every topic's own branches growing outward from its spot on the ring, away from the
  centre, never back toward it and never across another topic's space.
- A camera that can still be turned all the way around and zoomed closer or further away,
  but that can no longer be flown into the middle of the graph, and can no longer end up
  looking at the graph from underneath.
- An opening view where every topic on the ring already has its own part of the screen,
  rather than lining up behind one another.
- Short labels, with a long title cut off with an ellipsis rather than left to run across
  the scene.
- Clicking any node — not just the ring topics — moves the view to show both what that node
  connects up to and everything that hangs off it. Today it only shows what hangs off it.

#### 2.2 Out of scope

Restated from the intent so anything below is a new piece of work, not something quietly
folded into this one:

- Anything about the graph's content model: no popups, no per-topic pages, no status,
  assignees, filtering, search, or the sidebar. None of that changed when the graph first
  shipped and none of it changes here.
- Reading a node's *full*, untruncated title. Still a separate, later piece of work — this
  spec only decides that a label that doesn't fit gets cut off, not how you'd go and read the
  rest of it.
- Who can use the page or on what device. Desktop and tablet only; a phone still gets a
  plain message instead of the scene.
- The graph's keyboard and screen-reader accessibility. That is its own, already-opened
  piece of work, tracked separately, and this reshape neither fixes it nor makes it worse.
- Deciding what the still-unnamed topics are called, or whether the ring topic with nothing
  under it gets content. Both are content questions for the originator, not something this
  spec resolves (§3).

#### 2.3 Deferred

- **Tablet-specific tuning** of label width and text size is not finished here. The intent
  is explicit that nobody has checked this on a tablet yet, and this spec does not either —
  it sets a working value and requires an on-device check before that value is treated as
  final (§3, §10).
- **Filling the empty ring topic with content** is deferred to a product decision, not an
  engineering one (§3).

### 3. Decisions that close the open questions

The intent left six questions open. Three are answered here; three are handed back because
they are content questions, not design ones, and inventing an answer would be worse than
naming the gap.

| # | Open question | Decision |
| --- | --- | --- |
| Q1 | Is "PD AI" the root's real name, or a placeholder? | **Not decided here — handed back to Nemanja.** It ships reading "PD AI", matching what was already demoed, but this spec does not confirm that's final. See risk in §6. |
| Q2 | How wide should a label get before it truncates, and does that value hold up on a tablet? | **A working value is set, but it is provisional until checked on an actual tablet screen** (§10). Nobody has done that check yet; this spec doesn't skip it, it schedules it. |
| Q3 | Should the ring give a bigger branch more room, or should every topic get the same slice? | **Decided: every topic gets the same slice, regardless of size.** The ring's job is to be a stable frame you can always find your bearings from; a branch that holds more content should show that by reaching further and wider once it leaves the ring, not by getting a bigger seat at the ring itself. The alternative — sizing each topic's slice to how much it holds — makes the ring itself carry a size comparison with nothing on screen telling the viewer that's what they're looking at. **This is a real judgement call the intent didn't make; confirm or cut it (§4).** |
| Q4 | Is the ring topic with nothing under it a content gap or a layout case? | **Split in two.** As a layout matter: a ring topic with nothing under it is a normal, fully supported case, not an error — it takes its place on the ring exactly like the other three. As a content matter: whether to put something under it is still open, and still Nemanja's call. **This spec ships the lopsided ring rather than waiting on that content decision (§4).** |
| Q5 | What should happen on a tablet, where the ring is the same size but the screen is smaller? | **Still open, and still unowned.** This spec's answer is that the camera already fits the whole graph to the screen regardless of physical screen size, so the *shape* should hold up — but whether the *text* stays legible at a tablet's physical size is exactly the untested part of Q2, and needs the same on-device check before anyone can call this closed. Recommend assigning an owner. |
| Q6 | Are the two "n Node" placeholders and four note-style labels still unnamed? | **Yes, unchanged, still Nemanja's to close.** They ship exactly as they read today. This is worth restating strongly here: this whole piece of work exists to make the graph "read" to a newcomer, and roughly a third of the ring's content still can't be read by one, independent of anything this spec fixes about shape or camera. |

### 4. Decisions added beyond the intent

The intent described what the finished picture should look like but didn't specify every
number or edge case needed to build it. Four calls made here go beyond what the intent
asked for, and none of them should be treated as settled just because they're in a spec —
confirm or cut each one.

1. **Even spacing on the ring (Q3, above).** Flagged again here because it's the one most
   likely to surprise someone: a viewer who expects "bigger topic, bigger slice of the ring"
   will instead have to look *past* the ring, at how far and wide a topic's own branches
   spread, to see its size. If that reads as backwards once it's actually on screen, it's a
   layout change, not a one-line tweak — better to catch it in review than after.
2. **How far the camera is allowed to tilt.** The intent asks for a camera that can't be
   flown underneath or into the middle, but doesn't say how much tilt is still allowed. This
   spec picks a specific range — always looking somewhat down onto the ring, never level
   with it or below (§9.3). Worth a look once it's built: too narrow a range and orbiting
   feels stiff; too wide and the "can't see underneath" guarantee gets uncomfortably close to
   its own edge.
3. **Clicking a node now also reveals what it connects up to, not only what hangs off it.**
   This is what the intent's proposed outcome literally asks for, but it's a real change from
   what the page does today (where a click only frames a node's children). Confirm this is
   wanted for every node, including ones deep in a branch where "what it connects up to" is
   probably already obvious from the picture.
4. **The opening view starts angled between two ring topics, not facing one head-on.** With
   four topics evenly spaced, this is the only way to guarantee none of them starts out
   hidden behind another. It's a small, specific choice the intent didn't spell out, and
   worth a glance once built rather than assumed correct from this description.

### 5. Functional requirements

Each of these is something you can point at on screen; verification is §11.

- **FR-1.** The centre of the graph is one circle, visibly larger than any other node, with
  its name shown inside it.
- **FR-2.** There is a visibly wider gap between the centre circle and the ring of topics
  around it than there is between any two rings further out.
- **FR-3.** The topics sit on one ring around the centre, each occupying an equal share of
  it regardless of how much hangs off it (§3, Q3).
- **FR-4.** Every topic's own branches extend outward from its position on the ring, away
  from the centre. A branch never grows back toward the centre or across another topic's
  area.
- **FR-5.** A ring topic with nothing under it still occupies its place on the ring, drawn
  the same way as any other (§3, Q4).
- **FR-6.** The view can always be turned all the way around and zoomed closer or further
  away. It can never be moved into the space between the centre and the ring, and it can
  never end up looking at the graph from below the ring.
- **FR-7.** On opening the page, every topic on the ring already occupies its own part of
  the screen — none starts out directly behind another.
- **FR-8.** A label that is too long to fit is cut short and ends in an ellipsis, rather than
  overlapping neighbouring labels or running off the visible scene.
- **FR-9.** Clicking any node moves the view so that both the node's connection to what it
  hangs off and its connections to everything hanging off it are visible at once. Clicking
  the centre circle returns to the same whole-graph view it does today.

### 6. Risks

| Risk | Why it matters |
| --- | --- |
| **Two ring topics are still unnamed placeholders, and four labels underneath them still read as notes-to-self (§3, Q1/Q6).** | This reshape fixes *how* the graph is structured, not *what's written on it*. A newcomer who can now clearly see "a hub, a ring, and four branches" will still hit a branch called "n Node" and stop being able to read it — the exact failure this whole piece of work exists to prevent, just moved one level down. |
| **The ring topic with nothing under it stays visibly lopsided (§3, Q4).** | The new layout makes density differences *more* visible, not less — which means an empty branch will stand out more clearly than it did in the old, tangled version, not less. |
| **Even ring spacing is a genuine judgement call, not something the intent asked for (§4, item 1).** | If it reads as "why does this small topic get the same room as that big one," the fix isn't a tuning pass, it's a different layout rule. |
| **Tablet legibility is unverified (§3, Q2/Q5).** | This is a redesign specifically about readability; shipping it without ever having looked at it on the smaller of the two supported devices risks solving the problem on desktop and reintroducing it on tablet. |
| **Root name may not be final (§3, Q1).** | Low likelihood of real harm, but a name change after this ships is a one-line content edit that should still go through the same owner, not get invented along the way. |
| **This is the second time a plan for this page has been written without building it first.** | The intent's whole premise is that the *first* version of this page couldn't be judged on paper — it had to be built and looked at. This spec specifies exact-sounding rules (equal ring slices, a tilt range, an opening angle) before anyone has looked at them on screen. See Areas of concern, C-5. |

---

## Part B - Technical design

### 7. How this fits the existing app

This is a reshape of the page that already ships at `/graph`, built by the
`ai-knowledge-graph-3d` intent. It adds no route, no dependency, no environment variable, no
server surface, and no new component family. Every change is either a numeric/algorithmic
change inside files that already exist, or a small addition to one of them:

| File | Change |
| --- | --- |
| `src/lib/graph/layout.ts` | The root's children (depth 1) are placed on a ring instead of over the whole sphere; the gap between hub and ring becomes its own constant, distinct from the gap between later shells (§9.1). |
| `src/lib/graph/palette.ts` | The root's radius (`RADII[0]`) is increased so the hub reads unmistakably larger than the ring (§9.2). |
| `src/app/graph/_components/graph-scene.tsx` | `OrbitControls`' polar-angle and minimum-distance bounds are set to fence the camera to the ring (§9.3); the opening camera azimuth is set deliberately (§9.4); `focusNode`'s framing extent is extended to include the clicked node's parent, not only its children (§9.5); several tuning constants (fog, label fade, overview distance) are retuned for the new geometry (§9.6). |
| `src/app/graph/_components/graph-labels.tsx` | The root's label is special-cased: centred on the node rather than offset above it, and exempted from the distance-fade opacity calculation (§9.2). |
| `src/lib/graph/seed.ts` | One content edit: the root's `name` changes from `"AI"` to `"PD AI"` (§3, Q1) — still just a name in the one file content changes ever touch. |
| `src/lib/graph/layout.test.ts` | New invariants for the ring and the hub-to-ring gap (§11), and the root's id updated (below). |
| `src/lib/graph/tree.test.ts`, `src/lib/graph/types.ts`, `src/lib/graph/tree.ts` | **Amended in.** Ids are the slugified *name path*, so renaming the root from "AI" to "PD AI" moves every id in the tree: five assertions in `tree.test.ts` pin real-seed ids literally, and two docstrings carry `ai/n-node/…` as their example. Nothing else in the app persists an id — no URL state, no storage, no deep links — so this is mechanical today, and a breaking change the day an id becomes a link. |
| `CLAUDE.md` | The `## Graph data` section is amended to describe the hub/ring shape, the camera's restricted envelope, and that a click now frames a node's parent as well as its children — the parts of that section describing the previous full-sphere layout and children-only framing are updated in place, not left stale. |

`src/lib/graph/**` stays framework-agnostic — nothing in `layout.ts` or `palette.ts` learns
about `three`, `app/`, or `components/`; the ring is still expressed as plain numbers. The
one client effect in `graph-scene.tsx` stays the only place that owns the renderer, exactly
as the baseline spec fixed it. No file outside this table changes.

### 8. Non-functional requirements

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-1 | The node and edge counts, draw-call counts, and label-pool size are unchanged from the shipped feature — this is a geometry and camera change, not a scale change. | §11 |
| NFR-2 | The camera cannot be rotated to a polar angle that looks straight down the ring's axis or from below it, in either orbit direction, at any zoom level. | §11 |
| NFR-3 | The camera cannot be dollied to a distance inside the ring's radius. | §11 |
| NFR-4 | The four ring topics occupy visually distinct regions of the viewport on the opening view, on both a desktop and a tablet viewport size, in both themes. | §11 |
| NFR-5 | Every existing non-functional requirement from the `ai-knowledge-graph-3d` spec (frame rate, bundle size, CSP, no new server surface, resource disposal) continues to hold — nothing in this change touches the rendering pipeline, the dependency list, or the client/server boundary. | §11 |
| NFR-6 | The label-truncation width and the on-screen text size are checked on an actual tablet-sized viewport before being treated as final, not assumed from desktop review alone. | §11 |

### 9. Design

#### 9.1 Layout: hub, ring, and outward branches

The existing layout algorithm (`lib/graph/layout.ts`) already places nodes on concentric
depth shells and spreads each node's children inside a cone around its own outward
direction, sized in proportion to how much of the subtree that child carries
(`halfAngleForShare`). That mechanism is kept unchanged for depth 2 and deeper — it's what
already gives a heavy branch more room than a thin one, and it's exactly what should keep
doing that job *below* the ring.

What changes is depth 1 — the root's direct children, which today are spread over the
*whole sphere* around the root using an equal-area formula (`ROOT_HALF_ANGLE = π`). That
produces a spherical shell, not a ring. Two changes:

1. **Depth-1 nodes are placed at a single, fixed elevation** — their direction vector's
   vertical component is held constant (conceptually, the polar angle is fixed at the
   equator) — so they lie on a horizontal circle rather than being scattered over a sphere.
2. **Azimuth is split evenly** between the depth-1 nodes, independent of each one's leaf
   count, closing Q3 (§3) as "same slice regardless of size." This is the one place the
   existing "room proportional to subtree size" rule is deliberately *not* applied — every
   other level keeps it.

The radius of that ring — the depth-1 shell — becomes its own constant, deliberately larger
relative to the hub's own radius than the increment used between any two later shells. That
is the mechanism behind FR-2: the gap that reads as "wider" is a real, separate number, not
a side effect of the existing uniform shell spacing.

Below the ring, nothing about the mechanism changes: each ring topic's children are still
allocated a cone around *that topic's own* outward direction (now a purely horizontal ray),
sized by leaf-count share, and spiraled by golden angle exactly as today. Because the
existing cone math already lets a child land anywhere within its cone — including above or
below its parent's elevation — branches growing out from a flat ring still spread up and
down in three dimensions once they leave it. This is what keeps the scene from reading as a
flat diagram from any angle other than dead overhead, which the restricted camera (§9.3)
also rules out.

A ring topic with no children needs no special case: the existing per-parent loop in
`layout()` already does nothing when a node has no entry in `childrenByParent`, so FR-5 is a
consequence of the algorithm's existing shape, not new code.

#### 9.2 The hub as a circle with a name inside it

Every node already renders as an unlit sphere (`MeshBasicMaterial`), which is why this
requirement needs less new geometry than it sounds like: an unlit sphere has no shading
gradient, so its on-screen silhouette is a flat-coloured disc from any viewing angle — it
already looks like "a circle," not "a ball." That was true before this spec and stays true
after it; nothing about node geometry or materials needs to change to satisfy FR-1's first
half.

What does need to change is the label. Today every label — including the root's — is
positioned above its node (`translate(-50%, -140%)`) and fades with distance. For the root
specifically:

- its label is positioned centred on its own projected screen position
  (`translate(-50%, -50%)`), not above it, so it reads as text inside the circle rather than
  a caption beside it;
- it is exempted from the distance-fade opacity calculation — it is already pinned into the
  label pool first (`selectLabelled` puts the root and the focused node in ahead of anything
  else), so this only removes the fade, not the pinning.

Raising `RADII[0]` (root radius) in `palette.ts` is what makes the hub read as unambiguously
larger than any ring topic, satisfying the "not a dot with a caption" half of FR-1. The
existing invariant that radius decreases monotonically with depth continues to hold — this
is a bigger value at the top of an already-decreasing sequence, not a new shape for it.

#### 9.3 Restricting the camera to the ring

`OrbitControls` — already the only camera-control code in the scene, shipped inside `three`
itself — exposes the bounds needed here without any new dependency or API surface:

- **`minPolarAngle` / `maxPolarAngle`** are set to a band that keeps the camera always
  looking somewhat down onto the ring: never near enough to vertical to look straight down
  its axis (FR-6, "topics line up"), and never past horizontal into looking up from beneath
  it (FR-6, "looking at the back of everything"). This is the numeric range flagged in §4,
  item 2, as worth a look once built.
- **`minDistance`** is raised from its current value so the camera cannot dolly past the
  ring toward the hub — today's `minDistance` (a fraction of the whole scene's radius) is
  replaced with a value keyed to the ring's own radius, so "can't fly into the middle" holds
  regardless of how the overall scene is scaled.
- **Azimuth remains unrestricted.** Turning the whole graph around its vertical axis is
  still exactly what the intent asks to keep — only elevation and distance are fenced.

None of this needs a new library: `minPolarAngle`, `maxPolarAngle`, and `minDistance` are
existing `OrbitControls` options in the version already pinned.

#### 9.4 The opening view

**Amended after the build (§A-1).** The initial *distance* is also no longer a multiple of
the scene radius. `PerspectiveCamera`'s fov is the vertical one, so a fixed multiple crops
the sides of a portrait viewport: at 820×1180 the outer branches and labels were cut off at
both edges, which falsifies this spec's answer to Q5 ("the camera already fits the whole
graph to the screen regardless of physical screen size" — it fits vertically only).
Measured from the desktop frame, the content reaches ±57 world units horizontally against
±30 vertically, so it is not spherical either, and a bounding-sphere fit frames empty space
on a desktop while still being the only thing that saves the tablet. The opening distance
is therefore *solved* against the actual node positions, per screen axis. Fog and
label-fade ranges become multiples of the current view distance for the same reason —
keyed to the fixed scene radius, the whole graph fell inside the fade band at the tablet's
new distance and dissolved into the page.

The camera's initial azimuth is no longer arbitrary: with four evenly spaced ring topics
(§9.1), starting the view at an azimuth offset by half the angle between two of them (a
quarter-turn split in two) guarantees that no topic starts directly behind another, closing
FR-7. The initial polar angle sits inside the band from §9.3, tilted rather than parked at
either edge of it. This is the specific choice flagged in §4, item 4 — it is deliberately
*not* "whatever the camera happened to default to."

#### 9.5 Click-to-frame includes the parent edge

`focusNode` in `graph-scene.tsx` today computes how far back the camera needs to sit by
looking only at the clicked node's children. It is extended to fold the clicked node's
*parent* position into that same bounding calculation, so the resulting frame shows the
node, its parent, and its children together — closing FR-9. The root has no parent, so
clicking it keeps today's behaviour (recentre on the whole graph). The camera's position is
still derived by keeping whatever direction the viewer is already looking from and moving
along it (today's rule, unchanged) — and because `OrbitControls` re-clamps polar angle and
distance every frame regardless of how the camera's position was set, the fence from §9.3
applies to every fly-to target automatically.

**Amended after the build (§A-2): "with no extra clamping logic needed at the call site"
was wrong.** `minDistance` is measured from the orbit *target*, and the target moves to the
clicked node on focus — so the fence stops guaranteeing anything about the hub in exactly
the state using this feature puts a viewer in. Measured over a ~4,200-frame drive (every
ring topic, twelve orbit steps each, a full dolly at each step), the camera's closest
approach to the origin was 23.0 with an origin-relative clamp and **6.2 without it**,
against a ring radius of 20. FR-6 fails without it. The scene therefore re-clamps the
camera against the origin once per frame, after `controls.update()` and before the render —
and without scheduling a frame of its own, since that is the silent 60fps loop the
`inFrame` guard exists to prevent.

#### 9.6 Retuned constants

`SHELL_GAP`, the hub-to-ring gap constant introduced in §9.1, `FOG_NEAR`/`FOG_FAR`,
`LABEL_NEAR`/`LABEL_FAR`, `OVERVIEW_DISTANCE`, and the root's radius all need values re-tuned
for the new geometry. As before this feature shipped, these remain tuning values, not
invariants — the numbers that look right are chosen by building and looking at the result,
not derived on paper (Areas of concern, C-5). What must hold regardless of the exact numbers
chosen is captured as testable invariants (§11), not as specific constants in this document.

~~The label-truncation width keeps its existing fixed-width, ellipsis approach~~ —
**amended (§A-3): there was no existing approach to keep.** The shipped label layer sets
`white-space: nowrap` and no width bound at all, so FR-8 is new work, not a retained
behaviour: a max width, `overflow: hidden` and `text-overflow: ellipsis` on the pooled
spans, with `declutter`'s width estimate clamped to the same number so the box it reserves
matches the text the browser actually draws. §11 adds a tablet-viewport check before that
width is treated as final, per §3 (Q2/Q5).

The label *type size* also moved, at the originator's request on seeing it: 13px to 10px,
with the declutter metrics derived from it rather than hardcoded (§A-4).

### 10. Security

This change touches camera constants, layout geometry, and one label's positioning rule — no
data flow, no dependency, no environment variable, and no client/server boundary is affected.

- **No new dependency.** `minPolarAngle`, `maxPolarAngle`, and `minDistance` are existing
  `OrbitControls` options already shipped inside the pinned `three` package; nothing new is
  installed.
- **The one content change (root name) goes through the same path as every other seed
  edit** — the existing `.strict()`, length-bounded zod schema in `schema.ts` — so it carries
  the same guarantees the original spec established: no unknown keys, no unbounded length,
  fails the build with the offending node named if it's ever malformed.
- **The root's label still renders as `textContent`, never `innerHTML`.** The centring change
  in §9.2 is a CSS transform and an opacity rule, not a new rendering path — the "seed
  content is data, never markup" rule from the original spec's security design is untouched.
- **No CSP impact.** Nothing here adds a font, a worker, or an external fetch.

Everything else in the original spec's security design (§8 of `ai-knowledge-graph-3d`'s
spec.md) continues to apply unchanged.

### 11. Verification

| # | Check | How | Pass |
| --- | --- | --- | --- |
| V-1 | Ring invariant | Unit test on `layout()`: every depth-1 node's position has the same distance-from-origin and the same elevation component, within a small epsilon | pass |
| V-2 | Even ring spacing | Unit test: adjacent depth-1 nodes' azimuth angles differ by `2π / N` within epsilon, regardless of `leafCount` | pass |
| V-3 | Hub-to-ring gap is wider | Unit test: the depth-1 shell radius minus the hub's own radius exceeds the radius increment used between any two later shells | pass |
| V-4 | Depth still increases outward | Unit test (carried over from the original spec, re-asserted here): every node's distance from the origin exceeds its parent's | pass |
| V-5 | Empty ring topic doesn't break layout | Unit test: a seed with a childless depth-1 node lays out without error and the node still receives a ring position | pass |
| V-6 | Camera cannot go overhead, underneath, or inside the ring | Manual: attempt to drag the camera to every extreme and attempt to scroll/pinch all the way in | camera stops short of vertical, stops short of horizontal-and-below, and stops at or outside the ring radius |
| V-7 | Opening view separates the ring topics | Manual: load the page fresh, confirm all four ring topics occupy distinct screen regions | pass, both themes, both a desktop and a tablet viewport |
| V-8 | Click frames parent and children | Manual: click each ring topic and at least one deeper node; after the fly-to tween settles, confirm the edge to the parent and all edges to children are visible in frame | pass |
| V-9 | Root reads as a labelled circle | Manual: confirm the root's label sits centred inside the circle, at full opacity from the default view and when zoomed to any distance | pass |
| V-10 | Tablet legibility (gates Q2/Q5, §3) | Manual, on an actual tablet-sized viewport: confirm the root label, ring labels, and truncated labels are legible at their set sizes | pass, or the truncation width and text size are revised before this is called final |
| V-11 | No regression on the original feature's suite | Re-run the `ai-knowledge-graph-3d` spec's V-1 through V-19 | all still pass — node/edge/draw-call counts, bundle size, CSP, and resource disposal are unaffected by this change |

---

## Areas of concern

**C-1 — Roughly a third of the ring's content is still unreadable by the newcomer this
whole piece of work is meant to serve.** Two ring topics are placeholder names ("n Node"
twice) and four labels underneath them read as notes-to-self rather than titles. This spec
fixes the *shape* of the graph — hub, ring, outward branches, a fenced camera — but ships
that content exactly as it stands today, same as the original graph spec did. **Resolved
here in the intent's favour: ship the reshape without waiting on the names.** The decision
needed from you: ask Nemanja to close this before or shortly after merge, because the
success criterion for *both* pieces of work — "a newcomer can read the picture" — stays
false for a third of the tree regardless of how good the shape looks.

**C-2 — Even ring spacing is a real judgement call the intent didn't make, and it changes
what the ring means.** Sizing each ring topic's slice to how much it holds was one live
option; giving every topic the same slice was the other. This spec takes the second option,
because an unlabelled difference in slice size risks being read as a size comparison nobody
told the viewer they were looking at — but "how much a topic holds" now only shows up in how
far and wide its branches spread *beyond* the ring, not in the ring itself. **The decision
needed from you:** confirm that's the reading you want, or ask for the ring to carry size
instead — in which case the ring stops being a clean, always-legible frame and needs its own
answer for how a viewer is told what the slice sizes mean.

**C-3 — The camera's new limits are exactly what was asked for, but they are also a real
loss of freedom compared to what already shipped.** The previous version let you fly
anywhere; this one deliberately doesn't, because the intent says plainly that the freedom
was the problem. Nothing here contradicts that. It's flagged only so the trade is visible
before merge rather than discovered as a surprise afterward: anyone who had gotten used to
exploring the graph freely will find that gone, permanently, by design.

**C-4 — The ring topic with nothing under it stays visibly lopsided, and this spec ships it
that way on purpose.** Waiting for content to fill it before shipping the shape fix would
tie a readability improvement to a content decision that has no deadline and no assigned
owner (§3, Q4/Q5). **Resolved here by shipping the shape now and treating the empty branch
as a normal case, not a bug.** The decision needed from you: are you comfortable with a
visibly uneven ring at launch, or does this need to wait on Nemanja adding something under
that topic first?

**C-5 — This spec specifies exact-sounding numbers before anyone has built or looked at
them, which is the very thing the intent's own history argues against.** The intent exists
because the *first* version of this page couldn't be judged on paper — it had to be built
and seen to find out it didn't read. This spec nonetheless commits to specific-sounding
choices — equal ring slices, a camera tilt range, a particular opening angle, a hub-to-ring
gap that's "wider" — before any of them has been seen on screen. Each is written as a rule
with a testable property (§11) precisely so it can be checked mechanically rather than
argued about, but the exact numbers behind those rules are, as the original spec's own
design already says of its constants, "tuning values, not invariants" — they're expected to
move once someone looks at the built result. **The decision needed from you:** treat this
spec's numbers as a first attempt, not a final answer, and expect a short "build it, look at
it" pass before calling the reshape done — the same step that produced this intent in the
first place.

---

## Amendments from the build

Stage 4 changed four things this spec asserted. Recorded here so the spec and the built
scene do not disagree, and so the next reader knows which parts were checked on screen
rather than reasoned about on paper — the distinction C-5 was written to protect.

- **A-1 — The opening framing is solved, not a constant (§9.4, §3 Q5).** A fixed multiple
  of the scene radius crops a portrait viewport, because the fov is vertical. Q5's design
  answer is now settled: the camera fits the actual content extent per screen axis, and
  V-10 passes at 820×1180 rather than being waived. Q5 still has no *owner* for future
  device questions.
- **A-2 — The camera fence needs an origin-relative clamp (§9.5).** `minDistance` alone is
  target-relative and leaves the hub's interior open after a focus. Measured: 6.2 from the
  origin without the clamp, 23.0 with it, ring radius 20.
- **A-3 — FR-8's truncation was new work (§9.6).** The shipped labels had no width bound.
- **A-4 — Label type size is 10px (§9.6).** Changed by the originator on review, with the
  declutter text metrics derived from the font size so the collision boxes keep matching
  what is drawn.

Two things this spec predicted that did *not* happen, recorded because they were the loudest
risks going in:

- Narrowing each ring topic's cone from ~92° to 40.5° did **not** crowd the deeper shells.
  The 148-node separation invariant passed unchanged; worst descendant deviation was 25.7°
  against the 40.5° limit.
- No verification item had to be weakened. V-1…V-5 and the FR-4 containment invariant were
  each confirmed to fail under a deliberate mutation before being trusted.
