# Spec: node labels sit under the circle, never on it

- **Intent:** [`intent.md`](./intent.md) — *node labels sit under the circle, never on it*
- **Originator:** Nemanja (product owner)
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** awaiting product owner and engineering review

## Review guide

This spec has two audiences, and it's split so each can stop where their job ends.

- **Product owner:** read **Part A** only. It has everything you need to approve, redirect, or
  cut a decision — what changes on screen, what's still open, and what could go wrong. No file
  names, code, or rendering mechanics appear in Part A; where a technical choice has a
  consequence you'd care about, it's stated as that consequence, with a pointer into Part B for
  anyone who wants the mechanics.
- **Engineering:** read Part A for the same context the product owner has, then Part B, which is
  where the build actually lives.
- **Both:** read **Areas of concern** at the end. Every item there is written so the product
  owner can act on it without reading Part B.

Section numbers run continuously across both parts, so a cross-reference like "see §9.1" always
points at the same place no matter which part you're in.

---

## Part A - Product

### 1. Summary

Today, a node's name is drawn just above whatever the camera happens to be looking at, with no
regard for the circle underneath it — so the text lands on top of the circle's own colour more
often than not, and the centre node's name is drawn *inside* its circle at all times. Either way,
a viewer is reading a word over a filled shape instead of reading the word and seeing the shape.

This spec moves every label to sit below its own circle instead, with clear air in between, at
every camera angle — including the centre node, which stops being a special case. The size of
that clear air is no longer one fixed amount for every node: it grows or shrinks with how big the
circle currently looks on screen, so a name never sits closer to a large circle than to a small
one just because both got the same fixed offset. This is a placement change only — which words
appear, how many can be on screen at once, their size, their colour, and how a long name gets cut
short are all untouched.

### 2. Scope

#### 2.1 In scope

- Every label moves from "above, sometimes overlapping" to "below, with visible air," at every
  camera angle, for every node including the centre.
- The centre node's name stops being drawn inside its circle and follows the exact same
  below-the-circle rule as every other node.
- The size of the air between a label and its circle is tied to how big that circle currently
  appears on screen, not to one fixed number shared by every node (§4, D-1).
- "Below" is measured on the screen, not in the 3D scene — a label stays directly under its
  circle as drawn, however the camera is turned, rather than swinging to the side as the view
  rotates.

#### 2.2 Out of scope

Restated from the intent, so nothing below is quietly folded into this piece of work:

- Type size, colour, and how a long name gets truncated. None of that changes — only where the
  already-decided text sits.
- What happens when two labels would collide with each other after moving. The existing rule —
  the less important one disappears, the centre and whichever node is currently focused first,
  then whichever is nearest the camera — is kept exactly as it works today (§6, C-1).
- How many names can be on screen at once. The same fixed limit applies, unchanged.
- Node shape, colour, edge styling, or how densely the graph is populated. The reference
  screenshot the originator provided is a reference for label placement only.
- No new capability is added to the page — nothing that wasn't visible before becomes visible,
  and nothing that was becomes hidden, except that the centre's name moves outside its circle.

#### 2.3 Deferred

- Nothing. The intent closed every open question itself before this spec was written (§3), and
  this spec does not open any new ones that need a future piece of work — only two small,
  confirm-or-cut design choices, both inside this same change (§4).

### 3. Decisions that close the open questions

All four questions the intent originally raised were put back to the originator and answered
before this spec was written; nothing about *what* to build was left for this document to decide.
They're restated here only because engineering builds from this document, not from the intent:

| # | Open question | Decision (from intent.md) |
| --- | --- | --- |
| Q1 | Does the air under a label scale with the node's size, or is it one fixed distance for every node? | Scales with the circle — a big circle pushes its name further down than a small one does. |
| Q2 | Does moving labels down need any new rule for what happens when two labels collide? | No — the existing rule (less important one disappears; centre and focused node first, then nearest the camera) is unchanged. |
| Q3 | Is "below" measured on the screen or in the 3D scene? | On the screen — the label stays straight down from its circle in the viewport, whatever the camera is doing. |
| Q4 | Does anything depend on the centre node's name being drawn inside its circle? | No — it moves out and follows the same rule as everything else. |

