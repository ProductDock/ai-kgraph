# Spec: dark theme as the default

- **Intent:** [`intent.md`](./intent.md) — *dark theme as the default*
- **Originator:** Nemanja
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** awaiting product owner and engineering review

## Review guide

This spec has two audiences, split so each can stop where their job ends.

- **Product owner:** read **Part A** and **Areas of concern**. Between them you have
  everything you need to approve, redirect, or cut a decision — what a visitor sees, what
  the intent's own open questions were closed as, and where this spec had to make a call in
  your name. No file names, code, schemas, or rendering mechanics appear in Part A; where a
  technical choice has a consequence you'd care about, it's stated as that consequence, with
  a pointer into Part B for whoever wants the mechanics.
- **Engineering:** read Part A for the same context the product owner has, then Part B,
  which is where the build actually lives, then **Areas of concern**.
- **Both:** every item in **Areas of concern** is written so the product owner can act on it
  without reading Part B.

Section numbers run continuously across both parts, so a cross-reference like "see §9.2"
always points at the same place no matter which part you're in.

---

## Part A - Product

### 1. Summary

Today, a visitor who has never touched the theme toggle sees whatever their device already
prefers — light, on most devices, most of the time. That means the graph, the one thing the
intent says people actually come here for, is usually seen in light on a first visit, and
only reached in dark by whoever happens to notice and click the toggle.

This spec makes dark the theme everyone sees until they say otherwise, on every page, on
every device, regardless of what that device prefers. Anyone who has ever explicitly picked
light with the toggle keeps seeing light, exactly as today and exactly as remembered today —
this is a change to what happens before someone has made a choice, not a change to any choice
already made. The toggle itself, and light mode itself, both stay exactly as fully supported
as they are now.

Making this change well surfaces one more thing worth fixing at the same time: the toggle
button itself has a small, already-known display glitch (unrelated to this change, and
already on record — see §9.3) where it can briefly show the wrong option for the theme
actually on screen. Today that only affects a minority of visitors. Once dark is what nearly
every new visitor sees, that same glitch would show up for nearly everyone, so this spec
fixes it as part of the same piece of work (§4, decision 2).

### 2. Scope

#### 2.1 In scope

- Dark as the theme every first-time visitor — or anyone who has never used the toggle,
  including someone who cleared their browser data or is in a private window — sees on
  every page, regardless of their device's own setting.
- Light stays fully reachable: clicking the toggle still switches to it, and that choice is
  still remembered exactly as it is today.
- The toggle's own icon and wording always match the theme actually shown the moment a page
  appears, including for a first-time visitor now seeing dark without having clicked
  anything (§1; §4, decision 2).
- No visible flash of the wrong theme while a page loads, for any visitor, under the new
  default or under a remembered choice — the same guarantee the app already gives today.

#### 2.2 Out of scope

Restated from the intent, so nothing below is quietly folded into this piece of work:

- No new "follow my device" position on the toggle — it keeps exactly the two positions it
  has today, light and dark (§3, Q3; Areas of concern, C-2).
- No redesign of what dark mode looks like anywhere in the app — every page keeps exactly
  the dark appearance it already has today when dark is selected (§3, Q2; Areas of concern,
  C-1).
- No on-screen message or notice for visitors who see the look change automatically, without
  having done anything themselves (§4, decision 3; Areas of concern, C-4).
- No change to how or where a chosen theme is remembered, beyond what's needed to keep the
  new default from ever being recorded as if it were a real choice (§4, decision 1).

#### 2.3 Deferred

- A visual quality pass across the home page and topic pages, specifically checking how they
  read in dark mode as a first impression rather than as something only reached by opting in
  — should Areas of concern C-1 come back asking for one.
- A three-position toggle ("light / dark / follow my device") — should Areas of concern C-2
  come back asking for one.

### 3. Decisions that close the open questions

The intent left three open questions. This spec closes two of them outright and answers the
third only procedurally, carrying the substance of it forward as a concern rather than a
closed decision.

