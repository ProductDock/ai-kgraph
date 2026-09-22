# Plan: show a node's title, assignee and status on hover

- **Intent:** [`intent.md`](./intent.md) — *show a node's title, assignee and status on hover*
- **Spec:** [`spec.md`](./spec.md) — approved by @GoodbyePlanet, commit `47d8a86`
- **Task:** `plan: Show a node's title, assignee and status on hover` — issue #47
- **Stage:** 3 — plan (AI-Native SDLC, lesson 4)

## Context

Hovering a node tells you nothing the label under it doesn't already say. The graph is a
map of the subject, not a picture of the work: to answer "who owns RAG, and is it done?"
you have to ask someone (intent, **Problem**).

This adds two hand-authored fields to the seed — `assignee` and `status` — and one small
overlay card that appears beside a node on hover (desktop) or long-press (tablet),
showing the node's name, **Assignee**, **Status**, and an inert **Open page** row.
Nothing about how the graph is *drawn* changes: colour still means branch, shade means
depth in that branch, size means "is this a group" (FR-10).

Three things settled during this planning session, before any code:

1. **The spec's Areas of concern are resolved.** C-1 (a colleague's real name ships to
   every visitor at build time, reversing the base spec's §8.5 "no personal data" claim),
   C-2 (free-text assignee, so a typo ships silently) and C-4 (the feature widens the
   known keyboard/screen-reader gap) were confirmed accepted by the originator. C-3 needs
   a look at the built screen and is carried into **Proof**, step 8. C-5 asks nothing of
   anyone.
2. **The baseline is the working tree, not `a7697ea`.** Uncommitted changes to
   `graph-scene.tsx` remove the hover scale-bump — hover now only changes the cursor. The
   spec was written against the bump existing and refers to it in four places; those
   references are stale and this plan does not rely on any of them. See **Risks**, R-1.
   This makes the card the *only* hover feedback, which strengthens FR-10 rather than
   weakening it.
3. **The spec's technical design is sound but assumes three things the code does not
   have.** They are additions, not contradictions, and they are folded into the sequence
   below rather than sent back as a spec gap: there is no `pointerleave` listener on the
   canvas today, `pointerType` is never inspected anywhere in the file, and — because the
   hover bump was the only `invalidate()` on the hover path — opening a card now needs an
   `invalidate()` of its own. The spec's §8 claim that this adds "no new `invalidate()`
   beyond what the hover scale-bump already calls today" was true at `a7697ea` and is not
   true against the working tree. See **Risks**, R-2.

## Files changed

| File | What happens to it |
| --- | --- |
| `src/lib/graph/types.ts` | `GraphSeed` gains `assignee?: string` and `status?: NodeStatus`. New exported `type NodeStatus = "Todo" \| "In Progress" \| "Done"`. `GraphNode` gains `assignee: string` and `status: NodeStatus`, both **required** — the default is resolved once in `flatten()`, not repeated by every consumer. `GraphSceneNode` inherits both for free. |
| `src/lib/graph/schema.ts` | The `name` field's `.min(1).max(MAX_NAME_LENGTH).refine(trimmed)` chain is extracted to a local `trimmedString(max)` helper (no behaviour change to `name`) and reused for `assignee`. `status` becomes `z.enum(["Todo", "In Progress", "Done"]).optional()`. Stays `.strictObject()`. **Its doc comment at `:16-18` is rewritten**: it currently says the schema's strictness is what stops "a seed edit smuggling in a `status` field that some later component renders unescaped" — that sentence becomes false in this commit and must not be left standing. |
| `src/lib/graph/tree.ts` | `walk()`'s `nodes.push({...})` (`:108-115`) gains `assignee: node.assignee ?? "Unassigned"` and `status: node.status ?? "Todo"`, applied to every node with no exception — hub and ring topics included (§3, Q3; C-5). No other change; the id, depth, duplicate and budget checks are untouched. |
| `src/lib/graph/scene.ts` | **No change.** `buildScene()` already spreads every `GraphNode` field (`:19 ...node`), so both fields reach `GraphSceneNode` without an edit. Verified, not assumed. |
| `src/app/graph/_components/node-hover-card.tsx` | **New.** The card component, its imperative handle, and the pure placement function. See **Design** below. |
| `src/app/graph/_components/node-hover-card.test.tsx` | **New.** Tests the pure placement/flip/clamp maths *and* renders the component in jsdom. See the deviation note under **Design**. |
| `src/app/graph/_components/graph-scene.tsx` | Pointer handling gains idle-hover detection, touch long-press, touch dismissal, `pointerleave`/`pointercancel`/`contextmenu` listeners, and one card placement per frame inside the existing `updateLabels()` pass. Mounts `<NodeHoverCard>` after `<GraphLabels>`. |
| `src/lib/graph/seed.ts` | `RAG` gains `assignee: "Nemanja Vasic", status: "Done"` — the intent's own worked example, verbatim. One further node gains `status: "In Progress"` and **no** assignee, so all three status words and the "status without assignee" case are on screen for V-1/V-2 without this plan inventing a second person's name. Every other node is untouched and therefore reads Unassigned/Todo. |
| `src/lib/graph/tree.test.ts` | Gains the defaulting cases (V-11) and an unknown-key case with the new fields present (V-12). |
| `CLAUDE.md` | The **Graph data** bullet "`status`, `assignee` and page links are deliberately not reserved — they arrive when those features do" is rewritten: two of the three have now arrived. Page links have not, so that half of the sentence stays. |

