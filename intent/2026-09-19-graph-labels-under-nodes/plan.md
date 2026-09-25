# Plan: node labels sit under the circle, never on it

- **Intent:** [`intent.md`](./intent.md) · **Spec:** [`spec.md`](./spec.md)
- **Task:** [#38](https://github.com/ProductDock/ai-kgraph/issues/38) — `plan: node labels sit under the circle, never on it`
- **Stage:** 3 — plan (AI-Native SDLC, lesson 4)

## Context

In `/graph`, a label is drawn a fixed `LABEL_HEIGHT * 1.9` **above** its node's projected
screen position, and the hub's label is drawn **inside** its circle (`centred: true`).
Both read as text on top of a filled colour. The spec moves every label below its own
circle, in screen space, by an amount derived from how big that circle currently looks —
and deletes the hub's special case. Nothing else about the label layer changes: same 24
slots, same font, same colour, same truncation, same declutter priority.

Two decisions carried in from the session that produced this plan:

- Spec **Areas of concern C-1 and C-2** were confirmed accepted by the product owner: a
  ring topic's label may now be suppressed by the root's, with no new collision rule; and
  a minimum-gap floor is wanted.
- The projected radius is computed from the node's **drawn** radius — `node.radius *
  scales[index]` — not its base radius. `graph-scene.tsx:212` scales the node mesh by that
  product for the hover (1.3×) and focus (1.2×) bumps, so a base-radius offset would let a
  hovered circle grow into its own label and break FR-2 for any `GAP_RATIO` below 0.3.
  This is a refinement of §9.1's formula in service of FR-2, not a scope change.

---

## Files changed

| File | Change |
| --- | --- |
| `src/app/graph/_components/graph-labels.tsx` | Add exported pure `labelOffsetPx(worldRadius, distance, viewportHeight, fovDegrees)` plus the two tuning constants `GAP_RATIO` and `MIN_GAP_PX`. Delete `centred` from `LabelPlacement`. `declutter`'s box collapses to one shape — `top: y`, `bottom: y + LABEL_HEIGHT`. `apply()`'s transform collapses to `translate(-50%, 0%)`. |
| `src/app/graph/_components/graph-scene.tsx` | In `updateLabels()`, call `labelOffsetPx` per labelled node with the node's drawn radius and the distance already computed for the fade, and emit `y: projectedY + offset`. Delete `centred: isRoot`; keep the `isRoot` fade exemption. `CAMERA_FOV` and `container.clientHeight` are already in scope. |
| `src/app/graph/_components/graph-labels.test.ts` | Delete the `centred` test. Add three `labelOffsetPx` tests (V-3, V-4, V-5) and one `declutter` test asserting the reserved box is below the anchor (V-6). |
| `CLAUDE.md` | Extend the "Labels are 10px…" bullet under **Graph data** with one sentence: placement is below the circle, scaled to its on-screen size and its live hover/focus scale, and the hub is not an exception. |

Nothing in `src/lib/graph/**` changes. No dependency, route, env var or seed change.

**Why the helper lives in `graph-labels.tsx`:** V-3/V-4/V-5 require unit tests isolated
from the GPU, and `graph-scene.tsx` cannot be imported by a test — it pulls in `three`.
`graph-labels.test.ts` already imports `graph-labels.tsx`, which imports only types.

## Sequence of work

1. **`labelOffsetPx` + its tests, alone.** Pure trigonometry, no call site yet.

   ```ts
   /** Tuning values, not invariants (spec §4 D-2, C-2) — sized by eye once built. */
   const GAP_RATIO = 0.35;
   const MIN_GAP_PX = 6;

   export function labelOffsetPx(
     worldRadius: number,
     distance: number,
     viewportHeight: number,
     fovDegrees: number,
   ): number {
     // A PerspectiveCamera's fov is the *vertical* angle, so half the viewport
     // spans `distance * tan(fov / 2)` world units — `overviewDistance()`'s
     // relationship, run in the other direction.
     const halfHeightWorld = distance * Math.tan((fovDegrees * Math.PI) / 360);
     const radiusPx =
       halfHeightWorld > 0 ? (worldRadius * viewportHeight) / (2 * halfHeightWorld) : 0;
     return Math.max(radiusPx * (1 + GAP_RATIO), MIN_GAP_PX);
   }
   ```

   Verifiable on its own: `npm test -- graph-labels`.

2. **Collapse `declutter` and `apply()` to the single below-anchor shape**, and delete
   `centred` from `LabelPlacement`. `y` now means the top of the text everywhere, so the
   box is `top: y`, `bottom: y + LABEL_HEIGHT`; `left`/`right` are untouched. Delete the
   `centred` test; add the below-the-anchor one. `npm run typecheck` fails here on the
   `centred: isRoot` in `graph-scene.tsx` — that is the next step, and the intended signal
   that there is exactly one call site.

3. **Wire it into `updateLabels()`.** Inside the `.map()`, after `const distance = …` and
   before `projected.project(camera)`:

   ```ts
   const drawnRadius = node.radius * scales[indexById.get(node.id)!]!;
   const offset = labelOffsetPx(drawnRadius, distance, height, CAMERA_FOV);
   ```

   and emit `y: ((1 - projected.y) / 2) * height + offset`. Drop `centred: isRoot`; keep
   the `isRoot` opacity exemption and its comment, trimmed of the "inside its circle"
   clause which is no longer true. `indexById`, `scales`, `height` and `CAMERA_FOV` are all
   already in the effect's closure — no new state, no new ref.

4. **Run the full proof** (below), then tune `GAP_RATIO` and `MIN_GAP_PX` by eye on the
   built page at several zoom levels and on a tablet-width viewport (V-9). The unit tests
   assert properties, not values, so tuning does not move them.

5. **Update `CLAUDE.md`** with the one-sentence record, in the same commit as step 3/4.

## Risks

- **The root's label can now suppress a ring topic's** (spec C-1, V-8). Accepted by the
  product owner; no new collision rule. Visible on the built page, not in a test.
- **`GAP_RATIO`/`MIN_GAP_PX` are unvalidated until step 4.** They are tuning numbers in the
  same family as `HOVER_SCALE` and `FOCUS_SCALE`; if they look wrong the fix is two numbers,
  not a redesign.
- **`declutter` and `apply()` must agree about where the text is** — the existing code
  comment says so and it is load-bearing. They are changed in the same step (2) for that
  reason. If they disagree, labels overlap on screen while every test passes.
- **The distance used is the euclidean camera-to-node distance, not view-space depth.**
  This is the number the spec names (§9.1) and the one the fade already uses. It
  over-estimates depth for a node near the frame edge, so that node's projected radius is
  under-estimated by up to ~1/cos(≈25°) ≈ 10%; `GAP_RATIO` at 0.35 absorbs it. Switching to
  a true view-space depth is a one-line change if step 4 shows it matters.
- **Riskiest step: 3.** If the sign or the anchor is wrong, every label lands above its node
  or half a line into it — immediately visible on the page, which is why V-1/V-2 are manual
  and are not optional.
- **Rollback:** `git revert` of the single implementation commit. No schema, seed, stored
  state or URL changes, so there is nothing to migrate back.

**Open questions from the intent:** all four were closed at the intent stage and are carried
into the spec's §3. This plan opens none.

## Proof

```bash
npm run typecheck && npm run lint && npm test
```

Unit assertions to exist and pass in `graph-labels.test.ts`:

- **V-3** — `labelOffsetPx(2.6, d, h, 50) > labelOffsetPx(0.42, d, h, 50)` for the same
  `d`, `h`, and proportional to the radius ratio above the floor.
- **V-4** — `labelOffsetPx(r, 20, h, 50) > labelOffsetPx(r, 80, h, 50)`.
- **V-5** — `labelOffsetPx(0.42, 100000, h, 50) === MIN_GAP_PX`.
- **V-6** — `declutter([at("A", 400, 300), at("B", 400, 285)])` keeps both (the box no
  longer reaches upward), and `declutter([at("A", 400, 300), at("B", 400, 308)])` drops the
  second. Existing `selectLabelled` tests unchanged and still green.

  *Deviation from the drafted plan:* the first case was written with B at `290`, ten
  pixels above A. That does not test what it says — `LABEL_HEIGHT` is 13, so B's own box
  (`290…303`) still overlaps A's (`300…313`) and the label is correctly dropped. The gap
  has to exceed a line height for the "nothing reaches upward" property to be the thing
  under test, hence `285`. The assertion is unchanged in kind.
- **V-11** — `layout.test.ts`, `tree.test.ts`, `graph-view.test.tsx` untouched and green.

Manual, on `npm run dev` at `/graph`:

- **V-1** — orbit a full 360° at three zoom levels: no name touches its own circle.
- **V-2** — the hub's name sits below its circle, outside it.
- **V-7** — DOM inspect: still exactly 24 `<span>` in the label layer.
- **V-8** — orbit until a ring topic's label sits under the hub's: the hub's survives.
- **V-9** — repeat V-1/V-2 at a 768×1024 portrait viewport.
- **V-10** — dev-tools frame counter: zero frames rendered while idle.

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
- **Put `Closes #38` in the PR body** — the `plan: node labels sit under the circle, never
  on it` task, opened when the spec was approved. It must be the GitHub keyword, on its own
  line, with the number: `Closes #38`. Prose like "closes the plan task" reads the same to a
  person and does nothing at all to GitHub, which is how a task survives the merge that
  completed it and sits open forever.

  This is the one link that closes the loop the whole trail hangs on — approved, planned,
  built, done, on one issue. `plan-ready.yml` already depends on it: it watches for the
  implementation PR's `Closes #n` to distinguish that merge from a product owner
  re-approving an amended spec, and skips the reopen it would otherwise do.
- **Say what is not done.** Manual checks you could not run, steps you skipped, values
  still to be tuned — in the PR body, not omitted because the tests are green.
