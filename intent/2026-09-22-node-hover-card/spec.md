# Spec: show a node's title, assignee and status on hover

- **Intent:** [`intent.md`](./intent.md) — *show a node's title, assignee and status on hover*
- **Originator:** Nemanja Vasic
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** awaiting product owner and engineering review

## Review guide

This spec has two audiences, split so each can stop where their job ends.

- **Product owner:** read **Part A** and **Areas of concern**. Between them you have
  everything you need to approve, redirect, or cut a decision — what changes on screen,
  what's still open, and where this spec had to make a call in your name. No file names,
  code, schemas, or rendering mechanics appear in Part A; where a technical choice has a
  consequence you'd care about, it's stated as that consequence, with a pointer into
  Part B for whoever wants the mechanics.
- **Engineering:** read Part A for the same context the product owner has, then Part B,
  which is where the build actually lives, then **Areas of concern**.
- **Both:** every item in **Areas of concern** is written so the product owner can act on
  it without reading Part B.

Section numbers run continuously across both parts, so a cross-reference like "see §9.2"
always points at the same place no matter which part you're in.

---

## Part A - Product

### 1. Summary

Today, hovering a node in the graph tells you nothing the label doesn't already say —
you can see what a topic is called and how it connects to everything around it, but not
who is working on it or whether it's finished. This spec adds a small card that appears
next to a node when you point at it (or hold your finger on it, on a tablet), showing
that node's name, who owns it, and whether it's done — and a fourth row, "Open page",
that is visible on every card but doesn't do anything yet.

Who owns a topic and how far along it is are hand-written facts, authored in the same
committed file the topics themselves already live in, changed the same way — an edit and
a pull request. Nothing about how the graph itself looks changes: no node's colour, size,
or position shifts because of who owns it or how done it is. You only learn that by
pointing at the node.

### 2. Scope

#### 2.1 In scope

- A card that appears next to any node you hover, showing, in order: the node's own
  name, an **Assignee** row, a **Status** row, and an **Open page** row.
- Every node has a card, including ones nobody has recorded anything about — those read
  "Unassigned" and "Todo" rather than being blank or missing rows.
- The trigger is hovering with a mouse or trackpad on desktop, and holding a finger down
  on a node on a tablet. The card goes away when you stop hovering (desktop) or tap
  somewhere else (tablet) (§3, Q4).
- Assignee (a person's name, or none) and Status (exactly one of Todo, In Progress,
  Done) become two new hand-authored facts about a topic, alongside its name, in the
  same file and the same pull-request workflow topics already use.
- The "Open page" row is visible on every card, styled so it doesn't invite a click that
  goes nowhere (§3, Q1; §4).

#### 2.2 Out of scope

Restated from the intent, so nothing below is quietly folded into this piece of work:

- No connection to Jira, Linear, GitHub issues, or any other tracker. Assignee and status
  are typed by hand into the same file the topic names already live in.
- What "Open page" actually opens. That's a separate, future piece of work; this spec
  only ships the row.
- Any change to how the graph itself is drawn — colour, size, and position keep meaning
  exactly what they mean today. Status is not a fourth visual channel on the node itself;
  you only see it by hovering.
- Making the card available to someone who can't use a mouse or touchscreen — a
  keyboard user or a screen-reader user gets nothing new from this feature, the same way
  they get nothing from the graph today (§6; Areas of concern, C-4).
- Any tooling for authoring assignee/status beyond hand-editing the file — no admin
  screen, no bulk import.

#### 2.3 Deferred

- The destination "Open page" links to — explicitly the next piece of work, not this one.
- Whether assignee should become a fixed, validated list of team members instead of
  free text (§3, Q2) — this spec makes a call for now, but flags it as revisitable.
- Any richer "coming soon" treatment for the inert link, beyond the muted styling this
  spec specifies, if that styling doesn't read clearly enough once it's on screen (§3,
  Q1; §4).

### 3. Decisions that close the open questions