Untouched, and deliberately so: `layout.ts`, `colour.ts`, `palette.ts`, `graph-labels.tsx`.
This feature adds data that rides alongside a node's identity, nothing that feeds
position, colour or size (FR-10). Their test files are the acceptance gate for that claim
and must pass **unmodified** (V-13).

## Design

### The card is an overlay with an imperative handle, mirroring `GraphLabels`

A node is a WebGL mesh instance found by ray-casting (`pick()`, `graph-scene.tsx:1608`),
not a DOM element, so there is no trigger for a generated `hover-card` primitive to
attach to — the same reason the label layer hand-rolls its overlay today (spec §9.1). The
card follows that precedent exactly:

```ts
export interface NodeHoverCardHandle {
  show(content: { name: string; assignee: string; status: NodeStatus }): void;
  place(placement: CardPlacement): void;
  hide(): void;
}
```

`show()`/`hide()` drive `useState` **inside `NodeHoverCard`**, so only that small
component re-renders — `GraphSceneCanvas` never does, and the `[scene]` effect never
re-runs. `place()` writes `transform` straight to the element ref, like
`GraphLabels.apply()` does, so the per-frame path touches no React state at all.

Root element is `absolute inset-0 pointer-events-none`; the `Card` inside it is
`pointer-events-auto`. **Both halves are needed**: a full-bleed layer that accepted
pointer events would swallow every orbit drag and every click-to-focus on the canvas
underneath it, and a card that refused them could not stay open while the pointer moves
onto it (§9.2). It mounts after `<GraphLabels>` inside the existing
`.graph-space relative` container (`graph-scene.tsx:1769`); both are positioned, so both
paint above the imperatively-appended canvas, and the card paints above the labels.

Chrome comes from `Card` + `CardContent` (`components/ui/card.tsx`) — no new dependency,
no new `shadcn` generation. Status is plain text, no colour badge (§4, D-2). "Open page"
is static styled text, not an `<a>` or `<button>`, so it is not a focusable dead end
(§9.4).

### Placement is a pure function, so it can be tested

```ts
export function cardPlacement(args: {
  nodeX: number; nodeY: number; gapPx: number;
  cardWidth: number; cardHeight: number;
  containerWidth: number; containerHeight: number;
}): { x: number; y: number; side: "left" | "right" };
```

Defaults to the right of the node, flips left when it would cross the container's right
edge, then clamps on both axes to stay fully inside (V-9). `gapPx` reuses
**`labelOffsetPx(drawnRadius, distance, height, CAMERA_FOV)`** — already exported from
`graph-labels.tsx:70` and already computing "the node's on-screen radius plus a
proportional gap". No new trigonometry is written.

`cardWidth`/`cardHeight` are read **once** with `getBoundingClientRect()` when content
changes, not per frame — the scene's standing rule against per-frame DOM measurement.
Width is bounded by a new `CARD_MAX_PX` constant (sibling to `LABEL_MAX_PX = 132`), with
`overflow: hidden; text-overflow: ellipsis` on the name and assignee rows, so a long name
truncates rather than widening the card off-screen (§4, D-5; V-10).

