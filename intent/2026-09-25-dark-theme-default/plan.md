# Plan: dark theme as the default

- **Intent:** [`intent.md`](./intent.md) · **Spec:** [`spec.md`](./spec.md) (as amended by #70)
- **Plan task:** #68 · **Split out:** #69 (toggle icon/label mismatch, not in this change)
- **Stage:** 3 — plan

## Context

A visitor with no stored theme currently gets whatever their OS prefers, because the inline
script in `src/app/layout.tsx` leaves `data-theme` unset and `globals.css`'s
`@media (prefers-color-scheme: dark)` scope decides. The spec makes **dark** the default for
anyone without a stored `"light"`/`"dark"`, while keeping every explicit choice, the
two-position toggle and the no-flash guarantee. Decisions settled 2026-09-25 (spec, Areas of
concern): C-1 ship every page's existing dark look as-is; C-2 two positions; C-3 the toggle
fix is **not** in this change (#69); C-4 silent switch is fine; C-5 no-JS gap accepted.

The whole behavioural change is the body of one inline script. Everything else in this plan
exists to make that string testable.

## Files changed

| Path | What happens |
| --- | --- |
| `src/lib/theme-script.ts` | **New.** Exports `THEME_SCRIPT`, the string moved out of `layout.tsx`, with the spec §9.1 body: read `localStorage` inside `try`, `setAttribute` **outside** it, anything but `"light"`/`"dark"` → `"dark"`. Never writes storage. |
| `src/lib/theme-script.test.ts` | **New.** Executes the exact exported string in jsdom and asserts V-1–V-4, V-8, V-9 (below). |
| `src/app/layout.tsx` | Drops its local `THEME_SCRIPT` const, imports it from `@/lib/theme-script`. The `<script dangerouslySetInnerHTML>` line, its comment and `suppressHydrationWarning` stay. |

**Why the string moves:** V-8 and V-9 need a unit test of the script's logic, and
`layout.tsx` cannot export it — Next's type check rejects non-standard exports from a layout
file. `src/lib/` is the right home: it's a plain string with no framework import, which is
`lib/`'s rule. The server/client boundary is unchanged — `layout.tsx` is still a server
component importing a constant.

**Not changed (spec §7, §9.4):** `globals.css` (all three scopes stay; the media-query one
still serves no-JS visitors, C-5), `ui-store.ts`, `theme-toggle.tsx`, `theme-toggle.test.tsx`,
`use-theme-tokens.ts`, `CLAUDE.md`, `next.config.ts` (CSP is `script-src 'self'
'unsafe-inline'` Report-Only with no hash, so editing the script body needs no CSP change),
anything under `src/lib/graph/`.

## Sequence of work

1. **Write the failing test first.** Create `src/lib/theme-script.test.ts` importing
   `THEME_SCRIPT` from `@/lib/theme-script` (file does not exist yet → red). Helper:
   `run = () => new Function(THEME_SCRIPT)()`. `beforeEach`:
   `document.documentElement.removeAttribute("data-theme")`, `localStorage.clear()`,
   `vi.restoreAllMocks()`. Cases:
   - nothing stored → `data-theme === "dark"` (V-1/V-2: the script never consults
     `matchMedia`, so OS setting cannot matter; assert that by stubbing
     `window.matchMedia` to report light and checking it was not called).
   - `"light"` stored → `"light"` (V-3).
   - `"dark"` stored → `"dark"` (V-4).
   - junk stored (`"blue"`, `""`, `'"dark"'`) → `"dark"` (spec §10 strict equality).
   - nothing stored → after run, `localStorage.getItem("theme")` is still `null`, and a
     `vi.spyOn(Storage.prototype, "setItem")` was never called (V-8).
   - `vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw … })` →
     no throw escapes, `data-theme === "dark"` (V-9).
   - **Verify:** `npx vitest run src/lib/theme-script.test.ts` fails on the missing module.
2. **Create `src/lib/theme-script.ts`** with a short comment pointing at spec §9.1 and the
   two load-bearing rules (read-only; attribute set outside `try`), and the body verbatim
   from spec §9.1. **Verify:** step 1's file is green.
3. **Point `layout.tsx` at it.** Delete the local const, add
   `import { THEME_SCRIPT } from "@/lib/theme-script";`. Update the `{/* Sets data-theme… */}`
   comment to say it always sets it (dark unless `"light"` is stored). **Verify:**
   `npm run typecheck` and `npm run build` pass (build proves the layout still prerenders
   and nothing crossed the client boundary).
4. **Full proof** — everything in the Proof section, including the manual browser checks.

Each step is one small edit; steps 1–3 can be one commit.

## Risks

- **Existing behaviour this deliberately breaks:** anyone on a light-OS device with no
  stored theme — first-timers *and* long-time visitors who never clicked the toggle — now
  get dark, silently (spec C-4, accepted). OS changes mid-session no longer move the page
  for JS visitors, since `data-theme` is always set; `use-theme-tokens.ts`'s `matchMedia`
  listener becomes a harmless no-op for them (left in place — it still matters when the
  attribute is absent, i.e. no JS, and #69 may revisit it).
- **Known, accepted wart until #69 lands:** the toggle's store still starts at `"light"`,
  so over the new dark default it shows the moon / "Switch to dark theme", and the first
  click writes `"dark"` explicitly — a visible no-op — before the second click reaches
  light. Theme on screen and what's remembered stay correct. Record this in the PR body.
- **Riskiest step: the script string itself (step 2).** A syntax error or a throw outside
  the `try` means `data-theme` is never set: the page silently falls back to the old
  OS-driven behaviour (still no flash, still correct light/dark tokens) — so it would
  *look* fine on a dark-OS dev machine. That is why the test executes the exact exported
  string rather than a re-implementation, and why the manual check below uses a
  **light**-OS emulation. The one statement outside `try` is `setAttribute` on
  `document.documentElement`, which exists in `<head>` scripts in every supported browser.
- **Hydration:** unchanged surface — `data-theme` was already client-only on `<html>` for
  anyone with a stored value, and `suppressHydrationWarning` already scopes it. Now it is
  present for everyone; the dev console must stay free of hydration warnings.
- **What depends on the attribute:** `globals.css`'s `[data-theme]` selectors, the graph
  scene via `use-theme-tokens.ts` (reads computed styles, observes the attribute), and
  `ui-store.setTheme`. None needs changing; none reads the attribute's *absence*.
- **Rollback:** revert the one commit. Nothing is migrated or written — the default is
  never stored (V-8) — so after a revert every visitor without an explicit choice is
  exactly back on OS-follow, and explicit choices are untouched.

## Proof

Run from the repo root; all must pass.

```bash
npx vitest run src/lib/theme-script.test.ts       # V-1–V-4 logic, V-8, V-9
npm test                                          # V-7 (toggle test unmodified), V-10, V-11
npm run typecheck && npm run lint                 # V-11
npm run build                                     # layout still a server component, still prerenders
rg -n 'process\.env\.' src --glob '!src/lib/env.ts'   # must print nothing
git diff --stat main -- src/components src/stores src/hooks src/app/globals.css src/lib/graph CLAUDE.md
                                                  # must print nothing (spec §9.4)
```

Manual, `npm run build && npm start`, Chrome, **new incognito window each time** (fresh
profile = empty storage). DevTools → Rendering → *Emulate CSS prefers-color-scheme*;
Network → *Slow 4G* for the flash check:

| # | Setup | Expect |
| --- | --- | --- |
| V-1 | emulate **light**, nothing stored, open `/`, `/graph`, a topic page | all dark; `document.documentElement.dataset.theme === "dark"`; `localStorage.getItem("theme") === null` (V-8) |
| V-2 | emulate dark, nothing stored | dark |
| V-3 | `localStorage.setItem("theme","light")`, reload, emulate dark | light |
| V-4 | `localStorage.setItem("theme","dark")`, reload, emulate light | dark |
| V-5 | each of the above on Slow 4G, hard reload | no frame of the other theme before settle |
| — | fresh window, click toggle twice | 1st click: no visible change, stores `"dark"` (known, #69); 2nd: light, stores `"light"`, survives reload (FR-5, FR-8) |
| — | console on every load above | no hydration warning |

If the manual table can't be run, say so in the PR body — don't substitute the unit test for it.

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

For this change the issue is **#68** (`Closes #68`). Do **not** close #69 — it is separate work.