| # | Open question | Status |
| --- | --- | --- |
| Q1 | Should a visitor whose device is explicitly set to light still get dark on first visit? | **Closed: yes.** The default ignores the device's own setting entirely for anyone who hasn't made an explicit choice. This isn't a new call this spec is making on the intent's behalf — it's exactly the behaviour the intent's own check already describes (open the app with the device set to light, and it opens in dark), so this spec simply states it as a firm requirement rather than leaving it open (§5, FR-1). |
| Q2 | Do the parts of the app beyond the graph look and read as well in dark as the graph does? | **Not fully closed.** This spec makes no new visual changes anywhere — every page keeps using exactly the dark appearance it already has today when dark is selected. Whether that appearance reads well as most visitors' *first* impression, rather than something only ever reached by opting in, is a question this spec can't answer on its own; it's carried to **Areas of concern, C-1**. |
| Q3 | Should the toggle offer a way back to "follow my device," or are two states enough? | **Closed: two states are enough.** The toggle keeps exactly its current shape. The trade-off this carries is written up in **Areas of concern, C-2**. |

### 4. Decisions added beyond the intent

The intent settled the shape of the outcome. Making it buildable needed a small number of
further judgment calls the intent didn't spell out. None of these should be read as settled
just because they're written down — confirm or cut each one.

1. **Choosing dark because nothing has been chosen yet is never written down as if it were a
   real choice — only an actual click on the toggle is remembered as one.** The practical
   effect: if the default is ever changed again in the future, that change would only affect
   people who *still* haven't touched the toggle by then. Anyone who has explicitly picked
   light or dark at any point keeps that pick forever, until they change it themselves
   (§9.2). **Confirm this is the right way to think about "remembered" versus "default."**
2. **This spec also closes a small, already-known display glitch in the toggle**, first
   flagged as a follow-up in an earlier piece of work and not yet fixed: right now, the
   toggle can show the wrong icon and wording for the theme actually on screen, for as long
   as it takes a visitor's first click to correct it. Today that only affects visitors whose
   device already prefers dark — a minority. Once dark is the default nearly everyone sees,
   this same glitch would show up for nearly every first-time visitor instead, so this spec
   fixes it as part of the same change rather than shipping a toggle that visibly
   contradicts the page underneath it for most new visitors (§9.3; Areas of concern, C-3).
   **Confirm this small addition to scope is fine, or ask for it to ship as its own,
   separate change** — with the trade-off that the toggle would then visibly show the wrong
   thing to most new visitors for however long the two pieces of work are apart.
3. **Someone who already visits regularly today, on a light-preferring device, and has
   simply never touched the toggle, will see the site's whole look change the next time they
   open it after this ships — with nothing on screen explaining why.** The intent already
   frames this group as intentionally affected, not as an edge case, so this spec doesn't add
   any explanation for it (§9.1; Areas of concern, C-4). **Confirm a silent switch like that
   is acceptable, or ask for a small one-time explanation the first time it happens.**
4. **Visitors browsing with JavaScript switched off, or with their browser blocking the
   site's ability to remember anything, keep seeing whatever their device already showed
   them — they don't get the new dark default at all.** This is narrow, and it's already true
   today in a different shape: the toggle itself needs JavaScript to work at all, and always
   has. This spec doesn't close that gap or make it any wider (§9.1; Areas of concern, C-5).
   **Confirm this narrow, pre-existing gap doesn't need closing as part of this piece of
   work.**

### 5. Functional requirements

Each of these is something you can point at, or tap, on screen; verification is §11.

- **FR-1.** A visitor whose browser holds no remembered theme choice — a first-time visitor,
  someone who cleared their browser data, or a private window — sees dark on every page, no
  matter what their device's own setting is (§3, Q1).
- **FR-2.** A visitor who has ever explicitly chosen light using the toggle keeps seeing
  light on every later visit in that same browser, unaffected by this change.
- **FR-3.** A visitor who has ever explicitly chosen dark using the toggle keeps seeing dark
  exactly as before — this change doesn't alter what dark looks like or how it's remembered.
- **FR-4.** No page ever visibly flashes the wrong theme before settling on the right one —
  neither the new dark default nor a remembered choice — on any device the app already
  supports.
- **FR-5.** The toggle still offers exactly two positions, light and dark; clicking it always
  sets an explicit, remembered choice, exactly as today (§3, Q3).
- **FR-6.** The toggle's icon and wording always match the theme actually shown on screen the
  instant a page appears — including for a first-time visitor now seeing dark without having
  clicked anything (§4, decision 2).
