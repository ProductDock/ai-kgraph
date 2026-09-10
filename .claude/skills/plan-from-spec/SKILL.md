---
name: plan-from-spec
description: 'Start a Stage 3 build session from an approved spec — load intent.md and spec.md in plan mode, interrogate the plan about breaking changes and risk, then commit it as plan.md before implementing. Use when picking up a "plan: <slug>" issue, when asked to start work on an approved spec, or whenever someone says "let''s implement <slug>", "start on this spec", or "write the plan".'
---

# Plan from an approved spec

The plan is the Stage 3 artifact and the design review. It happens **before**
implementation, in read-only plan mode, and it is not finished until it has been
argued with. A plan nobody questioned is not an approval record.

Argument for `<slug>`: the intent slug, e.g. `claims-status-visibility`. If none was
given, list `intent/*/` folders that have a `spec.md` but no `plan.md` and ask which.

## Procedure

1. **Confirm you are in plan mode.** If the session is not in plan mode, say so and
   stop until it is. Do not read-then-edit your way into implementation — the whole
   point is that nothing is written while the plan is being formed.

2. **Load both artifacts.** Read `intent/<slug>/intent.md` and
   `intent/<slug>/spec.md`. The intent says what was wanted and why; the spec says how
   it should be built within policy. Also read `CLAUDE.md` if present.
   - If the spec has a non-empty `## Areas of concern`, raise it now and ask whether it
     was resolved with the policy owner. Do not plan around an unresolved policy
     conflict — flag it and ask.

3. **Explore before proposing.** Read the code the spec touches. A plan naming files
   you have not opened is a guess.

4. **Write the plan.** Four sections, no more:
   - **Files changed** — each path with one line on what happens to it
   - **Sequence of work** — ordered steps, each independently verifiable
   - **Risks** — what could break, and what depends on the code being changed
   - **Proof** — the exact command, assertion, or screenshot comparison that will show
     it works (this becomes the Stage 4 feedback loop, so make it runnable)

5. **Interrogate it.** Answer these yourself, in the session, before showing the plan
   as done. Fold the answers back into the plan; do not just append them.
   - What existing behaviour does this break?
   - Which step is riskiest, and what happens if it is wrong?
   - What is the rollback?
   - Does the plan close every open question the intent left? Name any it does not.
   - Could another engineer implement this without asking a single question?

6. **Iterate with the engineer** until the implementation would be self-explanatory.
   Their objection always outranks your first draft.

7. **Commit the plan before building.** Write `intent/<slug>/plan.md`, commit as
   `plan: <slug>` on branch `plan/<slug>`, and reference the `plan: …` issue if one
   exists. Only then accept the plan and implement.

8. **Keep it true.** If the implementation deviates from the plan, update `plan.md` in
   the same PR and say why. A stale plan is worse than none — later review stages read
   it as the approved intent.

## When the spec is wrong

Planning is where an incomplete spec surfaces — expected, not a process failure. Do not
absorb the gap into the plan. Stop and hand it back:

1. Comment on the `plan: <slug>` issue with what is missing, or what existing behaviour
   the spec as written would break.
2. Label the issue `blocked-on-spec` and link the amendment PR from it.
3. Amend `intent/<slug>/spec.md` — or `intent/<slug>/intent.md` if what was *wanted* was
   wrong or incomplete, since amending only the spec leaves the intent lying about the
   ask. Open a PR; the product owner merging it is gate 2 again.
4. When it lands, `plan-ready` comments the spec diff on the issue and clears
   `blocked-on-spec`. Replan against the new version.

A breaking change is different: that is a normal plan output, not a blocker. It goes in
the plan's **Risks** section with its rollback. Escalate to a *new intent* only when the
break violates policy — `breach ⇒ new intent.md` in the playbook.

## Rules

- Never write `plan.md` for a spec that has not been merged to the default branch.
  An unmerged spec has not passed gate 2.
- Never write code in the same turn as the plan. Plan, commit, then build.
- No plan for work with no spec — if there is only an `intent.md`, the design stage
  has not run; point at `.github/workflows/spec-from-intent.yml`.
- Do not silently widen scope. Anything the spec does not cover is a new intent.

## Reference

Stage 3 of the AI-Native SDLC Playbook, lesson 4 — see
[`docs/ai-native-sdlc-playbook.md`](../../../docs/ai-native-sdlc-playbook.md),
[`docs/plan-handoff.md`](../../../docs/plan-handoff.md), and
[the lesson](https://academy.claude.com/courses/ai-native-sdlc-playbook/plan-mode).
