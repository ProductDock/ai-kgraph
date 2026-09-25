# Spec: show the team's progress on the graph

- **Intent:** [`intent.md`](./intent.md) — *show the team's progress on the graph*
- **Originator:** Nemanja
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** awaiting product owner and engineering review

## Review guide

This spec has two audiences, split so each can stop where their job ends.

- **Product owner:** read **Part A** and **Areas of concern**. Between them you have
  everything you need to approve, redirect, or cut a decision — what appears on screen,
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

Right now the only way to tell how far along the learning graph is, is to hover or
long-press one topic at a time and read its status off a card. Nobody can look at `/graph`
and answer "how much of this have we done" — the picture never says anything about
progress on its own.

This spec adds a small "Statistics" panel, visible in the corner of the 3D view the moment
`/graph` opens, that answers exactly that: how many topics there are in total, how many are
Done, how many are In Progress, and a bar showing the Done share filled in with the In
Progress share beside it. Every topic on the graph counts toward these numbers except the
hub itself — the graph's one node that isn't really "a topic" so much as the thing every
topic hangs off, and which can never itself be marked Done (§9.1). The numbers describe the
whole graph, always — clicking, hovering, or flying to any one topic never changes them.

Nothing about marking a topic Done changes: that is still a hand-authored fact, changed the
same way it already is today (an edit to the same file, a pull request), which
`node-hover-card` shipped. This spec only adds a second, summarized reading of statuses
that already exist, alongside the per-topic reading a hover card already gives.

### 2. Scope

#### 2.1 In scope

- A "Statistics" panel, shown in the top-right corner of the 3D graph view, open by
  default, on every device the graph already supports.
- Three pieces of information: the total number of topics (hub excluded), how many are
  Done, and how many are In Progress — each as a count, and Done/In Progress each also as a
  share of the total. A two-segment bar shows the same Done/In Progress shares visually.
- A way for the viewer to collapse the panel out of the way of the 3D view, and expand it
  again; if they collapse it, it stays collapsed for them the next time they open `/graph`
  in the same browser (§4, D-5).
- The panel counts every topic except the hub — ring topics and group topics (ones with
  other topics under them) included, exactly as the intent asks.

#### 2.2 Out of scope

Restated from the intent, so nothing below is quietly folded into this piece of work:

- No "Edges" row — it was in the original mockup and said nothing about progress.
- No separate "Todo" row — Todo is only ever the leftover, unfilled part of the bar.
- No new way of recording status. This reads the same per-topic status
  `node-hover-card` already records; nobody types anything new for this feature.
- No live or pushed updates. The numbers are exactly as fresh as the rest of the graph
  already is — see the consequence stated in D-4 below.
- No keyboard or screen-reader access to the panel. It's visual-only chrome over the 3D
  view, held to the same known, already-accepted accessibility debt the rest of that view
  carries (`intent/2026-09-17-graph-accessibility/`), not the WCAG 2.2 AA bar the rest of the page
  meets.

#### 2.3 Deferred

- Whatever the other, still-undefined thing planned for this same corner turns out to be,
  and exactly how the two stack once it exists (§3; Areas of concern, C-1).
- Any real-time or near-real-time refresh of the numbers, should build-time freshness turn
  out not to be good enough in practice (§4, D-4; Areas of concern, C-2).

### 3. Decisions that close the open questions

The intent left one open question. It is not an engineering call to make on its own —
it depends on a second, unbuilt feature nobody working on this spec can specify — so this
spec does not close it. Instead, it designs so the answer can slot in later without a
rebuild: the panel is positioned as the first item in a shared, stacking corner rather than
pinned to an exact spot, so whatever the other thing turns out to be can be added below (or
above) it instead of colliding with it (§9.2).

| # | Open question | Status |
| --- | --- | --- |
| Q1 | What is the other thing planned for the top-right corner? Its size and whether it collapses affect how the two stack. | **Not closed.** Carried to **Areas of concern, C-1**, with a stacking approach designed to absorb the answer whenever it arrives, rather than a guess at what that answer is. |

### 4. Decisions added beyond the intent

The intent settled the shape of the outcome and flagged a couple of its own points as
assumptions rather than firm requirements (marked `[assumed]` in `intent.md`). This spec
turns those, plus a small number of further judgment calls needed to make the outcome
buildable, into explicit decisions. None of these should be read as settled just because
they're written down — confirm or cut each one.