- **FR-7.** The graph and everything on it (including the statistics panel), and every other
  themed part of the app, render in dark by default for a first-time visitor exactly as they
  would if that visitor had clicked "dark" themselves — nothing about how the change is
  applied treats the graph differently from any other page.
- **FR-8.** Switching theme with the toggle behaves exactly as it does today in every other
  respect: instant, page-wide, and remembered for the visitor's next visit.

Checkable, in the intent's own words: open the app in a fresh browser profile with the device
set to light, and it opens in dark.

### 6. Risks

| Risk | Why it matters |
| --- | --- |
| **A visitor who already comes back regularly, and has simply never touched the toggle, will see the site's look change without warning the next time they open it after this ships** (§4, decision 3). | This isn't limited to true first-time visitors the way "first impression" language suggests — it includes anyone, however long they've been coming back, who happens to have never clicked the toggle. Some of them may read the sudden change as something broken rather than intended. |
| **The parts of the app outside the graph haven't been specifically checked for how well they read in dark** (§3, Q2). | These pages are about to become most new visitors' actual first impression of dark mode, rather than something only people who deliberately opted in ever saw. If anything reads poorly there, far more people notice it than would have before this change. |
| **Once a visitor touches the toggle even once, there's no way back to "just match my device"** except clearing their browser data or using a fresh profile (§3, Q3). | Someone who actually wants "whatever my device says" gets that for free today by doing nothing. After this ships, that only lasts until the first time they touch the toggle at all — including by accident. |
| **If the toggle's own display glitch (§4, decision 2) doesn't get fixed alongside this change**, the toggle would show the wrong option to nearly every first-time visitor, not just the minority it affects today. | A toggle that visibly disagrees with the page underneath it looks broken, and undermines confidence in the rest of the change even though the actual theme shown is correct. |
| **Visitors without JavaScript, or with it blocked, don't get the new default at all** (§4, decision 4). | They keep following their device's own setting exactly as before — a narrow, already-existing gap this change doesn't close, worth knowing about so it isn't mistaken for a bug later. |

---

## Part B - Technical design

### 7. How this fits the existing app

There is no third-party theme library in this app — no dependency is added or upgraded by
this change. The existing mechanism is a small inline script that runs before the page
paints, a CSS attribute the rest of the stylesheet already keys off, and a small Zustand
store that only backs the toggle button's own icon and label. This spec touches all three,
plus their existing tests and documentation, and nothing else.

| File | Change |
| --- | --- |
| `src/app/layout.tsx` | The inline script's body (`THEME_SCRIPT`) changes so that whenever the visitor's stored preference is anything other than the literal strings `"light"` or `"dark"` — including no stored value at all — it sets `data-theme="dark"` on `<html>` directly, instead of leaving the attribute unset. It never writes to `localStorage` itself, only reads it, so applying the default is never recorded as if it were a choice (§9.1; §4, decision 1). |
| `src/stores/ui-store.ts` | Gains one new action, `hydrate`, that copies whatever `data-theme` the script above already set on `<html>` into the store's own `theme` field, without touching `localStorage`. The store's hardcoded initial value of `"light"` is unchanged — it's now only ever the value visible for the instant before `hydrate` runs (§9.3). |
| `src/components/common/theme-toggle.tsx` | Calls `hydrate()` once, in an effect that runs right after mount — the same point the component already waits for before rendering the real button in place of its placeholder. This is what makes the icon and label match the theme already on screen, including for a first-time visitor seeing the new dark default (§9.3; closes the defect recorded as C-12 in `intent/2026-09-16-ai-knowledge-graph-3d/spec.md`). |
| `src/components/common/theme-toggle.test.tsx` | Gains a case: with `data-theme="dark"` already set on `document.documentElement` before the component mounts (standing in for the inline script having already run), the toggle renders showing "Switch to light theme" immediately, not the stale placeholder state. The existing click-toggle case is unchanged (§11, V-6, V-7). |
| `src/hooks/use-theme-tokens.ts` | Its doc comment currently says the store "is never hydrated... so it does not describe the DOM." That's no longer accurate once `hydrate` exists, so the comment is updated to keep its conclusion — the scene still reads the DOM directly, never the store — on its real, current basis: the store is the toggle's own display state, not a general theme source of truth, not because it's broken (§9.4). |
| `CLAUDE.md` | The existing note that `useUiStore` "hardcodes `theme: "light"` and never hydrates" is updated to describe the store's new, corrected behaviour, keeping the instruction not to use it for anything beyond the toggle (§9.4). |

