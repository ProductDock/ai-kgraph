# Plan: lower the gap between connected nodes

- **Intent:** [`intent.md`](./intent.md) — *lower the gap between connected nodes*
- **Spec:** [`spec.md`](./spec.md) — approved by @GoodbyePlanet, commit `c86f9d1`
- **Task:** `plan: lower the gap between connected nodes` — issue #42
- **Stage:** 3 — plan (AI-Native SDLC, lesson 4)

## Context

`/graph` opens on a view of the whole tree that is pulled well back: a lot of empty space
between the four ring topics, between a parent and its children, and around the outside.
That opening view is the first thing every visitor sees, so the emptiness is the app's
first impression rather than an edge case (intent, **Problem**).

The fix is one proportion applied to the whole layout: every shell moves inward by the
same factor, angles untouched, node sizes untouched. `overviewDistance()` already fits the
camera to the actual node positions, so a smaller tree brings the opening camera closer on
its own and every circle subtends a bigger angle — that is the entire mechanism behind
FR-1 and FR-2, and it needs no code of its own.

The spec proposed `k = 0.6` (a 40% reduction) and flagged, as **C-1**, that it could not
run the app's own all-pairs no-touching check to confirm that figure was safe. **That check
has now been run, during this planning session, against the real layout** — results in
**Risks** below. `k = 0.6` clears it with margin; the hard floor is `k > 0.44`. C-1 is
therefore closed before implementation starts, exactly as the spec asked. C-2 and C-3 ask
nothing of anyone today and are carried forward as recorded notes, not blockers.

## Files changed