1. **The status behind these numbers has no new source — it is exactly the per-topic
   status `node-hover-card` already records**, confirming the intent's own `[assumed]`
   note. No tracker integration, no second place to mark something Done.
2. **The "Nodes" count and the Done/In Progress percentages all share the same total: every
   topic except the hub.** The intent says the hub is excluded "so 100% can actually be
   reached" — that only holds if the total itself excludes the hub too, so this spec applies
   that exclusion everywhere a topic is counted, not only in the Done/In Progress shares.
   **This is a reading of the intent, not something it stated in so many words — confirm
   it**, or ask for the hub to be counted in the total (but never as capable of being Done),
   which would mean 100% is never reachable.
3. **In Progress gets a percentage of its own, shown the same way Done's is** ("count/total
   (percent%)"), not just a bare count. The intent only worked through the number for Done;
   this spec treats In Progress the same way for consistency, since it's already tracked
   for the bar. **Confirm this reads as useful rather than as clutter**, or ask for In
   Progress to show as a count only.
4. **The panel's numbers only change when the site is next rebuilt and redeployed after a
   status is merged — never while someone already has `/graph` open, and never on a fixed
   schedule in between.** The intent's own wording ("the panel's numbers go up to match")
   is marked `[assumed]`, and this spec resolves the ambiguity toward the simplest option:
   the same build-time freshness every other fact on the graph already has (a topic's name,
   its position, its own status on its hover card) rather than adding any live-refresh
   mechanism. **This is the decision in this spec most likely to need revisiting** if
   "how much have we done" is expected to feel current the moment a PR merges, not the next
   time the site happens to redeploy (§7, §9.1; Areas of concern, C-2).
5. **Collapsing the panel doesn't make it disappear outright** — a small header stays
   visible with a way to expand it again, so a viewer who collapses it can always find their
   way back without having to remember where it was or reload the page. **Confirm this is
   the right trade against a fully-hidden panel** that would leave more of the corner free
   but nothing on screen hinting the feature exists once it's dismissed once.
6. **Done and In Progress are drawn as two shades of the site's one blue accent colour** —
   a darker fill for Done, a lighter one for In Progress, on an otherwise empty track —
   rather than a green "done" / amber "in progress" treatment. The graph already reserves
   colour to mean "which branch a topic is in," and green/amber read as a health or
   severity signal elsewhere in software generally; this spec keeps this bar reading as
   "how full," not "how healthy" (§9.3). **Confirm this is legible enough on its own** once
   built — it leans more on the numbers beside the bar than a chart with a legend normally
   would, since the two segments are shades of one hue rather than two separate colours.

### 5. Functional requirements

Each of these is something you can point at, or tap, on screen; verification is §11.

- **FR-1.** Opening `/graph`, on any device the graph already supports, shows a
  "Statistics" panel in the top-right area of the 3D view, open by default.
- **FR-2.** The panel shows the total number of topics on the graph, not counting the hub.
- **FR-3.** The panel shows how many of those topics are marked Done, as a count and as a
  percentage of the total (rounded to the nearest whole percent).
- **FR-4.** The panel shows how many of those topics are marked In Progress, the same way
  (§4, D-3).
- **FR-5.** The panel shows a single bar with two filled segments — a Done segment sized to
  the Done share, and a visually lighter In Progress segment beside it sized to the In
  Progress share — with the remainder left unfilled. There is no separate row or segment
  for Todo.
- **FR-6.** There is no "Edges" row anywhere on the panel.
- **FR-7.** The numbers and the bar describe the whole graph at all times. Clicking a
  topic, hovering one, or the camera flying anywhere never changes any number or the bar.
- **FR-8.** The viewer can collapse the panel to a small header, and expand it again from
  that same header, without leaving the page (§4, D-5).
- **FR-9.** If a viewer collapses the panel, reopening `/graph` in that same browser later
  shows it collapsed; a first-time visitor, or the same viewer in a different browser or
  device, always sees it open.
- **FR-10.** Collapsing or expanding the panel, and the panel simply being on screen, never
  interrupts orbiting, dragging, clicking a topic, or the existing hover/long-press card —
  all of that keeps working exactly as it does today, including right next to the panel.
