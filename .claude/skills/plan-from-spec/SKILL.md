---
name: plan-from-spec
description: 'Write the Stage 3 plan for an approved spec — load intent.md and spec.md in plan mode, interrogate the plan about breaking changes and risk, commit it as plan.md, then stop and ask the human to review it. It never implements and never opens a pull request. Use when picking up a "plan: <slug>" issue, when asked to start work on an approved spec, or whenever someone says "let''s implement <slug>", "start on this spec", or "write the plan".'
---

# Plan from an approved spec

The plan is the Stage 3 artifact and the design review. It happens **before**
implementation, in read-only plan mode, and it is not finished until it has been
argued with. A plan nobody questioned is not an approval record.

**This skill ends when `plan.md` is committed and the human has been asked to read it.**
It does not implement, it does not ask whether to implement, and **it does not open a pull
request.** Stage 4 is a separate session the engineer starts deliberately, in a new context
and with a model they have chosen for the job — that pause is the approval, and an agent
that rolls straight into building removes it.

**Nothing in this flow opens a pull request on its own.** Not the plan, not the
implementation, not a spec amendment. A PR is a request for someone's attention, and asking
for it is the human's call — every time, including when they have said yes to one before.

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

4. **Write the plan.** Five sections, no more:
   - **Files changed** — each path with one line on what happens to it
   - **Sequence of work** — ordered steps, each independently verifiable
   - **Risks** — what could break, and what depends on the code being changed
   - **Proof** — the exact command, assertion, or screenshot comparison that will show
     it works (this becomes the Stage 4 feedback loop, so make it runnable)
   - **Handoff** — the standing instructions for whoever builds this. Stage 4 starts in a
     fresh session that has none of this conversation, so the rules have to travel with
     the artifact. Copy the block in [After the plan](#after-the-plan) verbatim.

5. **Interrogate it.** Answer these yourself, in the session, before showing the plan
   as done. Fold the answers back into the plan; do not just append them.
   - What existing behaviour does this break?
   - Which step is riskiest, and what happens if it is wrong?
   - What is the rollback?
   - Does the plan close every open question the intent left? Name any it does not.
   - Could another engineer implement this without asking a single question?

6. **Iterate with the engineer** until the implementation would be self-explanatory.
   Their objection always outranks your first draft.

7. **Commit the plan — and open nothing.** Write `intent/<slug>/plan.md`, commit as
   `plan: <slug>` on branch `plan/<slug>`, and reference the `plan: …` issue if one
   exists. **Do not open a pull request, and do not offer to.** The plan is reviewed by a
   human reading the file, not by a PR: it ships to GitHub later, inside the
   implementation PR, so there is one review of one coherent change instead of two
   reviews of half of it each.

8. **Stop, and ask for a review.** Tell the engineer, in a few lines:
   - `intent/<slug>/plan.md` is written and committed, and on which branch
   - the proof command the plan settled on
   - anything still open that they should decide before building

   Then ask them to **read the plan** — naming the path, so it is one click — and say
   plainly that nothing else happens until they have. Then end the turn.

9. **Point at the next session.** In the same hand-back, tell them that once the plan
   reads right, Stage 4 is a **new session**: `/clear` or a fresh window, and a model
   chosen for implementation rather than inherited from this conversation. Say why in one
   line — a planning session's context is spent arguing about the design, and a build
   wants a clean one. Do not start that session yourself, and do not keep going if they
   reply "go ahead" in *this* one: that is a fresh instruction to a fresh session, not
   something this skill carries over.

## After the plan

Implementation is Stage 4 and starts from the committed plan, not from this session's
context. The block below is the standing brief for that session — copy it verbatim into
`plan.md` as its **Handoff** section, because the session that builds this will have read
the plan and nothing else.

> ### Handoff
>
> **For the Stage 4 session. Read this before writing code.**
>
> - **Build from this file, not from a conversation.** If the implementation deviates from
>   the plan, update this file in the same commit and say why. A stale plan is worse than
>   none — later review stages read it as the approved intent.
> - **Run the Proof section before claiming it works.** If something in it cannot be run,
>   say so explicitly rather than quietly substituting a weaker check.
> - **Do not open the pull request. Ask.** When the work is done and the proof is green,
>   report the state and *ask the human whether to open it*. Never open it, or a spec
>   amendment PR, on your own initiative — including when they approved one earlier in the
>   session. Approval of one PR is not approval of the next.
> - **When they say yes, title it `plan + <type>: <what it does>`** — `feat`, `fix`,
>   `refactor`, `perf`, `chore`, whichever fits the work. The PR carries both `plan.md` and
>   the implementation, which is what the `plan + ` prefix records. The rest of the title
>   is a plain-language description of **what was actually built**, not the slug and not a
>   restatement of the spec's title. `plan + feat: colour by branch, size by whether a node
>   carries anything` — not `plan + feat: graph-branch-colour-and-size`.
> - **Put `Closes #<n>` in the PR body, naming the `plan: <slug>` issue** — the task
>   `plan-ready` opened when the spec was approved. It must be the GitHub keyword, on its
>   own line, with the number: `Closes #31`. Prose like "closes the plan task" reads the
>   same to a person and does nothing at all to GitHub, which is how a task survives the
>   merge that completed it and sits open forever.
>
>   This is the one link that closes the loop the whole trail hangs on — approved,
>   planned, built, done, on one issue. `plan-ready.yml` already depends on it: it watches
>   for the implementation PR's `Closes #n` to distinguish that merge from a product owner
>   re-approving an amended spec, and skips the reopen it would otherwise do.
>
>   If you cannot find the issue number, ask rather than guessing or omitting it.
> - **Say what is not done.** Manual checks you could not run, steps you skipped, values
>   still to be tuned — in the PR body, not omitted because the tests are green.

## When the spec is wrong

Planning is where an incomplete spec surfaces — expected, not a process failure. Do not
absorb the gap into the plan. Stop and hand it back:

1. Say what is missing, or what existing behaviour the spec as written would break, and
   ask the human whether to record it on the `plan: <slug>` issue. Do not comment or
   label on your own initiative — the issue is the audit trail, and writing to it is the
   engineer's call.
2. Amend `intent/<slug>/spec.md` — or `intent/<slug>/intent.md` if what was *wanted* was
   wrong or incomplete, since amending only the spec leaves the intent lying about the
   ask. Commit it on its own branch.
3. **Ask before opening the amendment PR.** When they say yes, open it, label the issue
   `blocked-on-spec` and link the PR from it. The product owner merging it is gate 2
   again.
4. When it lands, `plan-ready` comments the spec diff on the issue and clears
   `blocked-on-spec`. Replan against the new version.

A breaking change is different: that is a normal plan output, not a blocker. It goes in
the plan's **Risks** section with its rollback. Escalate to a *new intent* only when the
break violates policy — `breach ⇒ new intent.md` in the playbook.

## Rules

- Never write `plan.md` for a spec that has not been merged to the default branch.
  An unmerged spec has not passed gate 2.
- Never write code in this session. The skill's last action is the `plan.md` commit and
  the request for a review; building is a separate, human-initiated session.
- **Never open a pull request** — not for the plan, not for a spec amendment, not for the
  implementation. Prepare the branch and the commit, then ask. This holds even when the
  human approved a PR earlier in the same session.
- No plan for work with no spec — if there is only an `intent.md`, the design stage
  has not run; point at `.github/workflows/spec-from-intent.yml`.
- Do not silently widen scope. Anything the spec does not cover is a new intent.

## Reference

Stage 3 of the AI-Native SDLC Playbook, lesson 4 — see
[`docs/ai-native-sdlc-playbook.md`](../../../docs/ai-native-sdlc-playbook.md),
[`docs/plan-handoff.md`](../../../docs/plan-handoff.md), and
[the lesson](https://academy.claude.com/courses/ai-native-sdlc-playbook/plan-mode).