This spec's own job is to turn those four already-made decisions into a buildable design (Part
B) and to surface the small number of choices that had to be made *underneath* them, which the
intent didn't spell out (§4).

### 4. Decisions added beyond the intent

The intent settled the shape of the outcome but left two smaller choices for this spec to make.
Neither should be treated as settled just because it's written down — confirm or cut each one.

1. **The air under a label is measured live, off how big the circle looks on screen right now —
   not off one fixed number per node type (hub, group, or leaf).** This falls directly out of two
   decisions the intent already made together: "below" means below *on the screen* (Q3), and the
   gap has to track the circle's size (Q1). Put those two together and the only way to keep a
   label glued directly under its circle at every camera angle is to keep re-measuring how big
   that circle currently looks — which also means the gap visibly grows as you zoom in on a node
   and shrinks as you zoom out, continuously, matching however big the circle itself is growing or
   shrinking at that moment. **This is a visible side effect worth confirming you want**, since a
   label's distance from its own circle is no longer a fixed thing you could point to — it moves
   continuously with the camera, the same way the circle it belongs to does (§9.1).
2. **A small minimum amount of air is guaranteed even when a circle looks tiny on screen** (a
   distant or small node, seen from far away). Without a floor, the "air" the intent asked for
   could shrink toward nothing at the far end even though the label would still, strictly, not be
   touching the circle. **This is a value this spec introduces, not one the intent specified**,
   and the exact size of that minimum is a small tuning number, decided by looking at the built
   result rather than fixed on paper here (§6, C-2).

### 5. Functional requirements

Each of these is something you can point at on screen; verification is §11.

- **FR-1.** Every node's label is drawn below its own circle, with visible air between the text
  and the shape, at any camera angle.
- **FR-2.** No label ever overlaps the circle it names, at any camera angle — including the
  centre node's.
- **FR-3.** The centre node's name is drawn outside its circle, below it, exactly like every
  other node's name — it is no longer a special case.
- **FR-4.** The size of the air between a label and its circle is bigger for a bigger-looking
  circle and smaller for a smaller-looking one; it is not the same fixed distance for every node.
- **FR-5.** As the viewer moves the camera closer to or further from a node, the air under that
  node's label grows or shrinks to keep matching how big the circle currently looks — it does not
  stay fixed while the circle itself changes size on screen (§4, D-1).
- **FR-6.** A label stays directly beneath its circle as drawn on screen, at every camera angle
  and every orbit position — it never appears beside or above the circle, and never swings around
  to the side as the camera turns.
- **FR-7.** Type size, colour, and how a long name is cut short with an ellipsis are unchanged
  from today.
- **FR-8.** The fixed limit on how many labels can be on screen at once, and the rule for which
  label disappears when two would collide (the centre and the focused node are protected first,
  then whichever is nearest the camera), both continue exactly as they work today — nothing about
  *when* a label disappears changes, only *where* the surviving ones are drawn.

Checkable, in the intent's own words: open `/graph`, and at any camera angle no node's name
overlaps its own circle, and the centre node's name is outside its circle.

### 6. Risks

| Risk | Why it matters |
| --- | --- |
| **The centre node's label, now pushed below its (large) circle, can collide with a nearby ring topic's label in a way that never happened before** (§9.4; Areas of concern, C-1). | Today the centre's name sits inside its own circle and never competes for space with anything below it. Once it moves down like every other label, it can now land where a ring topic's label already sits — and because the existing "who wins" rule is kept unchanged (§2.2), the centre's label will always win that contest. A ring topic's name may now disappear in views where it used to be visible, purely because the centre's label moved. |
| **The exact size of the minimum guaranteed air (§4, D-2) is not fixed by this document** and is expected to be tuned by eye once it's built, the same way other on-screen spacing in this scene has been. | Until that pass happens, the literal number could look too tight or too generous on a real screen; this is flagged rather than guessed at (§6, C-2). |
| **The reference screenshot is for label placement only** — it also shows different node shapes, a different colour scheme, and a much denser graph than this app's. | A reviewer glancing at the reference and this app side by side may expect more to have changed than actually did; scope (§2.2) is explicit that only placement moves. |
| **Not yet checked on a small or portrait screen.** | The existing label-width limit in this scene already carries an open "check this on a tablet" caveat; this change touches the same label layer, so the same check should cover the new vertical placement at the same time, not as a separate pass later (§11, V-9). |