Nothing in `globals.css`, `palette.ts`, `colour.ts`, `layout.ts`, or anywhere under
`src/lib/graph/` changes. Dark mode's actual colour values, and every validated
contrast/palette rule that already covers them, are untouched by this spec (§9.4).

### 8. Non-functional requirements

- **No new dependency.** The existing hand-rolled mechanism (inline script, CSS attribute
  scopes, one Zustand store) is extended, not replaced.
- **No new environment variable**, consistent with the app's rule that `process.env` is read
  in exactly one place and theme has never needed one.
- **No change to the server/client boundary.** `layout.tsx` stays a server component; only
  the literal string passed to its existing inline `<script>` changes. `Providers` and the
  rest of the client tree are untouched (CLAUDE.md, "Client-boundary trap").
- **No new network request, subscription, or polling** of any kind. Theme stays a purely
  local, client-side preference, exactly as the intent's own "Data: none" note states.
- **No change to prerendering.** Nothing about this touches data fetching, dynamic APIs, or
  the route's ability to prerender.
- **The existing no-flash guarantee is preserved, not just for the default case but for
  every combination this spec introduces** — see §9.1 for the one edge case (storage access
  throwing) that needed a small adjustment to keep holding.

### 9. Design

#### 9.1 Default resolution: the inline script

The script that runs in `<head>`, before first paint, currently reads:

```js
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
```

When nothing is stored — the case this spec changes — it does nothing at all, leaving
`data-theme` unset, so the stylesheet's own `@media (prefers-color-scheme: dark)` scope (one
of the three theme scopes `globals.css` declares) is what decides, i.e. the device's own
setting. This spec changes it to:

```js
(function () {
  var stored = null;
  try {
    stored = localStorage.getItem("theme");
  } catch (e) {}
  document.documentElement.setAttribute(
    "data-theme",
    stored === "light" || stored === "dark" ? stored : "dark",
  );
})();
```

Two things about this are load-bearing:

- **It only ever reads `localStorage`, never writes it.** Applying the default doesn't
  create a stored value where none existed, which is exactly what keeps "no stored value" and
  "explicitly chose dark" distinguishable from each other going forward (§4, decision 1; §9.2).
- **Setting the attribute is moved outside the `try`.** In the current script, if reading
  `localStorage` throws (some private-browsing modes, or a browser extension blocking
  storage), the whole block is skipped and the attribute is left unset — today that falls
  back to the device's own setting via the CSS media-query scope, which was an acceptable
  fallback under the old default. Under the new default, leaving the attribute unset in that
  narrow case would silently produce the old behaviour instead of the new one, so the
  attribute is now always set to a definite value, with `stored` simply staying `null` (and
  therefore resolving to `"dark"`) if the read failed.