| File | What happens to it |
| --- | --- |
| `src/lib/graph/layout.ts` | `RING_RADIUS` `20 → 12`, `SHELL_GAP` `12 → 7.2` (a shared `×0.6`). No other line changes — `shellRadius()`, `layout()` and every angle-producing function already treat both as plain numbers. Their doc comments gain the measured floor (`k > 0.44`) so the next person tightening this knows where the cliff is. |
| `src/app/graph/_components/graph-scene.tsx` | The camera's closest approach stops being derived from the ring. `RING_CLEARANCE` (`1.15`) and the `ringRadius` reduce that fed it are deleted; a new module constant `MIN_ORBIT_DISTANCE = 23` — today's computed value, `20 × 1.15` — replaces the local `minOrbitDistance` at all four of its uses (`controls.minDistance`, the two `keepOutsideRing()` clamps, and `overviewDistance()`'s starting floor). `ringNodes` stays: `openingAzimuth` still needs it. Nothing else in the file changes. |
| `src/lib/graph/palette.ts` | The `GROUP_RADIUS` doc comment quotes two measured *distances* that shrink with everything else: `5.98 → 3.59` apart, `anything past ~2.39 → ~1.43` fails. Its closing claim "clears it by more than 2x" becomes false at the new scale and is rewritten to the measured `~1.37×`. `GROUP_RADIUS` itself is unchanged. |
| `CLAUDE.md` | Two bullets under **Graph data** quote numbers this change moves: the `GROUP_RADIUS` bullet repeats the same `5.98` / `~2.39` pair, and the camera-fence bullet says "inside a ring of radius 20" (now `12`; the `6.2` measurement it sits next to still stands — it is about removing the clamp, not about the ring's size). |
| `src/lib/graph/layout.test.ts` | **Untouched.** Its pairwise-floor, wider-gap and non-interleaving tests are the acceptance gate for this change and must pass unmodified. Editing this file to make the change fit would be the one move this plan forbids. |

## Sequence of work

1. **Record the baseline.** `npm test` (66 tests, green on `main` as of `c86f9d1` — verified
   during planning). Screenshot `/graph` on first load, before any change, at a normal
   desktop window size. That screenshot is half of V-4/V-5 and cannot be taken afterwards.
2. **Change the two layout constants** in `layout.ts` to `12` and `7.2`, and extend their
   doc comments with the measured floor. Verifiable on its own: `npx vitest run
   src/lib/graph/layout.test.ts` must be green, with no edit to the test file.
3. **Fix the camera fence** in `graph-scene.tsx`: add `MIN_ORBIT_DISTANCE = 23`, delete
   `RING_CLEARANCE` and the `ringRadius` reduce, point the four call sites at the new
   constant. Verifiable on its own: `npm run typecheck` and `npm run lint` clean (an
   orphaned `ringRadius` or `RING_CLEARANCE` fails lint as an unused binding — that is the
   step's own check that nothing was half-removed).
4. **Update the two doc sites** — `palette.ts`'s comment and the two `CLAUDE.md` bullets —
   with the recomputed figures from §Proof. Do this in the same commit as step 2; a
   comment that quotes a ceiling this change has moved is how the next person mis-tunes
   `GROUP_RADIUS`.
5. **Run the full gate:** `npm test`, `npm run typecheck`, `npm run lint`.
6. **Look at it.** `npm run dev`, open `/graph`, compare against the step-1 screenshot
   (V-4, V-5); zoom in as far as the camera allows and confirm it stops at the same
   absolute distance as before (V-6); click a node and confirm the after-click framing is
   unchanged (V-7); idle the page and confirm zero frames render (V-8).
7. **Report and stop.** Post the before/after pair and the proof output, and ask the
   originator to judge the figure in the running app (V-11). If he asks for tighter, the
   only number that moves is `k` in step 2 — and it may not go below `0.44` (see Risks).

## Risks

**The all-pairs separation floor — measured, not assumed.** Run during planning against the
real `layout()` over both seeds the test uses:

| Seed | Tightest pair | Distance | Floor | Ratio | Smallest safe `k` |
| --- | --- | --- | --- | --- | --- |
| day-one (36) | `pd-ai` ↔ `pd-ai/ai-agents` (hub ↔ ring) | 20.00 | 6.50 | 3.08 | 0.325 |
| synthetic (148) | `ai/area-5/topic-0` ↔ `ai/area-5/topic-3` | 5.979 | 2.625 | **2.278** | **0.439** |

Every position scales by exactly `k` and no radius does, so every ratio scales by exactly
`k`. **The binding case is the 148-node synthetic seed: `k` must stay above `0.439`.** At
`k = 0.6` the tightest ratio is `1.367` — real margin, and the reason the spec's figure is
`0.6` rather than the tightest number that technically passes. This closes spec concern
**C-1**: the figure has been checked against the app's own gate before anything is shown
for judgement.

**The riskiest step is step 2, and it fails loudly.** If `k` were pushed below `0.44`, the
pairwise test fails in CI — not silently on screen. The failure mode that *would* be silent
is editing `layout.test.ts` to accommodate it, which is why the file is listed as untouched
above. The intent is explicit: tighter spacing does not get to buy room by relaxing the
floor.

**The centre-to-ring margin narrows faster than `k`.** `HUB_RADIUS` does not scale, so the
wider-gap test's margin is `(k·20 − 2.6) − k·12`: `45%` today, `31%` at `k = 0.6`, gone
entirely at `k ≈ 0.325`. Safe here, asserted by an existing test, and the reason a future
"much tighter" request needs the deferred per-gap proportion (spec §2.3) rather than a
smaller shared `k`. Spec concern **C-2**, unchanged.

**What existing behaviour changes:** more labels will be dropped at the overview (accepted,
intent + FR-9); the closest reachable zoom now shows the graph smaller relative to today,
because the fence stays absolute while the tree shrinks (accepted, FR-7). Both were put to
the originator and accepted before the spec was written. Nothing else depends on these
constants — `grep` finds `RING_RADIUS`/`SHELL_GAP` only in `layout.ts` and prose, and
`RING_CLEARANCE` only in `graph-scene.tsx`.

**What does not become a problem yet:** `overviewDistance()` floors its search at
`MIN_ORBIT_DISTANCE`, now fixed at `23`. Simulated against the real positions at `k = 0.6`,
the fitted opening distance is `58.3` on 16:9 and `129.2` on a 9:16 phone — nowhere near
the floor, so the clamp never binds. It would, eventually, if this were tightened much
further. Spec concern **C-3**, recorded, not solved.

**Rollback:** `git revert` the implementation commit. The change is two numbers, one
constant and four prose figures; there is no data, no migration and no persisted state, so
a revert restores today's scene exactly.

**Open questions left by the intent:** all five were answered before the spec (spec §3) and
this plan closes the last spec-level one (C-1) with measurement. The only thing outstanding
after the build is V-11 — the originator's judgement of the figure in the running app —
which is a decision, not an unknown.

## Proof

Run from the repo root, after the change:

```bash
npm test && npm run typecheck && npm run lint
```

- **V-1/V-2/V-3** — `layout.test.ts` passes **unmodified**: the all-pairs floor over both
  the day-one and 148-node seeds, the hub-to-ring-is-widest assertion, and the
  no-interleaving assertion. 66 tests green, same count as the baseline.
- **V-9** — the same run covers `tree.test.ts`, `colour.test.ts`, `graph-labels.test.ts`,
  `graph-view.test.tsx`, `tween.test.ts`.

Re-measure the numbers that go into the doc comments (this is the source of the figures in
step 4 — run it and copy from the output, do not transcribe them from this plan):

```bash
npx tsx -e '
import { layout } from "@/lib/graph/layout";
import { radiusForNode } from "@/lib/graph/palette";
import { flatten } from "@/lib/graph/tree";
const children = Array.from({ length: 7 }, (_, a) => ({ name: `Area ${a}`, children: Array.from({ length: 4 }, (_, t) => ({ name: `Topic ${t}`, children: Array.from({ length: 4 }, (_, d) => ({ name: `Detail ${d}` })) })) }));
const tree = flatten({ name: "AI", children } as never).nodes;
const p = layout(tree);
let min = Infinity, pair = "";
for (let i = 0; i < tree.length; i++) for (let j = i + 1; j < tree.length; j++) {
  const a = tree[i]!, b = tree[j]!, pa = p.get(a.id)!, pb = p.get(b.id)!;
  const d = Math.hypot(pa[0]-pb[0], pa[1]-pb[1], pa[2]-pb[2]);
  const ratio = d / (2.5 * Math.max(radiusForNode(a), radiusForNode(b)));
  if (ratio < min) { min = ratio; pair = `${a.id} <-> ${b.id} d=${d.toFixed(2)} ratio=${ratio.toFixed(3)} ceiling=${(d / 2.5).toFixed(2)}`; }
}
console.log(pair);
'
```

Expected at `k = 0.6`: closest pair `3.59` apart, `GROUP_RADIUS` ceiling `~1.43`, ratio
`1.37`. Those three numbers are what `palette.ts` and `CLAUDE.md` must end up quoting.

Manual, on `npm run dev` at `/graph`, against the step-1 baseline screenshot:

- **V-4/V-5** — same window size, first load, before vs after: the tree fills visibly more
  of the canvas and every circle is visibly bigger (expect roughly `1/0.6 ≈ 1.67×` apparent
  size; the simulated opening distance drops `96.6 → 58.3` on a 16:9 window).
- **V-6** — scroll in as far as the camera allows; the camera's distance from the origin
  bottoms out at `23`, the same absolute value as today. Check in dev tools or by comparing
  side by side with a build of `main`.
- **V-7** — click a node: its framing, and its parent/children framing, are unchanged.
- **V-8** — leave the page idle with the camera still: zero frames render.
- **V-10** — read `palette.ts` and the two `CLAUDE.md` bullets back and confirm they quote
  the recomputed figures.
- **V-11** — show the originator, ask for tighter / looser / as-is. Anything tighter than
  `k = 0.44` is off the table without the deferred per-gap work (spec §2.3).

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
- **Put `Closes #42` in the PR body, naming the `plan: <slug>` issue** — the task
  `plan-ready` opened when the spec was approved. It must be the GitHub keyword, on its
  own line, with the number: `Closes #42`. Prose like "closes the plan task" reads the
  same to a person and does nothing at all to GitHub, which is how a task survives the
  merge that completed it and sits open forever.

  This is the one link that closes the loop the whole trail hangs on — approved,
  planned, built, done, on one issue. `plan-ready.yml` already depends on it: it watches
  for the implementation PR's `Closes #n` to distinguish that merge from a product owner
  re-approving an amended spec, and skips the reopen it would otherwise do.

  If you cannot find the issue number, ask rather than guessing or omitting it.
- **Say what is not done.** Manual checks you could not run, steps you skipped, values
  still to be tuned — in the PR body, not omitted because the tests are green.