**Deviation from the spec, stated deliberately:** spec §7 names the test file
`node-hover-card.test.ts`. This plan uses `node-hover-card.test.tsx`, because the card is
a plain React component that never imports `three` and *can* therefore be rendered in
jsdom with `@testing-library/react` — the same setup `graph-view.test.tsx` already uses.
That makes FR-2/FR-3/FR-4 and V-10 genuinely assertable (four rows, in order; "Unassigned"
and "Todo" defaults; the ellipsis styling) instead of only inspectable by eye. This is a
strictly stronger proof than the spec asked for, not a weaker one.

### Trigger and dismissal

*Idle hover* is the new, narrower notion: pointer over a node **and** `pressedAt === null`
**and** `event.pointerType !== "touch"`. The card opens on idle hover and closes the
instant it ends — including because a button went down and a drag may have started
(FR-11). `pressedAt` (`:1607`) and `CLICK_SLOP_PX` (`:250`) already exist for
click-vs-drag; this reuses them rather than adding a parallel notion of "dragging".

Touch long-press: a timer started in `onPointerDown` only when
`event.pointerType === "touch"`, firing after `LONG_PRESS_MS`. Cancelled if the pointer
moves past `CLICK_SLOP_PX`, releases, or is cancelled. When it fires it opens the card and
sets a `longPressConsumed` flag that `onPointerUp` checks and clears before its
focus/overview branch — so a long-press opens the card and does **not** also fly the
camera (FR-7).

Touch dismissal: any touch tap (within slop) closes an open card, then proceeds with its
normal focus behaviour. Tapping empty space, another node, or the same node again all
close it, which is exactly FR-8, and tap-to-focus is otherwise untouched.

Three listeners the canvas does not have today are added — none of them optional:

- **`pointerleave`** — there is no `pointerleave`/`pointerout` on the canvas at all right
  now, so `hoveredIndex` is never cleared when the pointer exits. Without this the card
  would stay open after the pointer leaves the canvas entirely, failing FR-6.
- **`pointercancel`** — clears the long-press timer and `pressedAt`; without it a
  cancelled touch leaves a timer that fires over nothing.
- **`contextmenu`** (prevented) — the platform's own long-press/callout gesture.
  `touchAction: none` (`:319`) does not reliably suppress it on every mobile browser
  (§9.2).

All three go in the attach block at `:1677-1683` and the mirrored detach at `:1721-1728`;
the long-press timer is declared beside `emphasisTimer` (`:1104`) and cleared beside
`:1717`, and its callback checks `disposed` the way every other deferred callback in this
file does.

### Following the node

Placement is recomputed inside the existing `updateLabels()` pass (`:1353`, called from
`renderFrame` after the render), reusing the projection at `:1276-1313` — but **without**
the `+ offset` on `y`, since the card anchors to the circle's centre and offsets
horizontally, where a label anchors below it. It inherits the same `LABEL_INTERVAL_MS`
throttle and the same exemption from it while the camera is moving, so the card tracks its
node exactly as tightly as a label does through a fly-to, an orbit, or the damping tail
after a long-press (FR-9).

**One trap that the throttle creates, and the fix.** `updateLabels()` early-returns
wholesale when throttled (`:1250-1255`). On an idle page the scene renders zero frames, so
opening a card must `invalidate()` — and if a frame happened to render less than 33ms
earlier, that one new frame's label pass would early-return, the card would never receive a
position, and no further frame would be scheduled. The card would sit unplaced,
permanently. So opening a card sets `lastLabelsAt = 0` **and** calls `invalidate()`,
forcing that frame's pass to run. This is the kind of failure that appears once in twenty
hovers and looks like a flake; it is designed out rather than discovered later.

`invalidate()` is called from the pointer handler, never from inside a frame — the
standing rule in this file (`:972-974`, `:1147-1149`).

## Sequence of work

Each step is independently verifiable. Steps 1–3 are pure data and can land and be proven
before a single line of UI exists.