- **FR-11.** Marking a topic Done (or any other status change) and merging that change
  only changes the panel's numbers the next time the site is rebuilt and redeployed — never
  instantly, and never in a tab that was already open before the change (§4, D-4).
- **FR-12.** The panel shares the top-right corner with whatever else ends up placed there,
  stacking beside it rather than overlapping it or forcing it elsewhere (§3; Areas of
  concern, C-1).

Checkable, in the intent's own words: open `/graph`, and a "Statistics" panel is visible in
the top-right corner showing the node count, a Done row, an In Progress row, and a
two-segment progress bar — with no Edges row and no separate Todo row.

### 6. Risks

| Risk | Why it matters |
| --- | --- |
| **A group topic can be marked Done independently of the topics under it.** The intent explicitly counts group topics the same as any other, so a parent can read Done while children under it still read Todo (§9.1). | The overall percentage can look further along than a viewer would expect once they actually open that branch and see unfinished topics beneath a "Done" one — this is a direct, accepted consequence of the intent's own scope, not something this spec introduces, but worth being aware of before the first release. |
| **The panel sits over part of the 3D view, in a spot a node could render under at some zoom levels or camera angles.** | While the panel is open, a topic that happens to land under it is harder to reach with the pointer in that exact spot — collapsing the panel clears it, but a viewer may not realize that's why a click there didn't land on a node. |
| **Numbers can visibly lag reality** for as long as a merged status change hasn't gone through a rebuild and redeploy yet (§4, D-4). | Someone who just merged their own topic as Done, then immediately checks `/graph` in an already-open tab, will not see it reflected until they reload after the next deploy — this could read as the feature being broken rather than working as designed. |
| **The collapsed/expanded preference lives only in the viewer's own browser.** It doesn't follow them to a different browser or device, and clearing site data resets it to open. | Someone who collapses the panel on their laptop will see it open again the first time they check the graph on their phone, which may be read as the preference "not sticking" rather than as it being scoped per browser on purpose. |
| **What else lands in this corner is still unknown** (§3, Q1). | Until that's specified, there's no way to verify the stacking this spec designs for actually reads well next to it — this is designed to absorb an unknown, not to have already been checked against it (Areas of concern, C-1). |

---

## Part B - Technical design

### 7. How this fits the existing app

This adds one small, pure data-derivation function, one new client component, one small
new store, and a few lines wiring all three into the graph's existing render path. It adds
no route, no dependency, no environment variable, no server surface, and no change to the
seed schema or the content schema — the status this feature counts already exists, courtesy
of `node-hover-card`.

