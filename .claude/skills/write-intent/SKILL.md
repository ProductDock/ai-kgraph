---
name: write-intent
description: Turn a raw idea, pain point, feature request, or bug report into a committed intent.md — the Stage 1 artifact of the AI-Native SDLC. Use when someone says "I have an idea", "we should build/fix X", "write this up as an intent", "capture this", or asks to start a new piece of work before any spec or plan exists.
---

# Write an intent.md

`intent.md` is a proto-spec **in the originator's own terms**: what is wanted, why, and
under which constraints. It is not a design and not a plan — do not solve the problem
here. Capture it faithfully so the intent survives the handoff to design.

Anyone can be the originator, engineer or not. Your job is to interview them, then
write the file.

## Procedure

1. **Talk first, write later.** Ask the originator to describe the problem
   conversationally. Do not open the template yet.

2. **Brainstorm until it is concrete.** Keep asking until you can answer all five
   template sections. The gaps worth chasing:
   - Who hits this problem, how often, and what do they do today instead?
   - What does "solved" look like — what would be observably different?
   - What must not change? (Systems, contracts, SLAs, regulations, budgets, deadlines.)
   - What is genuinely undecided, versus what the originator has already ruled out?

3. **Write the file** from `templates/intent.md`, in the originator's language. Keep
   their words for the problem; do not upgrade them into architecture terms.
   - State facts as facts and guesses as guesses — mark anything you inferred rather
     than heard with `[assumed]`.
   - Anything you could not pin down becomes an **open question**, not a silent
     assumption. Open questions are a healthy output; an intent with none is usually
     under-interviewed.
   - No solution design, no file names, no tech choices — unless the originator
     imposed one as a *constraint*, in which case it belongs under Constraints with
     the reason.

4. **Read it back and take corrections.** Show the draft and ask specifically whether
   the problem statement and the outcome are right. The originator's correction always
   wins over your phrasing.

5. **Open it as a pull request.** Never commit to the default branch — the product
   owner's merge *is* the approval gate, so there has to be something to approve.
   - path: `intent/<slug>/intent.md`, where `<slug>` is a short kebab-case name for
     the change (e.g. `intent/claims-status-visibility/intent.md`)
   - set `**Status:**` to `awaiting product owner review`
   - branch `intent/<slug>`, one commit, message `intent: <slug>`
   - `gh pr create --title "intent: <slug>" --label intent --label needs-po-review`,
     with the problem statement as the PR body

6. **Tell the originator what happens next**, and hand them the PR link: the product
   owner reviews and merges it, and that merge automatically triggers spec generation
   (`.github/workflows/spec-from-intent.yml`), which opens a second PR containing
   `spec.md` for them to review. They do not need to do anything else.

## Rules

- One intent per problem. Two unrelated pain points are two files.
- Never invent a constraint, a metric, or an affected system. Absence goes in Open
  questions.
- Do not edit an existing `intent.md` to describe different work — write a new one.
- If the originator is describing a fix to something already in flight, say so and
  point them at the existing intent instead of creating a duplicate.