1. **Branch from `origin/main`, not local `main`.** Local `main` is 2 commits behind and
   does not contain the spec. Also decide what happens to the uncommitted
   `graph-scene.tsx` / `graph-labels.tsx` hover-bump removal — it is *separate* work and
   should be its own commit, not folded into this feature (see **Risks**, R-1).
2. **Record the baseline:** `npm test` green, and the count of tests, before any change.
3. **Data layer** — `types.ts`, `schema.ts` (including its stale doc comment), `tree.ts`.
   Verifiable alone: `npx vitest run src/lib/graph/tree.test.ts` plus the new V-11/V-12
   cases, and `npm run typecheck` clean.
4. **Seed** — `seed.ts` gains the intent's worked example on `RAG` and one
   `In Progress` node. Verifiable alone: the build still passes, `tree.test.ts` still
   passes, and the two nodes flatten to what was authored.
5. **The card component** — `node-hover-card.tsx` and its test file. Verifiable alone,
   with no scene and no GPU: `npx vitest run src/app/graph/_components/node-hover-card.test.tsx`.
   This is where FR-2/3/4/5, V-9 and V-10 are proven.
6. **Wire it into the scene** — `graph-scene.tsx`: mount the card, add idle-hover, the
   three new listeners, the long-press timer and consumed-flag, the `lastLabelsAt = 0`
   forced pass, and the placement branch in `updateLabels()`. Add every new listener and
   timer to the teardown **in the same edit** — the standing rule in `CLAUDE.md`.
7. **Docs** — the `CLAUDE.md` Graph data bullet. Same commit as step 6; a doc that says
   these fields are deliberately unreserved, sitting next to the commit that reserves
   them, is how the next person gets this wrong.
8. **Full gate + look at it** — see **Proof**.

## Risks

**R-1 — The spec was written against a hover scale-bump that the working tree has
removed.** Four passages lean on it: §9.2 sizes `LONG_PRESS_MS` "in the same spirit as
this file's other tuning constants like `HOVER_SCALE`"; §8 claims no new `invalidate()`
is needed "beyond what the hover scale-bump already calls today"; §9.5 lists it among
things that don't change; §4 D-1 argues from "moving the mouse over a node already makes
it grow." `HOVER_SCALE` and `HOVER_MS` no longer exist. Only the §8 one has teeth — it is
why step 6 must add an explicit `invalidate()`. The others are stale prose, not design
errors. *Mitigation:* the hover-bump removal should be committed (or dropped) separately
and **before** this work, so the implementation session builds on a clean, committed
baseline rather than a dirty tree it might accidentally revert or half-commit.

**R-2 — The riskiest step is 6, and specifically `onPointerUp`.** It is the one place
existing, working behaviour is modified rather than added to: a new early return guards
the focus/overview branch. If `longPressConsumed` is set but never cleared, **every
subsequent click stops focusing the camera** — the graph's primary interaction dies, and
it dies silently on desktop where the flag should never have been set at all. *Mitigation:*
the flag is set only under `pointerType === "touch"` and cleared unconditionally on the
next `pointerdown` as well as when read, and V-6 explicitly re-tests tap-to-focus on
touch. *If it is wrong:* revert step 6 alone; steps 3–5 are inert without it.

**R-3 — The card can eat the canvas's pointer events.** If the root layer is not
`pointer-events-none`, orbiting and click-to-focus both break everywhere, not just near a
card. Caught immediately by V-5 and by clicking any node.

**R-4 — Rapid hover across a dense cluster flashes cards on and off** (spec §6; §4, D-4).
Accepted knowingly, with no artificial delay, per the spec. If it is distracting on the
real screen, the fix is a short delay *before showing* only — a follow-up, not a guess
made now.

**R-5 — Rollback is all-or-nothing across code and data.** Because the schema is
`.strict()`, reverting the code while leaving `assignee`/`status` in `seed.ts` fails the
build. The rollback is `git revert` of the whole commit (or the whole PR merge), never a
partial revert. Stated so nobody tries the partial one under pressure.

**R-6 — Nothing here narrows the accessibility gap, and it widens what is behind it**
(C-4, accepted). The card is `aria-hidden` and unreachable by keyboard, the same posture
the label layer has. `intent/graph-accessibility/` is where this is tracked; this plan does
not accelerate it, per the decision recorded above.