| File | Change |
| --- | --- |
| `src/lib/graph/types.ts` | New exported interface `GraphStats`: `totalTopics`, `done`, `inProgress` (all `number`). `GraphScene` gains a `stats: GraphStats` field, alongside the `nodes`/`edges`/`radius` it already carries. |
| `src/lib/graph/stats.ts` (new) | `computeGraphStats(nodes: readonly GraphSceneNode[]): GraphStats` — a pure function, framework-agnostic like the rest of `lib/graph`. Filters out the one node with `parentId === null` (the hub — the same test `graph-scene.tsx` already uses to find it), then counts the rest by `status` (§9.1). Guards the zero-node case (an empty or hub-only tree) rather than dividing by zero — the percentage math lives in the panel component, not here, so this function only ever returns plain counts. |
| `src/lib/graph/scene.ts` | `buildScene()` calls `computeGraphStats()` on the node array it already builds, and adds the result as `stats` on the object it returns. No new parameter, no new caller-visible behaviour beyond the extra field. |
| `src/lib/graph/stats.test.ts` (new) | Unit tests against the frozen fixture tree in `src/lib/graph/__fixtures__/` (never the live seed, per CLAUDE.md's testing rule): a mix of Done/In Progress/Todo topics counts correctly, the hub is excluded regardless of its own status, and a tree with only a hub returns all-zero counts rather than throwing. |
| `src/stores/graph-stats-store.ts` (new) | A small Zustand store, `useGraphStatsStore`, holding exactly one piece of state: `collapsed: boolean`, plus `setCollapsed`. Per CLAUDE.md's state table this is client UI state (a sidebar-style collapse, not server data), so it's Zustand, not `useState` in the panel component alone — the same category `useUiStore`'s theme flag already sits in, kept as its own store rather than folded into that one because it is unrelated state (§9.4). |
| `src/app/graph/_components/graph-stats-panel.tsx` (new) | The panel itself: reads `stats` as a prop, reads/writes `useGraphStatsStore` for its collapsed state, and renders the rows and the bar. Built from `components/ui/card.tsx`, the same primitive `node-hover-card.tsx` already uses, so it inherits the same radius/border/surface tokens rather than inventing new chrome (§9.3). |
| `src/app/graph/_components/graph-stats-panel.test.tsx` (new) | Renders the panel with hand-built `GraphStats` values and asserts the row text, the percentages, and the bar segment proportions; asserts the collapse toggle's behaviour against a mocked `localStorage`, the same way `theme-toggle`'s persistence would be tested if it had its own test today. |
| `src/app/graph/_components/graph-scene.tsx` | One addition to the JSX this component already returns: `<GraphStatsPanel stats={scene.stats} />`, added as a new sibling inside the existing `.graph-space` container, after `NodeHoverCard` in paint order (§9.2). No change to the imperative WebGL effect, its dependency array, or anything it currently owns (§8). |
| `CLAUDE.md` | The "Graph data" section gains a short note that a topic's status now also feeds an aggregate stats panel, derived at the same point the scene is built, with a pointer to this spec — the same self-documenting convention every other graph-data decision there already follows. |

Nothing in `src/lib/graph/schema.ts`, `seed.ts`, `content.ts`, `tree.ts`, `layout.ts`,
`colour.ts`, or `palette.ts` changes. This spec reads data those files already produce; it
adds no new authored field, no new validation rule, and touches nothing that feeds a
node's position, colour, or size.

### 8. Non-functional requirements

- **No new dependency.** The panel is built from the already-generated
  `components/ui/card.tsx` and a plain `<button>`; no `shadcn` collapsible/accordion
  primitive is generated for a single expand/collapse toggle this simple.
- **The WebGL scene's own effect is untouched.** `GraphSceneCanvas`'s big imperative effect
  still depends only on `[scene]`; toggling the panel's collapsed state lives entirely in
  `useGraphStatsStore` and `GraphStatsPanel`'s own render, so it triggers no scene rebuild,
  no camera reset, and no re-run of the effect's setup/teardown (CLAUDE.md, "The scene
  disposes its own GPU resources").
- **The render-on-demand model is unaffected.** The panel is ordinary React DOM painted by
  the browser's own layout engine, not drawn on the canvas — it never calls `invalidate()`
  and needs no frame of its own, so it introduces no new source of continuous rendering
  (CLAUDE.md, "The 3D scene renders on demand, not on a loop").
- **No change to prerendering.** `computeGraphStats()` runs inside `buildScene()`, which
  already runs synchronously in the Server Component at request/build time (`page.tsx`) —
  exactly like every other field on `GraphScene` today. No fetch, no dynamic API, no new
  reason the route couldn't still prerender (§4, D-4 is a consequence of this, not a gap in
  it).
- **No client-side fetching, polling, or subscription of any kind** is added to keep the
  panel "fresh" — its freshness is exactly the graph's own, by construction, per §4 D-4.
- **Accessibility posture matches the rest of the 3D view, on purpose, per the intent's own
  constraint** — not silently absorbed as a gap this spec introduces on its own initiative.
  The panel, including its collapse control, is not required to be reachable by keyboard or
  by a screen reader (§9.5).

### 9. Design

#### 9.1 Data: counting topics, and why the hub can't be one of them