The intent left five questions open. This spec closes four of them with a reasoned
decision so the design isn't blocked; the fifth is not an engineering call to make and is
carried to **Areas of concern** instead of closed here.

One clarification before the table: the intent's own worked example shows the card's
first line reading "RAG (Retrieval-Augmented Generation)", but its "Proposed outcome"
section says the first line is "the node's own name." This spec follows the latter — the
title row is always exactly the node's existing name, the same string the label under
its circle already shows, with no separate long-form title authored anywhere. The
worked example is read as illustrative, not as a second field to add.

| # | Open question | Decision |
| --- | --- | --- |
| Q1 | Is an inert "Open page" link acceptable, or does it need a "coming soon" treatment? | Ships styled so it visibly does not look like a working link — muted, no underline, not clickable — rather than plain text that looks identical to an active link. That reads as "not built yet" without adding new wording (§4, D-3; Areas of concern, C-3). |
| Q2 | Free-text assignee, or a fixed list of team members? | Free text, validated the same light way a node's own name already is (non-empty, trimmed, length-capped) — not a fixed roster. A maintained roster is real added scope the intent's own "no external tracker" constraint argues against taking on here (Areas of concern, C-2). |
| Q3 | Does every node carry a status, including structural nodes like the hub and the ring topics? | Yes, uniformly, with no exceptions — every node, including the hub and every ring topic, defaults to Unassigned/Todo if nothing is authored. This is what the intent's own "Proposed outcome" already states in the same breath as raising the question, so it's treated as settled rather than re-opened (Areas of concern, C-5). |
| Q4 | What dismisses the card on tablet, and does it follow the node while the camera moves? | Dismiss: tapping anywhere else — empty space or a different node — or tapping the same node again. Follow: yes — the card stays glued to its node's on-screen position for as long as it's open, including while the camera is still settling right after the long-press ends, the same way a label already tracks its own node (§9.3). |
| Q5 | Are there names on this that shouldn't be committed to a public repo? | Not something this spec closes — it's a call about what's acceptable to publish, not a design or engineering question. Carried to **Areas of concern, C-1**, unresolved. |

### 4. Decisions added beyond the intent

The intent settled the shape of the outcome and, with §3 above, its own open questions.
This spec still had to make a small number of further calls to turn that into something
buildable. None of these should be read as settled just because they're written down —
confirm or cut each one.

1. **The card never appears while you're dragging to orbit or zoom the scene**, even if
   the pointer happens to pass over a node mid-drag. Today, moving the mouse over a node
   already makes it grow slightly whether or not a mouse button is held — that's a small,
   silent cue. A card popping up and getting in the way while you're actively turning the
   graph is a much bigger interruption, so this spec only shows the card when the pointer
   is genuinely idle over a node (§9.2). **This is a behaviour the intent didn't specify
   either way** — confirm it's the right call, or ask for the card to appear during a drag
   too.
2. **The Status row is plain text, not a colour-coded badge** (no green for Done, no
   amber for In Progress). The graph's palette is validated end to end for a fixed set of
   branch colours; adding a new semantic colour meaning "done" is a real palette decision,
   not a styling detail, and this spec doesn't make it. **This is a value this spec adds,
   not one the intent specified** — confirm plain text reads clearly enough, or ask for a
   colour treatment as a follow-up (which would need the same validation the branch
   colours already went through).
3. **The inert "Open page" row is muted and not clickable at all**, rather than a real,
   disabled-looking link or a link with different wording like "Open page (soon)". A
   control a viewer can click, tab to, or long-press that does nothing is worse than one
   that visibly isn't active yet. **Confirm this reads as "not built yet" rather than
   "broken" once it's on screen** — this is the kind of thing that is easy to get wrong on
   paper and obvious in five seconds on a real screen (Areas of concern, C-3).
4. **There's no artificial delay before the card appears** — it shows as soon as the
   pointer is idle over a node, matching how quickly the existing hover-grow effect
   already reacts. **This is a decision this spec is making, not one the intent asked
   for**, and it is the one most likely to need revisiting: if moving the mouse across a
   cluster of nearby nodes on the way to a target causes cards to flash on and off
   distractingly, the fix is a short delay before showing (not before hiding), added as a
   follow-up rather than guessed at now (§6).
