# Plan: show the team's progress on the graph

- **Intent:** [`intent.md`](./intent.md) · **Spec:** [`spec.md`](./spec.md) (merged `fc41dff`, #60)
- **Task:** #62 (`plan: Show the team's progress on the graph`)
- **Areas of concern C-1 to C-5:** accepted as written by the product owner. Nothing here
  re-opens them.

## Context

You can't tell how far along the graph is without hovering topics one at a time. This adds
a "Statistics" panel to the top right of the 3D view. It shows the topic count (hub
excluded), the Done count and percentage, the In Progress count and percentage, and a
two-segment bar. The panel starts open, can be collapsed, and remembers per browser that
it was collapsed. It is computed at build time from the statuses `content.ts` already
resolves, so it adds no new data source, route, dependency or live refresh.

## Files changed

| Path | What happens |
| --- | --- |
| `src/lib/graph/types.ts` | Add `GraphStats { totalTopics; done; inProgress }` (all `number`) and `stats: GraphStats` on `GraphScene`. |
| `src/lib/graph/stats.ts` (new) | `computeGraphStats(nodes: readonly GraphSceneNode[]): GraphStats`. Drops the node with `parentId === null` and counts the rest by `status`. Returns counts only, no percentages. Imports only `./types`. |
| `src/lib/graph/stats.test.ts` (new) | V-1 to V-3 (see Proof). |
| `src/lib/graph/scene.ts` | Build the node array once as `nodes`, then return `{ nodes, edges, radius, stats: computeGraphStats(nodes) }`. |
| `src/stores/graph-stats-store.ts` (new) | `useGraphStatsStore`: `collapsed`, `setCollapsed`. The initial value comes from `localStorage` key `graph-stats-collapsed`, where only `"true"` counts as collapsed. The read is inside `typeof window` + `try/catch` and falls back to `false`. `setCollapsed` writes the key back inside `try/catch`, the same way `ui-store.ts` does. |
| `src/app/graph/_components/graph-stats-panel.tsx` (new) | `"use client"`. `GraphStatsPanel({ stats })` plus an exported pure `statsShares(stats)` that returns `{ donePct, inProgressPct, doneFrac, inProgressFrac }` and gives all zeros when `totalTopics === 0`. It renders a corner-stack wrapper with the `Card` inside it (layout below). |
| `src/app/graph/_components/graph-stats-panel.test.tsx` (new) | V-4 to V-9. |
| `src/app/graph/_components/graph-scene.tsx` | Import the panel. Add `<GraphStatsPanel stats={scene.stats} />` inside `.graph-space`, **after** `<NodeHoverCard>` and before the `sr-only` `<p>`. Nothing else changes: not the effect, its deps, or the teardown. |
| `CLAUDE.md` | Add one bullet to "Graph data", covered below. |

Unchanged: `schema.ts`, `seed.ts`, `content.ts`, `tree.ts`, `layout.ts`, `colour.ts`,
`palette.ts`, `globals.css`, `components/ui/**`, `page.tsx`, `graph-view.tsx`.

### Panel layout (settles §9.2–§9.5 so nobody has to guess)

- **Corner stack:** `<div className="absolute top-4 right-4 flex flex-col items-end gap-2">`.
  The stack is the positioned element; its children are not. A future widget becomes a
  sibling child (C-1). No `pointer-events-none`: the panel takes pointer events (§9.2).
- **Root:** `aria-hidden="true"` on the stack. The toggle button has `tabIndex={-1}`, the
  same as the hover card's "Open page" link (§9.5): unreachable by Tab and never announced.
- **Card:** `<Card size="sm" className="w-56">`, fixed width so the panel doesn't reflow
  and stays small on a 768px tablet. Header row: "Statistics" in the hover card's title
  style (`font-heading text-sm font-medium`) and a ghost `<button type="button">` holding a
  lucide `ChevronUp`/`ChevronDown` (lucide already ships via `theme-toggle.tsx`).
- **Rows** (collapsed hides these and the bar, header stays mounted):
  `Topics <n>` · `Done <d>/<n> (<p>%)` · `In progress <i>/<n> (<q>%)`. Sentence case with
  no colon, same markup as `Row` in `node-hover-card.tsx`. Copy the three-line helper
  locally, since `Row` isn't exported and a second route doesn't use it yet. Numbers get
  `tabular-nums`.
- **Bar:** a track `h-1.5 w-full overflow-hidden rounded-full bg-border flex`. Inside it,
  a Done segment `bg-primary` then an In Progress segment `bg-primary/40`, widths set with
  `style={{ width: \`${frac * 100}%\` }}`. Both carry `data-testid`s. Pill radius follows
  the design system's two-radius rule.
  - **The track is `bg-border`, not `bg-muted`.** §9.3 says "muted/border token", but
    `--color-muted` and `--color-card` both resolve to `--surface-1`, so a `bg-muted` track
    would be invisible on the card. `--border` is the hairline token §9.3 means.
  - `/40` is a starting value, to be tuned by eye in both themes (D-6). Whatever value
    ships goes back into this file.
- **Rounding:** each percentage is `Math.round(count / total * 100)` on its own, so the
  two can add up to 101. Bar widths use the unrounded fractions.
- No animation on the bar or the collapse, so there's nothing to add to the
  reduced-motion guard.

### CLAUDE.md bullet (Graph data)

> **The stats panel counts topics, not nodes** (`intent/graph-progress-stats/`).
> `computeGraphStats()` runs inside `buildScene()` and excludes the hub (`parentId ===
> null`): the hub can't carry a status (`content/index.md` fails the build), so counting it
> would keep 100% out of reach. A group marked Done counts as Done whatever is under it (C-3).
> The numbers are as fresh as the last deploy (C-2). The panel is ordinary DOM that takes
> pointer events in its own rectangle, paints above the hover card, and is `aria-hidden`
> like the scene. Its collapsed flag is in `useGraphStatsStore` and remembered per browser.
> Its bar track is `bg-border` because `bg-muted` is the card's own colour.

## Sequence of work

Each step ends green on `npm run typecheck && npm test`.

1. **Types and derivation.** Add `GraphStats` and the `stats` field. Write `stats.ts` and
   `stats.test.ts`, then wire it into `scene.ts`. *Check:* `npx vitest run src/lib/graph`
   passes. `npm run typecheck` shows no `GraphScene` literal elsewhere is missing `stats`
   (grep found only `buildScene` constructing one).
2. **Store.** Write `graph-stats-store.ts`. It gets no test of its own because step 3's
   tests cover it through the panel.
3. **Panel and its tests.** Write `graph-stats-panel.tsx` and its test. *Check:*
   `npx vitest run src/app/graph/_components/graph-stats-panel.test.tsx`.
4. **Mount it.** Add the one JSX line in `graph-scene.tsx`. *Check:* `npm run dev`, then
   check `/graph` by hand (V-10 to V-12).
5. **Tune D-6.** Set the In Progress opacity by eye in light and dark, and record the
   value here.
6. **CLAUDE.md.** Add the bullet. *Check:* the full Proof block below.

## Risks

- **Breaks nothing existing by design.** Adding `stats` to `GraphScene` grows the RSC
  payload by three numbers. Every `buildScene` caller keeps working. The one behavioural
  change: a pointer-down that starts inside the panel's roughly 224×110px rectangle no
  longer orbits, and **the mouse wheel over it no longer zooms**. The wheel is a small gap
  the spec doesn't name; it's accepted as part of §9.2's "ordinary chrome" trade.
- **Pointer handoff is the riskiest step (4).** Moving from the canvas onto the panel
  fires the canvas's `pointerleave`, which clears hover and closes the card after
  `CARD_CLOSE_GRACE_MS`. That's the same as moving onto the page header, so it's correct.
  A drag that starts on the canvas and crosses the panel keeps orbiting because
  `OrbitControls` holds pointer capture. **If that assumption is wrong**, a drag through
  the corner stalls or a stray `pointerup` flies the camera. V-12 checks exactly that. The
  fix would be local to the panel (e.g. `pointer-events-none` on the stack while a button
  is down) and must not touch the scene effect.
- **Panel paints over the hover card (spec §9.2, kept on purpose).** A card for a node in
  the top-right corner can be partly hidden until the panel is collapsed. This goes with
  §6 risk 2.
- **Touch:** tapping the panel doesn't reach the canvas, so an open long-press card stays
  up after the tap instead of closing (FR-8 of node-hover-card closes it on any *canvas*
  tap). This is minor and accepted. Don't fix it by forwarding events into the scene.
- **Store read at module scope.** Safe because the module is imported only from the
  `ssr: false` subtree, and the `typeof window` guard keeps a stray server import
  harmless. A test has to `vi.resetModules()` and re-import to see a changed
  `localStorage`, and that is how V-8/V-9 are written.
- **Focus on click.** Clicking the `tabIndex={-1}` button still moves focus into an
  `aria-hidden` subtree in some browsers. That matches the existing "Open page" link and
  falls under the accepted a11y debt (§9.5).
- **Rollback:** revert the implementation commit. Nothing is persisted apart from one
  `localStorage` key, which is harmless if left behind. There's no schema, content or
  migration impact.

## Proof

Automated, all must pass:

```bash
npm run typecheck && npm run lint && npm test && npm run build
rg -n 'process\.env\.' src --glob '!src/lib/env.ts'      # no matches
rg -n "from ['\"](three|@/app|@/components)" src/lib/graph/stats.ts   # no matches
```

- **V-1** `stats.test.ts`: `buildScene(fixtureSeed, loadNodeContent(fixtureSeed, FIXTURE_CONTENT_DIR))`
  gives `{ totalTopics: 12, done: 1, inProgress: 1 }`: RAG is Done, Evals is In Progress,
  and both are groups. A second case adds a Map override that marks one leaf (`A2A`) Done,
  giving `done: 2`. That covers leaf and group together.
- **V-2** The same content map with the hub (`pd-ai`) set to Done doesn't change any count.
- **V-3** `computeGraphStats([hubOnlyNode])` on a hand-built single `GraphSceneNode`
  returns all zeros. `statsShares({0,0,0})` returns zeros and no `NaN`.
- **V-4** The panel with `{ totalTopics: 41, done: 6, inProgress: 3 }` shows `41`,
  `6/41 (15%)` and `3/41 (7%)`.
- **V-5** The Done and In Progress segments have `style.width` equal to `(6/41*100)%` and
  `(3/41*100)%`. There are exactly two segment test ids and no "Todo" text.
- **V-6** `queryByText(/edges/i)` is null.
- **V-7** Clicking the toggle removes the rows and the bar. "Statistics" and the button
  stay, and clicking again brings them back. `localStorage["graph-stats-collapsed"]`
  becomes `"true"`.
- **V-8** Set `localStorage` to `"true"`, run `vi.resetModules()`, re-import the store and
  panel, and render: it comes up collapsed.
- **V-9** With the key empty it renders expanded. With `Storage.prototype.getItem` spied
  to throw it also renders expanded, with no error.
- **V-14/V-15** The existing suites (`palette.contract`, `layout`, `tree`, `colour`,
  `node-hover-card`, `graph-view`, `graph-labels`, `content`) pass unchanged, as part of
  `npm test`.
- **V-13** `npm run build` still lists `/graph` as prerendered (○/●), not dynamic (ƒ).

Manual, on `npm run dev`, desktop and a 768px-wide window (or a tablet):

- **V-10** Hover, click-focus several nodes, click empty space and press Escape. The
  numbers never change.
- **V-11** Toggle the panel about 10 times. The camera doesn't reset, the canvas isn't
  recreated (the Elements panel shows the same `<canvas>` node), and nothing new appears
  under `WebGL` in about:gpu or the console.
- **V-12** Start an orbit drag in the middle, sweep it through the panel and release on
  it: the orbit continues and the camera doesn't fly on release. Hover a node next to the
  panel and the card appears and swaps normally. Long-press a node on touch and the card
  opens and the camera doesn't fly. Clicking a node right beside the panel focuses it.
- **D-6** Screenshot the bar in light and dark with a non-zero In Progress, and check that
  the two segments and the track can each be told apart.

If any manual check can't be run (e.g. no tablet), the PR body says so.

## Handoff

### Handoff

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
- **Put `Closes #<n>` in the PR body, naming the `plan: <slug>` issue** — the task
  `plan-ready` opened when the spec was approved. It must be the GitHub keyword, on its
  own line, with the number: `Closes #31`. Prose like "closes the plan task" reads the
  same to a person and does nothing at all to GitHub, which is how a task survives the
  merge that completed it and sits open forever.

  This is the one link that closes the loop the whole trail hangs on — approved,
  planned, built, done, on one issue. `plan-ready.yml` already depends on it: it watches
  for the implementation PR's `Closes #n` to distinguish that merge from a product owner
  re-approving an amended spec, and skips the reopen it would otherwise do.

  If you cannot find the issue number, ask rather than guessing or omitting it.
- **Say what is not done.** Manual checks you could not run, steps you skipped, values
  still to be tuned — in the PR body, not omitted because the tests are green.