`computeGraphStats()` takes the same `GraphSceneNode[]` `buildScene()` already assembles —
each of which already carries a resolved `status` (defaulting to `"Todo"` where nothing was
authored, per `node-hover-card`'s Q3 decision) and a `parentId` that is `null` for exactly
one node in the whole tree, the hub. It filters that one node out, then tallies the rest by
`status` into `done` and `inProgress`; `totalTopics` is the filtered array's length, so it
and the two counts always share the same base (§3 D-2).

The hub's exclusion isn't only a preference carried over from the intent — it's also the
only choice consistent with what can actually be authored today. `node-content-pages`
explicitly refuses a content file for the hub (`content/index.md` fails the build by name),
because `/graph` itself is the hub's page; there is nowhere to author a status for it even
if someone wanted to. Left in the total, the hub would sit at a permanent, unauthorable
`"Todo"` forever, capping the reachable percentage below 100 — exactly the outcome the
intent's own reasoning rules out.

#### 9.2 Layout: a stacking corner, not a fixed point

`GraphStatsPanel` is added as a new sibling inside the existing `.graph-space` container in
`graph-scene.tsx` (already `position: relative`), positioned with `position: absolute` and
anchored to the top-right corner with the app's standard spacing scale, after `NodeHoverCard`
in paint order — the same reasoning already documented there for painting the card above the
label layer applies again: later in the JSX paints on top.

Because the intent leaves a second, unspecified feature planned for the same corner (§3,
Q1), the panel is not simply pinned to an exact `top`/`right` offset the way, say,
`ThemeToggle` is positioned in the page header. Instead it is wrapped in a small, unstyled
corner-stack container — a `flex flex-col` anchored to the corner with a fixed gap between
its children — so a second panel dropped in beside this one later stacks underneath it
(or above it, if reordered) using the same gap, rather than needing its own independent
position math worked out from scratch once it exists. Today that stack holds exactly one
child. This is a structural choice made to absorb Q1's answer cheaply, not a claim about
what that answer will be (Areas of concern, C-1).

Unlike `GraphLabels` and the bulk of `NodeHoverCard`, this panel's root element does
**not** carry `pointer-events: none`. Those two are deliberately see-through so an orbit
drag started anywhere over them still reaches the canvas underneath; this panel is instead
a small, fixed, persistently visible control surface with a real button on it (the collapse
toggle), the same kind of thing `ThemeToggle` already is in the header — so it behaves like
an ordinary piece of UI chrome sitting in front of the canvas in its own corner, not like a
transparent annotation layer. A drag that starts with a pointer-down exactly inside the
panel's own small rectangle does not reach `OrbitControls` (which listens on the canvas
element itself); a drag that starts anywhere else and merely passes under the panel is
unaffected, because pointer capture keeps routing it to whichever element the drag began
on. This is the same trade `node-hover-card`'s "Open page" link already makes deliberately
for one small element on its card (§10 there); here it applies to the whole, much smaller,
corner-anchored panel instead of to one link (§6, risk 2).

#### 9.3 Visual design

The panel is built from `Card`/`CardContent` (`components/ui/card.tsx`), inheriting the
small radius, hairline border, and surface/foreground tokens every other card in the app
already uses — no new chrome is invented, and no raw hex value is introduced anywhere in
this feature. Rows follow the same label/value pattern `node-hover-card.tsx`'s `Row` helper
already establishes: a muted-foreground label, a foreground-coloured value, sentence case,
no trailing colon.