5. **A very long assignee name is cut short with an ellipsis**, the same way an
   over-long node name already is under its label. The intent doesn't ask for this, but
   without some cap a long name could make the card wide enough to run off the edge of
   the screen on a narrow viewport. **Confirm this is an acceptable way to handle a long
   name**, or ask for the card to wrap onto a second line instead.

### 5. Functional requirements

Each of these is something you can point at, or tap, on screen; verification is §11.

- **FR-1.** Pointing at (hovering) any node with a mouse or trackpad raises a small card
  next to it.
- **FR-2.** The card always shows exactly four rows, in this order: the node's own name,
  **Assignee**, **Status**, **Open page**.
- **FR-3.** Assignee reads the name that was authored for that node, or "Unassigned" if
  none was.
- **FR-4.** Status reads exactly one of **Todo**, **In Progress**, or **Done** — never
  any other word — and reads **Todo** if nothing was authored.
- **FR-5.** "Open page" is present on every card, on every node, and does nothing when
  interacted with; it is visibly styled so it does not look like an active link (§3, Q1).
- **FR-6.** The card disappears as soon as the pointer stops hovering the node; moving
  from one node's hover straight to another's shows the second node's card, never both at
  once.
- **FR-7.** On a touchscreen, holding a finger down on a node raises the same card,
  without changing what a normal, quick tap on a node already does (it still centres the
  camera on that node, exactly as today).
- **FR-8.** On a touchscreen, the card disappears when the viewer taps anywhere else —
  empty space, or a different node — or taps the same node again.
- **FR-9.** The card stays positioned next to its node for the entire time it's open,
  including while the camera is moving (§3, Q4).
- **FR-10.** Hovering, long-pressing, or having a card open for a node never changes that
  node's own colour, size, or position, and changes nothing about how any other node is
  drawn.
- **FR-11.** While the viewer is dragging to orbit or zoom the scene, no card appears,
  even if the pointer passes over a node mid-drag (§4, D-1).

Checkable, in the intent's own words: open `/graph`, point at any node, and the card
described in the intent's Problem section appears next to it; move the pointer away and
it disappears.

### 6. Risks

| Risk | Why it matters |
| --- | --- |
| **Every visitor's browser receives every node's assignee and status, not just the ones they hover** (§10; Areas of concern, C-1). | The whole scene, including these two new fields, is baked into the page at build time the same way node names and positions already are — there is no per-hover fetch. Anyone who opens the page and reads the page's own data, without hovering anything, can see who is assigned to every topic. |
| **A typo'd assignee name ships silently.** Unlike a duplicate topic name, which fails the build today, a misspelled person's name is just a valid string (§3, Q2; Areas of concern, C-2). | Nothing catches it before it's live on the page, and it may not be noticed until someone who knows the name in question happens to see the card. |
| **The hub and every ring topic will show "Unassigned" / "Todo" by default**, since nobody is likely to author a status for a category rather than a piece of work (§3, Q3). | This may read as odd or as an oversight the first time someone hovers the hub itself, rather than as the deliberate "every node, no exceptions" decision it actually is. |
| **Rapid hover across a dense cluster of nodes could make cards flash on and off** in quick succession while the viewer is just moving the pointer toward something else (§4, D-4). | Nothing today produces a full card's worth of content on a fast hover pass — only a small scale change — so this is a new kind of visual noise, not a repeat of an existing one. |
| **The inert "Open page" row is new surface for a viewer to try to click**, and confusion is possible even with the muted treatment this spec specifies (§3, Q1; §4, D-3). | It's flagged rather than solved further, since the intent is explicit that building the real destination is out of scope for this piece of work. |
| **This narrows the accessibility gap the graph already carries, in the wrong direction.** The graph's inability to be used by keyboard or screen reader is known, separately tracked debt (`intent/2026-09-17-graph-accessibility/`) — until now it meant "you can't get a node's name any other way." After this ships, it also means "you can't get who owns it or whether it's done any other way" (Areas of concern, C-4). | Nothing here fixes that gap — this spec doesn't attempt to — but it does mean more information becomes unreachable that way, not the same amount. |