`globals.css`'s three scopes (the plain `:root` light values, the `@media
(prefers-color-scheme: dark)` scope, and the explicit `:root[data-theme="dark"]` scope) are
**not changed**. For any visitor whose browser actually runs this script, `data-theme` is now
always set to a definite value before paint, which makes the media-query scope effectively
unreachable for them — but it's deliberately left in place rather than removed, because it's
still the only thing that produces *any* reasoned theme (the device's own setting, which is
strictly better than nothing) for the one case this script can never reach at all: a visitor
with JavaScript disabled, for whom no inline script runs and no attribute is ever set (§4,
decision 4; Areas of concern, C-5). Restructuring `globals.css` so its unstyled base is dark
instead of light would close that last gap too, but at the cost of touching the same
extensively validated, three-scope token structure `palette.contract.test.ts` and CLAUDE.md's
"Graph data" rules hold in place for reasons unrelated to this change — this spec treats that
as out of proportion to a default-only change and leaves it untouched.

#### 9.2 Why "explicit" has to stay distinguishable from "default"

The intent's constraint is "do not override a choice someone already made." The existing
storage scheme already has exactly one signal for this: whether the `"theme"` key is present
in `localStorage` at all. Today, "absent" always means "never chosen, follow the device," and
"present" always means "explicit." This spec's script (§9.1) preserves that exactly — it
changes what happens when the key is absent, not what the key's presence or absence means —
so no second flag or second storage key is needed to tell "explicitly dark" apart from
"defaulted to dark." Both render identically, and that's fine: the only place the distinction
ever matters is whether a *future* default change should affect a given visitor, and by then
the same key-presence check still answers that correctly.

#### 9.3 Fixing the toggle's own display mismatch

`src/stores/ui-store.ts` initialises `theme` to `"light"` unconditionally, on purpose — at
the point the store's initializer runs, there is no `document` to read (it must also work
during server rendering), so it can't safely start from the real value. Nothing has ever
corrected that guess afterwards. This was already flagged as a known, deliberately deferred
defect in an earlier piece of work (`intent/2026-09-16-ai-knowledge-graph-3d/spec.md`, concern
C-12): the graph scene itself was built to read the theme directly off the DOM instead of off
this store specifically because the store couldn't be trusted (`src/hooks/use-theme-tokens.ts`),
and fixing the store itself was scoped out as "a separate small PR."

This spec is that PR, folded in here rather than kept separate, because the two changes
interact: before now, the mismatch only showed up for visitors whose device already preferred
dark — a minority, and one nobody had prioritised fixing. Once dark is the default nearly
everyone sees, the same mismatch would show up for nearly every first-time visitor instead
(§4, decision 2).

The fix is additive and doesn't change the store's initial value or the scene's own
DOM-reading approach: a new `hydrate` action reads `document.documentElement`'s already-set
`data-theme` attribute and copies it into the store's `theme` field, without touching
`localStorage` — this is reconciling the toggle's own display with a decision already made
elsewhere (by the script in §9.1, or by an earlier explicit click), not making a new one.
`theme-toggle.tsx` calls it once, in an effect that fires right after the component's existing
mount check passes — the same point it already switches from its disabled placeholder to the
real button. Because this runs in an effect, it never executes during server rendering, so it
carries no risk of the store trying to read `document` before it exists.

#### 9.4 What does not change

`globals.css`'s token values, `palette.contract.test.ts`, `code-highlight.contract.test.ts`,
and everything under `src/lib/graph/` are untouched — this spec changes when a theme is
chosen and how faithfully the toggle reports it, never what either theme actually looks like.
`use-theme-tokens.ts` keeps reading the DOM directly rather than the store, for the same
reason CLAUDE.md already states (the store is the toggle's own UI state, not a general
description of the rendered page) — only the stale part of that reasoning (that the store is
currently wrong) is updated, not the conclusion.

#### 9.5 Non-graph pages in dark (§3, Q2)

No page's markup, tokens, or copy changes as part of this spec. Every page — home, a topic
page, the graph — renders in dark using exactly the same dark-mode CSS values it would already
use today if a visitor had clicked the toggle themselves; this spec only changes how often a
visitor arrives there without having clicked anything. Whether that existing dark appearance
actually reads well as a first impression, rather than as an opt-in destination, isn't
something this spec verifies — see Areas of concern, C-1.

### 10. Security

- **No new dependency, no new environment variable, no server-side code touched.** This
  spec's entire surface is one inline script's literal body, one new store action, and one
  effect call.
- **The inline script still contains no interpolated value of any kind.** The only external
  input it ever reads is the visitor's own prior `localStorage` write, and that value is
  checked with a strict equality comparison against the two literal strings `"light"` and
  `"dark"` before it can ever reach `setAttribute` — anything else, including a tampered or
  unexpected stored value, resolves to the literal `"dark"` fallback instead of being written
  through unchecked. This property already existed before this spec and is fully preserved by
  it (§9.1).
- **The script continues to run under the same Content-Security-Policy posture it already
  runs under today** (Report-Only, no nonce yet, per the original baseline spec). This change
  edits the body of the one inline script that already exists; it introduces no new script
  tag and no new CSP surface.
- **No new data is stored, read, or transmitted anywhere.** Theme remains a non-sensitive,
  purely local preference, exactly as the intent's own "Data: none" note already states.

### 11. Verification

| # | Check | How | Pass |
| --- | --- | --- | --- |
| V-1 | A fresh/cleared browser profile with the device set to light opens the app in dark | Manual, per the intent's own check | pass |
| V-2 | A fresh/cleared browser profile with the device set to dark opens the app in dark (same code path, coincidentally matching) | Manual | pass |
| V-3 | A browser with `"theme": "light"` already stored opens the app in light, regardless of the device's own setting | Manual | pass |
| V-4 | A browser with `"theme": "dark"` already stored opens the app in dark, regardless of the device's own setting (unaffected by this change) | Manual | pass |
| V-5 | No visible flash of the wrong theme in any of V-1 through V-4 | Manual, on a throttled/slow load | pass |
| V-6 | With `data-theme="dark"` already set on `document.documentElement` before mount, the toggle's very first render shows "Switch to light theme" and the sun icon — not the stale placeholder state | Unit test, `theme-toggle.test.tsx` (new case) | pass |
| V-7 | The existing click-toggle case in `theme-toggle.test.tsx` still passes unmodified | Regression | pass |
| V-8 | After a page loads with no stored preference, `localStorage.getItem("theme")` is still `null` — the default is never written back as if it were a choice | Unit/integration check | pass |
| V-9 | With `localStorage.getItem` mocked to throw, the script still sets `data-theme="dark"` rather than leaving the attribute unset | Unit test on the script's logic | pass |
| V-10 | `palette.contract.test.ts` and `code-highlight.contract.test.ts` both still pass unchanged | Re-run, unmodified | pass |
| V-11 | Typecheck, lint, and the full existing test suite pass with only the files listed in §7 changed | `npm run typecheck`, `npm run lint`, `npm test` | pass |

---

## Areas of concern

**C-1 — The parts of the app outside the graph haven't been specifically checked for how
well they read in dark** (§3, Q2; §6, risk 2; §9.5). This spec makes no new visual changes
anywhere — every page keeps exactly the dark appearance it already has today — but those
pages are about to become most new visitors' actual first impression of dark mode, rather
than something only people who deliberately opted in ever saw. **Resolved here by shipping
the existing dark appearance unchanged and unaudited beyond what's already validated for the
graph and its code blocks.** **The decision needed from you:** say whether that's good enough
to ship as-is, or whether a quick look at the home page and a topic page or two in dark,
before or shortly after release, should happen first.

**C-2 — Once a visitor touches the toggle at all, there's no way back to "just match my
device"** (§3, Q3; §6, risk 3). The only way to return to that behaviour is clearing browser
data or starting a fresh profile. **Resolved here by keeping the toggle at exactly two
positions**, matching the intent's own instruction to keep the toggle as it is rather than
adding a third state, which would be materially more work (a new remembered value, and a
rethink of the script in §9.1 to handle three cases instead of two). **The decision needed
from you:** confirm two positions are enough, or ask for a third "match my device" position —
understood as a separate, larger piece of work, not something to fold into this one.

**C-3 — This spec fixes a small, already-known toggle display glitch that an earlier piece of
work explicitly deferred to "a separate small PR," rather than leaving it for that separate
PR** (§4, decision 2; §6, risk 4; §9.3). The conflict: shipping the new dark default without
this fix would mean the toggle visibly shows the wrong option to nearly every first-time
visitor, not just the minority it affects today. **Resolved here by fixing it as part of this
same change**, since leaving it for "later" would mean shipping something visibly broken in
the meantime. **The decision needed from you:** confirm this small addition to scope is fine,
or explicitly ask for it to be pulled out into its own change — with the understanding that
the toggle would then look wrong to most new visitors for however long the two pieces of work
are apart.

**C-4 — A visitor who already comes back regularly today, on a light-preferring device, and
has simply never touched the toggle, will see the site's whole look change the next time they
open it after this ships, with nothing on screen explaining why** (§4, decision 3; §6, risk
1). **Resolved here by treating this as the intended, accepted consequence of changing a
default** — the intent's own framing already includes this group as affected, not as an edge
case — and by not adding any one-time explanation for it. **The decision needed from you:**
confirm a silent switch like that is fine, or ask for a small one-time notice the first time
it happens.

**C-5 — Visitors without JavaScript, or with their browser blocking the site's ability to
remember anything, don't get the new dark default at all** (§4, decision 4; §6, risk 5;
§9.1). They keep following their device's own setting exactly as they do today. **Resolved
here by accepting this as a narrow, pre-existing limitation** — the toggle itself has always
needed JavaScript to do anything at all — rather than restructuring the underlying stylesheet
to force a default in a case the app's other interactive features already don't reach.
**No decision needed from you today** — flagged only so this narrow gap isn't mistaken for a
bug if it's ever noticed later.