The bar's two segments are drawn from the app's one existing accent token
(`--color-primary`, ProductDock's brand blue, per the `design-system` skill) at two
opacities — full strength for Done, a reduced opacity for In Progress — rather than a
second hue or a hand-authored lighter hex. This keeps the feature inside token classes the
design system already bridges (`bg-primary`, an opacity modifier on it) instead of adding a
new colour decision the way the graph's own branch palette required a full validation pass
to add (`palette.contract.test.ts`) — this bar is not part of that validated categorical
set and does not need to be, because it isn't distinguishing *branches*, it's shading one
meaning ("how full") the same way the dataviz skill's "Meter" pattern shades severity from
one ramp. The unfilled remainder of the track uses the existing muted/border token, the
same one hairline dividers already use elsewhere. Exact opacity values are a tuning
decision, sized by eye once built and re-checked for legibility against both themes,
not an invariant this spec fixes in advance (§4, D-6).

#### 9.4 Collapse and persistence

`useGraphStatsStore` holds `collapsed: boolean`, read once from `localStorage` at module
evaluation time and defaulting to `false` (expanded) if nothing is stored or storage is
unavailable — mirroring `useUiStore`'s existing `try { localStorage… } catch {}` pattern for
the theme flag. Unlike the theme flag, this module needs no pre-hydration script and no
`useMounted()` gate: `GraphStatsPanel` only ever renders inside `GraphSceneCanvas`, which is
loaded through `next/dynamic` with `ssr: false` specifically because it reaches `three`
(`graph-view.tsx`) — so this subtree is never server-rendered in the first place, and there
is no server-rendered markup for a client-only read to mismatch against. The module-scope
read is safe for exactly the reason `graph-view-store.ts`'s own module-scope `popstate`
listener already documents: nothing importing it ever runs outside the browser.

Toggling calls `setCollapsed`, which updates the store and writes the new value back to
`localStorage` under its own key, the same shape `useUiStore.setTheme` already follows.
Collapsing hides the rows and the bar but leaves the "Statistics" header and the toggle
control on screen (§4, D-5; FR-8) — the header never unmounts, so there is always something
in the corner to click to bring the rest back.

#### 9.5 Accessibility posture

Per the intent's own constraint, this panel — including its collapse control — is not
required to be reachable by keyboard or by a screen reader; it follows the same posture
`graph-labels.tsx` and most of `node-hover-card.tsx` already carry (`aria-hidden`,
unreachable by Tab). This is a deliberate widening the intent already asked for, not a gap
this spec introduces on its own initiative the way `node-hover-card`'s own spec flagged its
equivalent choice as a concern (that spec's C-4) — there, new information became invisible
to assistive tech that wasn't invisible before; here, the intent states plainly up front
that this whole surface is exempt, so nothing is silently absorbed.

#### 9.6 What does not change

`layout.ts`, `colour.ts`, `palette.ts`, `schema.ts`, `tree.ts`, and `content.ts` are all
untouched: this feature reads a field those files already produce and validate, and adds no
new one. The existing click-to-focus gesture, the hover/long-press card, the label layer,
and the camera's fencing and framing are unchanged in kind — this spec adds one new,
independent overlay and nothing that touches how any of them already behave (FR-10).

### 10. Security

This adds one pure aggregation function, one small client store holding a single boolean,
and one new overlay component to a page that already has no server action, no API route, no
new environment variable, and no runtime network request beyond what the base graph feature
already has.

- **No new dependency.** The panel reuses `components/ui/card.tsx`; no package is added.
- **No new data exposure.** `node-hover-card`'s own spec already established, and flagged
  as a concern (that spec's C-1), that every visitor's browser receives every topic's status
  the moment `/graph` loads, baked into the scene payload at build time. This feature adds
  no new field to that payload beyond three already-public counts derived from data already
  shipped in full — it summarizes existing public numbers, it does not expose anything that
  wasn't already reachable by reading the page's own data.
- **`localStorage` holds one boolean under one scoped key** — no free text, no personal
  data, nothing under this feature's control that resembles the assignee-name concern the
  hover-card spec raised for its own, different, storage location (the committed seed, not
  `localStorage`).
- **No CSP impact.** No new script, style, or font source is added.

### 11. Verification

| # | Check | How | Pass |
| --- | --- | --- | --- |
| V-1 | A mixed fixture (some Done, some In Progress, some Todo, across both leaf and group topics) tallies to the correct `totalTopics`/`done`/`inProgress` | Unit test, `stats.test.ts`, against `__fixtures__` | pass |
| V-2 | The hub is excluded from every count regardless of its own status | Unit test, `stats.test.ts` | pass |
| V-3 | A tree with only a hub (no other topics) returns all-zero counts rather than throwing or dividing by zero | Unit test, `stats.test.ts` | pass |
| V-4 | The panel renders the total, Done count/percentage, and In Progress count/percentage matching a given `GraphStats` value | Component test, `graph-stats-panel.test.tsx` | pass |
| V-5 | The bar's two segment widths are proportional to the Done and In Progress shares, with no third labelled segment for Todo | Component test | pass |
| V-6 | There is no "Edges" row anywhere in the rendered panel | Component test | pass |
| V-7 | Collapsing the panel hides the rows and bar but keeps the header and toggle visible and clickable | Component test | pass |
| V-8 | With a collapsed preference already in `localStorage`, the panel renders collapsed on the next mount | Component test, mocked `localStorage` | pass |
| V-9 | With no stored preference (or storage unavailable), the panel always renders expanded | Component test, mocked/absent `localStorage` | pass |
| V-10 | Clicking a topic, hovering one, or flying the camera anywhere never changes the panel's numbers | Manual, on the built page | pass |
| V-11 | Toggling the panel's collapsed state does not rebuild the WebGL scene or reset the camera | Manual, dev-tools frame/GL-context count across several toggles | pass |
| V-12 | Orbiting, dragging, clicking a topic, and the existing hover/long-press card all keep working exactly as today, including with the pointer passing near or over the panel mid-drag from elsewhere | Manual regression pass | pass |
| V-13 | The route still prerenders with no dynamic API introduced | Build check | pass |
| V-14 | No regression to `palette.contract.test.ts` or `layout.test.ts` — neither touches this feature's data | Re-run unchanged | all still pass |
| V-15 | No regression on the existing suites | Re-run `tree.test.ts`, `scene.ts`'s existing coverage, `node-hover-card.test.tsx`, `graph-view.test.tsx` | all still pass |

---

## Areas of concern

**C-1 — The other feature planned for this same corner is still completely unspecified,
and this spec cannot verify its stacking design against something that doesn't exist yet**
(§3, Q1; §9.2). **Resolved here by building a stacking container rather than a fixed
position** — a small, gapped, reorderable stack this panel is the first item in — so a
second corner widget can be added without a redesign of this one. That is a hedge, not a
verification: nobody has checked that the real answer, whatever it turns out to be, actually
looks right stacked this way. **The decision needed from you:** tell engineering what the
other planned feature is (or point them to whoever owns it) as soon as it's known, so the
stacking can be checked against the real thing rather than left resting on this spec's
guess.

**C-2 — The panel can visibly lag behind reality for as long as a merged status change
hasn't gone through a rebuild and redeploy** (§4, D-4; §6, risk 3). This spec chose
build-time freshness — the same freshness every other fact on the graph already has — over
any live-refresh mechanism, because the intent's own wording on this point was marked
`[assumed]`, not stated as a firm requirement, and a live mechanism is materially more scope
(polling or a push channel, plus something to decide how often, plus new failure modes
around either). **Resolved here by treating "as fresh as the rest of the graph" as good
enough** unless told otherwise. **The decision needed from you:** confirm that lag is
acceptable — most teams will only notice it if someone reloads and expects an instant
change — or say if "the moment it merges" is actually the expectation, which changes this
from a display feature into one with a live data path, a different and larger piece of
work.

**C-3 — A group topic marked Done says nothing about whether the topics under it are
also Done** (§6, risk 1). This isn't a choice this spec made independently — it follows
directly from the intent's own instruction to count group topics "like any other topic" —
but it means the panel's headline percentage can read as further along than a viewer would
expect once they open that branch and find unfinished work under a "Done" parent.
**Resolved here by applying the intent's own rule exactly as written**, rather than quietly
carving out an exception it didn't ask for. **No decision needed from you today** — this is
flagged so the gap between "the parent says Done" and "everything under it is finished"
isn't mistaken for a bug the first time someone notices it.

**C-4 — The collapsed/expanded preference is scoped to one browser, not to a person** (§6,
risk 4). Nothing in this app has a concept of "the same viewer" that survives a change of
browser or device — there's no account system to hang a preference on — so this spec
follows the same scoping `useUiStore`'s theme preference already uses. **Resolved here by
matching existing precedent** rather than inventing a new, heavier mechanism for one small
UI preference. **The decision needed from you:** confirm per-browser memory is what "stays
collapsed for them" in the intent was asking for, since a literal reading of "for them" —
follows the person, not the browser — isn't achievable without account-level state this
project doesn't have today.

**C-5 — Shading Done and In Progress as two strengths of one blue, rather than distinct
colours (e.g. green for Done), asks the viewer to read the bar mostly by its numbers rather
than by colour alone** (§4, D-6; §9.3). This spec chose that treatment specifically to avoid
implying a health/severity meaning ("green = good") that isn't what this bar is measuring,
and to avoid opening a second colour decision alongside the graph's own already-validated
branch palette. **Resolved here by leaning on the numbers next to the bar to carry the
distinction**, not on the fill colour alone. **The decision needed from you:** look at it
once it's built and say whether the two segments read clearly enough apart, or ask for a
more visually distinct treatment — which would then need its own accessibility check the
way the graph's branch colours already went through, rather than being assumed acceptable
by default.