---

## Part B - Technical design

### 7. How this fits the existing app

This adds two hand-authored fields to the graph's data, a hover/long-press affordance to
the existing pointer handling, and one new small overlay component. It adds no route, no
dependency, no environment variable, and no server surface.

| File | Change |
| --- | --- |
| `src/lib/graph/types.ts` | `GraphSeed` gains two optional fields, `assignee?: string` and `status?: NodeStatus` (a new exported union type, `"Todo" \| "In Progress" \| "Done"`). `GraphNode` — and therefore `GraphSceneNode`, which extends it — gains `assignee: string` and `status: NodeStatus`, both always present: the default is resolved once, at build time, rather than left for every consumer to repeat. |
| `src/lib/graph/schema.ts` | `graphSeedSchema` (still `.strict()`, so an unrelated typo'd key keeps failing the build) gains `assignee` with the same non-empty/trimmed/length-capped rule already applied to `name`, and `status` as a `z.enum(["Todo", "In Progress", "Done"])`. Both stay optional at the schema level — the default is applied once the seed is flattened, not baked into the schema. |
| `src/lib/graph/tree.ts` | `flatten()`'s `walk()` defaults a missing `assignee` to `"Unassigned"` and a missing `status` to `"Todo"` for every node it visits, alongside the existing `leafCount`/`hasChildren` derivation — so every `GraphNode` this function produces always carries both fields, uniformly, including the hub and every ring topic (§3, Q3). |
| `src/lib/graph/scene.ts` | No change: `buildScene()` already spreads every `GraphNode` field onto the scene node it builds, so `assignee` and `status` reach `GraphSceneNode` for free once `tree.ts` produces them. |
| `src/app/graph/_components/graph-scene.tsx` | Pointer handling grows three things: (a) distinguishing an idle hover from a hover that happens mid-drag (§9.2), (b) detecting a touch long-press without changing what a quick tap already does (§9.2), and (c) a new per-frame position update for whichever node currently has its card open, alongside the existing `updateLabels()` (§9.3). |
| `src/app/graph/_components/node-hover-card.tsx` (new) | The card itself and its imperative show/hide/reposition handle, built from the existing `components/ui/card.tsx` primitives (§9.1, §9.4). |
| `src/app/graph/_components/node-hover-card.test.ts` (new) | Unit tests for the pure pieces — the long-press timing decision and the card's screen-position/edge-clamping math — isolated from the GPU and the DOM, the same way `graph-labels.test.ts` tests `labelOffsetPx` and `declutter` (§11). |
| `src/lib/graph/seed.ts` | Gains `assignee`/`status` on whichever topics the originator has real answers for today; every other node ships with neither field, and therefore reads Unassigned/Todo (§3, Q3). |
| `src/lib/graph/tree.test.ts` | Gains coverage for the new defaulting behaviour: a node with neither field flattens to `"Unassigned"`/`"Todo"`; a node with both keeps what it authored. |
| `CLAUDE.md` | The "Graph data" section's note that "`status`, `assignee` and page links are deliberately not reserved — they arrive when those features do" is updated: `status` and `assignee` have now arrived, with a pointer to this spec, the same way every other graph-data decision documents itself there. |

Nothing in `src/lib/graph/layout.ts`, `colour.ts`, or `palette.ts` changes: this spec adds
data that rides alongside a node's existing identity, not anything that feeds position,
colour, or size (FR-10).

### 8. Non-functional requirements

- **No new dependency.** The card is built from the already-generated
  `components/ui/card.tsx`; no new package is installed and no new `shadcn` component is
  generated (§9.1 explains why the shadcn-generated hover-card/popover primitives aren't
  the right fit here). Touch handling uses the standard Pointer Events API already in use
  elsewhere in this file (`PointerEvent`, `event.pointerType`) — no separate
  gesture-recognition library.
- **No new DOM node per graph node.** Unlike the label layer's fixed pool of 24 elements
  (one per node that might be labelled at once), only one card is ever open at a time, so
  this adds exactly one overlay subtree, shown or hidden, never 150 of them.
- **No new per-frame cost of consequence.** At most one extra node's screen position is
  recomputed per frame — only while a card is actually open — reusing the exact
  projection arithmetic `updateLabels()` already performs for every labelled node, inside
  the same throttled/exempted update pass (§9.3).
- **The render-on-demand model is unaffected.** Showing, hiding, and repositioning the
  card happens inside the existing frame-driven update path; it introduces no independent
  timer and no new source of `invalidate()` beyond the pointer events that already call it
  today for the existing hover scale-bump (CLAUDE.md, "The 3D scene renders on demand,
  not on a loop").
- **No new client-side store.** Per CLAUDE.md's state table, which node's card is open
  (if any) is one component's own transient UI state, tracked the same way `focusedId`
  already is — a ref for the imperative loop to read, mirrored into `useState` only where
  something needs to re-render because of it. Not Zustand, not React Query: nothing here
  is server state or persisted UI state.
- **Accessibility posture is carried forward, not silently absorbed.** The card layer
  follows the same posture the label layer already has — invisible to a screen reader,
  unreachable by keyboard — but unlike the labels spec, this is flagged rather than
  treated as a neutral repositioning, because the *content* newly hidden this way (who
  owns a topic, whether it's done) is new, not just relocated (Areas of concern, C-4).

### 9. Design

#### 9.1 Why this is a hand-positioned overlay, not a generated hover-card component

`components/ui/**` would normally be extended by generating a new primitive
(`npx shadcn@4.21.0 add hover-card`) rather than hand-building one. That's the right
default when a trigger is a real DOM element a viewer's pointer or focus can land on. It
isn't the right fit here: a node is a WebGL mesh instance found by ray-casting against
`nodeMesh` (`pick()`, already in `graph-scene.tsx`), not a DOM element — there is no
`<div>` a hover-card or popover library's trigger could attach a listener to. This is
exactly the same reason the existing label layer (`graph-labels.tsx`) doesn't use any
tooltip or annotation library today: it's a single absolutely-positioned overlay, shown,
hidden, and moved imperatively through a ref handle, in step with the WebGL scene it
annotates. This card follows the identical pattern — `NodeHoverCardHandle`, alongside the
existing `GraphLabelsHandle` — built from `Card`/`CardContent` (`components/ui/card.tsx`)
for its chrome, so it still inherits every brand and token decision already made for
cards elsewhere in the app.

Unlike the label pool, this overlay needs real pointer interaction of its own: the
eventual "Open page" link has to be clickable, so — unlike `GraphLabels`' wrapping
`pointer-events-none` layer — this component's root element allows pointer events. It is
mounted as its own sibling layer inside the existing `.graph-space` container (already
`position: relative`), after `GraphLabels` in paint order, so it sits visually above both
the canvas and the label layer.

#### 9.2 Trigger: hover, drag-suppression, and touch long-press

`onPointerMove` already tracks `hoveredIndex` for the existing scale bump, regardless of
whether a pointer button is held — today that's harmless, because the only visible
effect is a small, silent grow. This spec adds a second, narrower notion: *idle* hover,
true only when the pointer is over a node **and** no button is currently pressed
(`pressedAt === null`, a state this file already tracks for click-vs-drag
disambiguation). The card opens only on idle hover and closes the instant idle hover ends
— whether because the pointer left the node, or because a button went down and a drag
may have started (§4, D-1; FR-11).

Touch introduces a second trigger. `onPointerDown` already records `pressedAt`; this spec
adds a timer, started only when `event.pointerType === "touch"`, that fires after a fixed
`LONG_PRESS_MS` (a tuning value, sized by eye once built, in the same spirit as this
file's other tuning constants like `HOVER_SCALE`). If the pointer moves past the existing
`CLICK_SLOP_PX` or releases before the timer fires, the timer is cancelled and the
existing tap-to-focus behaviour is untouched (FR-7). If the timer fires first, the card
opens for the node under the pointer, and the gesture is marked consumed so the
`pointerup` that eventually follows does not *also* call `focusNode()` — a long-press
opens the card, it does not open the card and then focus the camera. The canvas already
sets `touchAction: none`, which is what stops the platform's own long-press/callout
gesture from competing with this one; this spec adds an explicit `contextmenu`
suppression on the canvas as a second line of defence against the same platform gesture,
since `touch-action` alone does not reliably suppress it on every mobile browser.

Dismissal (FR-6, FR-8, §3 Q4): on desktop, the card closes the moment idle hover ends,
*except* that moving the pointer directly onto the card itself (to reach "Open page")
keeps it open — the open condition is "idle-hovering the node, or hovering the card",
tracked via the card element's own `pointerenter`/`pointerleave`, exactly two DOM
listeners on one element. On touch, there is no equivalent "hovering the card" state, so
dismissal is exactly what §3's Q4 decision says: a tap elsewhere, or a second tap on the
same node.

#### 9.3 Following the node: position and layout

While a card is open, its anchor node's on-screen position is recomputed every frame
inside the same pass `updateLabels()` already runs — reusing the exact projection and
"radius as currently drawn" (hover/focus scale included) values that function already
computes for every labelled node, so this adds no new trigonometry and no new per-frame
concept. This recompute is subject to the same `LABEL_INTERVAL_MS` throttle, and the same
exemption from it while the camera is moving, that the label layer already has — so the
card tracks its node exactly as tightly as a label does during a fly-to or an orbit,
including the damping tail right after a long-press ends (FR-9, §3 Q4).

Unlike a label, the card's content is variable-width (an assignee's name has no fixed
length) and sits beside the node rather than under it, so it needs its own placement
rule: offset horizontally from the node's projected point by a gap proportional to that
node's on-screen radius (the same relationship `labelOffsetPx` already expresses
vertically for labels), defaulting to the right and flipping to the left if the card
would run past the container's right edge, then clamped vertically to stay fully inside
the container on either axis. This needs the card's own rendered width up front rather
than a live layout read every frame — consistent with this scene's existing avoidance of
per-frame DOM measurement — so the card is given a fixed maximum width (a new constant,
sibling to `LABEL_MAX_PX`), and any assignee name or title longer than that width is cut
short with an ellipsis (§4, D-5), the same visual treatment a long node name already gets
under its label.

#### 9.4 Content and visual treatment

The card is built from `Card` and `CardContent` (`components/ui/card.tsx`), so it
inherits the small radius, hairline ring border, and background/foreground tokens every
other card in the app already uses — no new chrome is invented. Row text uses the
existing role tokens: the node's name as the card's title, "Assignee" and "Status" as
muted-foreground labels beside foreground-coloured values, matching how label/value pairs
already read elsewhere in the app. The Status row is plain text (§4, D-2) — no new
semantic colour is introduced for Todo/In Progress/Done, keeping this feature inside the
already-validated palette rather than opening a new one.

"Open page" (FR-5) is rendered as static, styled text — not a real `<a>` or `<button>` —
at reduced opacity with no underline and no hover state, so it is not a focusable dead
end (a control a keyboard user could reach that does nothing would be a worse outcome
than one that isn't reachable at all) while still visually reading as a link-shaped
fourth row. It becomes a real link only when the page it points to exists, which is
explicitly the next piece of work (§2.2).

#### 9.5 What does not change

Node colour, size, and position (`assignColours`, `layout.ts`, `palette.ts`) are
untouched — this spec adds data that rides alongside a node's identity, not anything
that feeds the picture itself (FR-10). The existing click-to-focus gesture, the existing
hover scale-bump, the label layer, and the camera's own fencing and framing are all
unchanged in kind; this spec only adds a second, narrower reading of "hover" (§9.2) and
one new overlay that reacts to it.

### 10. Security

This adds two more hand-authored, build-time strings per node to a page that already has
no server action, no API route, no environment variable, and no runtime network request.
The security posture is otherwise identical to the base graph feature
(`ai-knowledge-graph-3d`'s spec, §8), carried forward rather than restated in full:

- **No new dependency.** The card reuses the already-generated `components/ui/card.tsx`;
  no package is added (§8, §9.1).
- **Seed content stays data, never markup.** `assignee` is committed, PR-reviewed content
  subject to the same `.strict()` schema and length/whitespace rules as `name`; it is
  rendered as React text, never through `dangerouslySetInnerHTML` or `innerHTML` — the
  same rule the base spec's §8.2 already establishes for every other piece of seed
  content, with no exception carved out for these two new fields.
- **No CSP impact.** No new script, style, or font source is added.
- **A deliberate, scoped reversal of a previously stated privacy property, not a silent
  regression.** The base spec's §8.5 states plainly that the graph "holds topic names
  only — no assignees, no contributors, no personal data." This feature is exactly that:
  assignees, added on purpose. It is called out here rather than left as a quiet
  contradiction of an earlier design document, and carried to **Areas of concern, C-1**
  as a decision that needs the product owner's sign-off, not just engineering's.
- **The exposure is build-wide, not hover-scoped.** `assignee` and `status` reach the
  client the same way every other node field already does — baked into the one scene
  payload the Server Component hands the client at build time (`buildScene()`,
  `src/lib/graph/scene.ts`) — so every visitor's browser holds every node's assignee and
  status the moment the page loads, whether or not that visitor ever hovers that node.
  There is no mechanism by which this feature could show assignee data only to whoever
  triggers the hover; anyone who reads the page's own JavaScript sees all of it (§6;
  Areas of concern, C-1).

### 11. Verification

| # | Check | How | Pass |
| --- | --- | --- | --- |
| V-1 | Hovering any node with a mouse raises a card showing all four rows, in order, with the node's own name as the title | Manual, on the built page | pass |
| V-2 | A node with no authored assignee/status shows "Unassigned" and "Todo" | Manual, on a node deliberately left blank in the seed | pass |
| V-3 | The card disappears the instant the pointer leaves the node (and isn't over the card itself) | Manual | pass |
| V-4 | Moving the pointer directly from one node to another swaps the card's content; both are never shown at once | Manual | pass |
| V-5 | Holding the pointer down and dragging to orbit never shows a card, even when the drag path crosses a node | Manual, with mouse-drag orbiting | pass |
| V-6 | On a touch-capable device, a quick tap on a node still focuses the camera on it exactly as before; a long-press on a node shows the card instead, without also focusing the camera | Manual, on a real or emulated touchscreen | pass |
| V-7 | On touch, tapping elsewhere (empty space or another node) or tapping the same node again closes an open card | Manual, on touch | pass |
| V-8 | The card stays glued to its node's on-screen position throughout a camera move, including the damping tail after a long-press ends | Manual, orbit/zoom while a card is open | pass |
| V-9 | The card's horizontal placement flips side, and stays fully inside the viewport, when its default side would run off the edge | Unit test on the placement/clamping function, isolated from the GPU (§9.3) |  pass |
| V-10 | A very long assignee name is cut short with an ellipsis rather than widening the card indefinitely | Unit test, same function as V-9 | pass |
| V-11 | A node with neither field flattens to `"Unassigned"`/`"Todo"`; one with both keeps what was authored | Unit test in `tree.test.ts` | pass |
| V-12 | An unrelated typo'd key in the seed (e.g. a misspelled `assignee`) still fails the build, the same way any other unknown key does today | Existing schema `.strict()` behaviour, exercised with the new fields present | pass |
| V-13 | No node's colour, size, or position changes as a result of this feature | Re-run `palette.contract.test.ts` and `layout.test.ts` unchanged — neither touches this feature's data | all still pass |
| V-14 | No regression to the render-on-demand model | Manual, dev-tools frame count: the scene still renders zero frames while idle and no card-related timer fires when nothing is open | pass |
| V-15 | No regression on the existing suites | Re-run `tree.test.ts`, `graph-labels.test.ts`, `graph-view.test.tsx` | all still pass |

---

## Areas of concern

**C-1 — Every visitor's browser now receives every node's assignee, not just the ones
they hover, and this directly reverses a privacy property the base graph spec stated on
the record.** The `ai-knowledge-graph-3d` spec's §8.5 says plainly: "the graph holds
topic names only — no assignees, no contributors, no personal data." This feature adds
exactly that, by design, because the intent asks for it. **Resolved here by carrying the
exposure forward honestly rather than quietly updating that earlier claim** (§10) — the
whole scene, including these two new fields, ships to every visitor at build time,
regardless of whether they ever interact with the node in question. **The decision needed
from you:** confirm that publishing a colleague's name this way — to anyone who can load
`/graph`, not just people who go looking for it — is acceptable, matching the intent's
own framing that this is "not regulated, but personal data, in git history for good" —
and now also in the client bundle, for good, for every visitor. If the answer is no for
some or all names, engineering needs a different instruction before any real name goes
into the seed (this overlaps with Q5 below, which is the same underlying question from a
different angle).

**C-2 — A misspelled assignee name will ship to production without failing the build,**
unlike a duplicate node name, which already does. This spec chose free text over a fixed,
validated roster of team members (§3, Q2) because a roster is meaningfully more scope
than this piece of work asked for — a list to create and keep current, and a build
failure the day a real new teammate isn't on it yet. **Resolved here by accepting that
trade** rather than building the roster. **The decision needed from you:** confirm that
trade is acceptable, or ask engineering to build the fixed-list version instead, which is
safer against typos but is real additional scope beyond what this spec covers.

**C-3 — The inert "Open page" row could still read as broken rather than "not built
yet," even with the muted, non-interactive treatment this spec specifies** (§3, Q1; §4,
D-3). This is the kind of judgment call that is easy to get wrong on paper and obvious
once it's actually on a screen. **Resolved here by choosing the plainest option** —
visually muted, not clickable, no extra wording — rather than adding a "coming soon"
label that the intent didn't ask for. **The decision needed from you:** look at it once
it's built, and say whether it needs the more explicit treatment the intent's open
question raised as an alternative.

**C-4 — This feature makes the graph's known accessibility gap wider, not just
unchanged.** The graph's inability to be used by keyboard or screen reader is
pre-existing, tracked debt (`intent/2026-09-17-graph-accessibility/`, opened by the base spec on
purpose, not by accident). Before this feature, that gap meant a keyboard or screen-reader
user couldn't get a node's *name* any way but reading the page's static chrome. After this
feature, the same gap also means they can't get who owns a topic or whether it's done —
new information becomes unreachable to them, not just the same information delayed.
**Resolved here by not attempting to fix it inside this piece of work** — that is
explicitly separate, already-scoped work, and folding it into this spec would blow well
past what the intent asked for. **The decision needed from you:** confirm it's acceptable
to ship this widening now, with the existing accessibility work still separately queued
and not accelerated, or say if this specific consequence changes that work's priority.

**C-5 — The hub and every ring topic will show "Unassigned" / "Todo" by default**, since
they're categories rather than pieces of work, and nobody is likely to author a status
for "AI Agents" the way they would for "pgvector" (§3, Q3). This isn't a choice made
independently — it falls directly out of applying the intent's own "every node has a
card" statement without carving out an exception the intent didn't specify one for.
**Resolved here by applying the rule uniformly**, since a silent exception for structural
nodes is its own kind of surprise, arguably a worse one. **No decision needed from you
today** — this is flagged so "Unassigned / Todo" on the hub itself isn't mistaken for a
bug the first time someone hovers it.