---

## Part B - Technical design

### 7. How this fits the existing app

This changes where a label is positioned and how the collision check reserves space for it. It
does not change what triggers a label to exist, what text it shows, how many can be on screen, or
anything about the rest of the scene. It adds no route, no dependency, no environment variable,
and no new server surface.

| File | Change |
| --- | --- |
| `src/app/graph/_components/graph-scene.tsx` | `updateLabels()` gains a per-node projected on-screen radius, computed from the node's existing world radius, its already-computed distance to the camera, and the camera's field of view (§9.1). That radius drives the new vertical offset passed to each label placement. The `centred` special case for the root node is removed — the root now goes through the same placement logic as everything else. |
| `src/app/graph/_components/graph-labels.tsx` | `LabelPlacement` drops the `centred` flag entirely. `declutter`'s collision box changes from "above, or centred on, the anchor" to "below the anchor" for every placement, using the new offset already baked into the `y` each placement carries in. `GraphLabels`' imperative `apply()` collapses to one transform branch instead of two. |
| `src/app/graph/_components/graph-labels.test.ts` | The existing "reserves the box on a centred label's own node" test is removed along with the `centred` flag it exercises; a new test covers the below-only box, and a new test confirms a node with a larger projected radius gets a larger reserved offset than one with a smaller projected radius at the same screen position (§11). |
| `CLAUDE.md` | The "Labels are 10px..." bullet under **Graph data** gains one sentence recording that placement is below the circle, scaled to the circle's on-screen size, and that the centre node is not an exception — so a future reader doesn't have to reconstruct that from the code the way this spec had to reconstruct the old behaviour. |

Nothing in `src/lib/graph/**` changes: node radius, position, and identity are already
framework-agnostic data the scene consumes (`src/lib/graph/types.ts`'s `GraphSceneNode`); this
spec only changes what the client does with the radius it already receives. No seed, schema, or
layout file is touched.

### 8. Non-functional requirements

- **No new dependency.** The added calculation is plain trigonometry using values the scene
  already has in scope (camera field of view, a node's existing world radius, and the
  camera-to-node distance already computed for the existing distance fade) — no labelling
  library, no new package.
- **No new DOM node per graph node.** The fixed pool of absolutely-positioned `<span>` elements
  (today, 24) is unchanged; this spec repositions what's already there.
- **No new per-frame cost of consequence.** The added work is one extra trig calculation per
  *labelled* node (today, at most 24), inside the label refresh that already runs at a throttled
  30 Hz (`LABEL_INTERVAL_MS`) rather than every render frame — not a new O(n) pass over the whole
  graph.
- **The render-on-demand model is unaffected.** The new calculation happens inside the existing
  `updateLabels()` call from `renderFrame()`; it introduces no new call to `invalidate()` and no
  new scheduled work, so it cannot become a source of the always-rendering loop the scene is
  built to avoid (CLAUDE.md, "The 3D scene renders on demand, not on a loop").
- **Accessibility posture is unchanged.** The label layer stays `aria-hidden` and
  `pointer-events: none`; this is a visual repositioning of content a screen reader was already
  not exposed to, so it neither improves nor worsens the scene's recorded accessibility debt
  (CLAUDE.md, "Accessibility of the scene is known, recorded debt").

### 9. Design

#### 9.1 Computing how big a circle currently looks on screen

`updateLabels()` already projects each labelled node's world position to a screen pixel
coordinate, and already computes the straight-line distance from that node to the camera (used
today for the distance-based fade). This spec adds one more number per labelled node: that same
node's world radius (`GraphSceneNode.radius`, already carried on every node — the three-way
hub/group/leaf value from `src/lib/graph/palette.ts`), converted to a radius **in screen pixels**
at the node's current distance.