**What this breaks: nothing that exists today**, on the working-tree baseline. No existing
function changes signature, no existing test is edited, and the two `GraphNode` fields are
additive. The only modified behaviour is `onPointerUp`'s new guard (R-2).

**Open questions left by the intent:** all five are closed — Q1–Q4 by spec §3, Q5 by the
originator's C-1 decision recorded in **Context**. None are left for the implementer.

## Proof

Runnable, in order. Every command is copy-pasteable.

```bash
npm run typecheck
npm run lint
npm test                    # all existing suites + the new ones
```

Targeted, per step:

```bash
npx vitest run src/lib/graph/tree.test.ts                                 # V-11, V-12
npx vitest run src/app/graph/_components/node-hover-card.test.tsx         # FR-2/3/4/5, V-9, V-10
npx vitest run src/lib/graph/layout.test.ts src/lib/graph/palette.contract.test.ts
                                                                          # V-13 — must pass UNMODIFIED
npx vitest run src/app/graph/_components/graph-labels.test.ts src/app/graph/_components/graph-view.test.tsx
                                                                          # V-15
```

Then `npm run dev`, open `/graph`, and check by hand — these cannot be automated in this
setup, and saying so is part of the proof:

| | Check | Expect |
| --- | --- | --- |
| V-1 | Hover any node | Card with four rows, in order, node's own name as title |
| V-2 | Hover a node left blank in the seed, and hover `RAG` | "Unassigned"/"Todo"; and "Nemanja Vasic"/"Done" |
| V-3/V-4 | Move the pointer off a node, then straight from one node to another | Card goes at once; content swaps; never two at once |
| V-5 | Press and drag across nodes to orbit | No card appears at any point in the drag |
| V-6/V-7 | Device-emulated touch: quick tap, then long-press, then tap elsewhere | Tap still focuses the camera; long-press opens the card **without** focusing; any tap closes it |
| V-8 | Orbit and zoom with a card open | Card stays glued through the move and the damping tail |
| V-14 | Idle the page with dev-tools frame counting, card closed | Zero frames render; no timer fires |
| C-3 | Look at the "Open page" row | Report to the originator whether it reads "not built yet" or "broken" — this is the one open judgement the spec explicitly defers to a real screen |

## Handoff

**For the Stage 4 session. Read this before writing code.**

- **Build from this file, not from a conversation.** If the implementation deviates from
  the plan, update this file in the same commit and say why. A stale plan is worse than
  none — later review stages read it as the approved intent.
- **Run the Proof section before claiming it works.** If something in it cannot be run,
  say so explicitly rather than quietly substituting a weaker check.
- **Do not open the pull request. Ask.** When the work is done and the proof is green,
  report the state and *ask the human whether to open it*. Never open it, or a spec
  amendment PR, on your own initiative — including when they approved one earlier in the
  session. Approval of one PR is not approval of the next.
- **When they say yes, title it `plan + <type>: <what it does>`** — `feat`, `fix`,
  `refactor`, `perf`, `chore`, whichever fits the work. The PR carries both `plan.md` and
  the implementation, which is what the `plan + ` prefix records. The rest of the title
  is a plain-language description of **what was actually built**, not the slug and not a
  restatement of the spec's title. `plan + feat: colour by branch, size by whether a node
  carries anything` — not `plan + feat: graph-branch-colour-and-size`.
- **Put `Closes #47` in the PR body** — the `plan: Show a node's title, assignee and
  status on hover` task `plan-ready` opened when the spec was approved. It must be the
  GitHub keyword, on its own line, with the number: `Closes #47`. Prose like "closes the
  plan task" reads the same to a person and does nothing at all to GitHub, which is how a
  task survives the merge that completed it and sits open forever.

  This is the one link that closes the loop the whole trail hangs on — approved, planned,
  built, done, on one issue. `plan-ready.yml` already depends on it: it watches for the
  implementation PR's `Closes #n` to distinguish that merge from a product owner
  re-approving an amended spec, and skips the reopen it would otherwise do.
- **Say what is not done.** Manual checks you could not run, steps you skipped, values
  still to be tuned — in the PR body, not omitted because the tests are green. In
  particular: `LONG_PRESS_MS` and `CARD_MAX_PX` are tuning values sized by eye, and C-3
  is an explicit open judgement for the originator.