The conversion reuses the exact relationship `overviewDistance()` already relies on elsewhere in
this file to fit the camera to the scene (CLAUDE.md, "The opening view is solved, not a
constant") — a `PerspectiveCamera`'s field of view is a vertical angle, so half the container's
pixel height corresponds to `distance * tan(fov / 2)` world units at a given distance. Inverting
that relationship gives pixels per world unit at that distance, and multiplying by the node's own
world radius gives its on-screen radius in pixels. This is not a new formula introduced for this
feature; it is the same trigonometry already in the file, run in the other direction.

This on-screen radius is what makes §4's D-1 true automatically: a hub (world radius 2.6) and a
leaf (world radius 0.42) at the same distance get proportionally different pixel radii, and the
*same* node gets a bigger pixel radius as the camera moves closer and a smaller one as it moves
away — there is no separate "hub gap" and "leaf gap" constant to keep in sync, only the one
calculation.

#### 9.2 From an on-screen radius to a label position

Today, every non-root label's anchor `y` is the node's projected screen `y`, and the vertical
offset is a fixed multiple of the label's own text height (`LABEL_HEIGHT * 1.9`), applied upward
via the CSS transform in `GraphLabels`. This spec replaces that fixed multiple with:

```
offset = projectedRadiusPx * (1 + GAP_RATIO)
```

clamped to a minimum of `MIN_GAP_PX` (§4, D-2) — two new tuning constants, sized by eye once
built, in the same spirit as the file's existing "tuning values, not invariants" constants
(`HOVER_SCALE`, `FOCUS_SCALE`, and others already documented that way at the top of
`graph-scene.tsx`). The label's anchor becomes `y + offset` (down, not up, on screen — pixel `y`
already increases downward in this coordinate system, so no sign flip is needed beyond dropping
the existing upward offset). The root node goes through this same calculation using its own
(larger) radius; the `centred: isRoot` branch is deleted, along with the `isRoot` check that fed
it. The existing `isRoot` check that keeps the root's label from ever fading with distance is
unrelated to position and is unchanged (§9.4).

#### 9.3 The collision box

`declutter`'s reserved box for each placement currently has two shapes — one for a label drawn
above its node, one for a label centred on it (the root's old special case) — because the box has
to match whatever `GraphLabels` actually draws (the code comment on `declutter` already states
this as load-bearing: the two must never disagree about where the text is). With the `centred`
case removed and every label now anchored at its own top edge (§9.2), the box collapses to one
shape for every placement: `top = y`, `bottom = y + LABEL_HEIGHT`, with `left`/`right` computed
exactly as today from the (unchanged) truncated text-width estimate. `GraphLabels`' transform
collapses the same way, from two branches (`-50%, -140%` / `-50%, -50%`) to one (`-50%, 0%`),
since `y` is now always the top of the text rather than sometimes the middle.

#### 9.4 What does not change

`selectLabelled`'s priority order (root and focused node first, then nearest the camera, depth as
the tie-break) is untouched — §2.2 and FR-8 require the existing collision *outcome* to keep
working exactly as it does today, and that rule lives entirely in `selectLabelled` and in
`declutter`'s box-overlap test, neither of which this spec changes in kind, only in the box shape
they operate on (§9.3). The distance-based opacity fade, the root's exemption from that fade, the
30 Hz label refresh throttle, the fixed 24-label pool, `LABEL_MAX_PX` truncation, font size,
colour, and the text halo are all unchanged.

### 10. Security

This is a pure repositioning of already-rendered, already-public text using data the scene
already holds (a node's own radius, position, and name). It touches no data flow, no dependency,
and no client/server boundary.

- **No new dependency.** The added calculation is plain arithmetic on numbers already in scope.
- **No new content path.** Label text is still written via `textContent`, never `innerHTML`
  (unchanged from the existing implementation); this spec adds no new place text reaches the DOM.
- **No CSP impact.** Nothing here adds a font, a worker, or an external fetch.

Everything else in the original scene's security design (`ai-knowledge-graph-3d`'s spec.md, §8)
continues to apply unchanged.

### 11. Verification

| # | Check | How | Pass |
| --- | --- | --- | --- |
| V-1 | No label overlaps its own circle at any camera angle, including the root | Manual, on the built page: orbit fully around the scene at several zoom levels | pass |
| V-2 | The root's name is outside its circle, below it, like every other node | Manual, on the built page | pass |
| V-3 | A node with a larger on-screen radius gets a proportionally larger reserved offset than one with a smaller on-screen radius at the same distance | Unit test on the new offset calculation (§9.1–9.2), isolated from the GPU | pass |
| V-4 | The same node's offset grows as its on-screen radius grows (camera moves closer) and shrinks as it shrinks (camera moves away) | Unit test: same world radius, two different simulated distances, confirm the resulting offset moves in the same direction as the on-screen radius | pass |
| V-5 | A very small or very distant circle still gets at least the minimum guaranteed gap (§4, D-2) | Unit test: a near-zero on-screen radius still produces `MIN_GAP_PX`, not a near-zero offset | pass |
| V-6 | Collision behaviour is unchanged in kind: the same pair of labels that collided before this change still collides, and the same one wins | Re-run the existing `declutter` and `selectLabelled` tests in `graph-labels.test.ts`, adjusted only for the new box shape (§9.3), not for the priority logic | pass |
| V-7 | No DOM node per graph node, and no new element beyond the existing fixed pool | Unchanged existing check on the label pool size | pass |
| V-8 | The root's label can newly suppress a ring-topic label that never used to be at risk (§6; Areas of concern, C-1) | Manual, on the built page: orbit to a view where a ring topic's label sits close beneath the root, confirm the outcome matches the existing "root wins" rule rather than both disappearing or both showing overlapped | matches the existing priority rule |
| V-9 | Vertical placement reads correctly on a small/portrait viewport, not only desktop | Manual, on a tablet-sized viewport, alongside the existing scheduled `LABEL_MAX_PX` tablet check (CLAUDE.md; intent §3 Q2/Q5 lineage in `ai-knowledge-graph-3d`'s spec) | pass |
| V-10 | No regression to the render-on-demand model | Manual, dev tools frame count: confirm the scene still renders zero frames while idle and the camera is not moving | pass |
| V-11 | No regression on the existing suites | Re-run `layout.test.ts`, `tree.test.ts`, `graph-view.test.tsx` | all still pass — none of them touch label placement |

---

## Areas of concern

**C-1 — The root's label, now placed below its circle like every other node's, can newly
collide with and suppress a nearby ring topic's label.** Before this change, the root's name sat
inside its own circle and never competed for on-screen space with anything else. This spec keeps
the existing "who wins a collision" rule completely unchanged, as the intent required (§2.2) — so
where the two labels now overlap, the root's always wins, exactly as the existing priority order
already says it should. **Resolved here by not adding any new collision rule** (§6, §9.4, §11
V-8) — the intent was explicit that none was wanted. **The decision needed from you:** accept that
a ring topic's name may now disappear in some views where it was visible before, purely because
the root's label moved, or say now if that specific case needs a rule the intent didn't ask for
(which would mean re-opening "no new collision behaviour," not just this spec).

**C-2 — The minimum guaranteed gap for a small or distant circle (§4, D-2) is a value this spec
introduces, and its exact size isn't fixed on paper here.** The intent asks for "visible air"
under every label; measured purely as a proportion of the circle's on-screen size, that air could
shrink toward nothing for a circle far from the camera, while still technically satisfying "does
not overlap." **Resolved here by adding a floor and treating its exact size as a build-then-look
tuning number**, the same way this scene's other spacing and scale constants are already handled.
**The decision needed from you:** confirm you want a guaranteed-visible floor at all — the
alternative is to let the air shrink toward nothing at the far end, which still passes the
intent's own literal checkable rule but may not match what "visible air" was meant to feel like
at every distance.

**C-3 — The gap now changes continuously as the viewer zooms, rather than being one fixed
distance you could point to for a given node.** This isn't a choice made independently of the
intent — it's the necessary result of combining two decisions the intent already made (§4, D-1):
"below" means below on screen, and the gap has to track the circle's size. But it is a visible
behaviour the intent's own wording didn't spell out in this much detail, since "the gap scales
with the circle" reads most naturally as "hub, group, and leaf each get their own fixed amount,"
not "the amount recalculates every frame." **Resolved here by recalculating continuously**, since
that is the only way to keep a label glued directly beneath its circle at every zoom level and
every camera angle at once (§9.1–9.2). **No decision needed from you today** — this is flagged so
the live-scaling behaviour isn't a surprise the first time someone zooms in and watches a label's
distance from its circle visibly change.
