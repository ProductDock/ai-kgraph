# Gate 2 → Stage 3: why `plan.md` is not generated

The `intent.md` → `spec.md` step is automated ([spec-from-intent](./spec-from-intent-automation.md)).
The `spec.md` → `plan.md` step is **not**, on purpose. This is the one handoff in the
playbook where the chain stops being automatic.

## The reasoning, from the course

Lesson 4 ([plan mode](https://academy.claude.com/courses/ai-native-sdlc-playbook/plan-mode))
makes the plan an interactive artifact. Its steps: start in plan mode, hand over
`intent.md` and `spec.md`, **"question the plan regarding potential breaking changes and
risk assessment"**, refine "until implementation becomes self-explanatory", *then* commit
`plan.md` and accept.

The interrogation is the value. It is what moves design review before implementation —
lesson 4's stated governance benefit. A plan generated unattended in CI is a plan nobody
argued with, and `plan.md` then stops being an approval record with attribution and
becomes more generated prose in the repo. The metrics agree: lesson 4's leading
indicators are **first-pass merge rate** and **plan-to-PR time**, both of which assume a
human owns the plan.

Lesson 4 does offer auto mode for "longer autonomous sessions" — but explicitly "once
guardrails mature". That means evals (lesson 9), agentic review (lesson 10) and hooks
(lesson 11) are in place first. Until then, automating this step spends the guardrail
budget before it exists.

## What is automated instead

**The summons, not the plan.**

```
  PR: spec.md   ← product owner merges                       = APPROVAL GATE 2
        │
        │ push to main, path intent/**/spec.md
        ▼
  workflow: plan-ready                    (.github/workflows/plan-ready.yml)
        ├─ first approval → opens issue "plan: <title>", labels plan + ready-to-plan
        ├─ re-approval    → comments the spec diff on that issue, labels spec-revised,
        │                   reopens it if it had been closed  (no duplicate task)
        ├─ …unless plan.md moved in the same push → comments only, no reopen
        ├─ carries over any concerns flagged in the spec
        ├─ assigns ${{ vars.PLAN_ASSIGNEE }} if set
        └─ posts to Slack if SLACK_WEBHOOK_URL is set
        │
        ▼
  engineer runs /plan-from-spec <slug>    (.claude/skills/plan-from-spec/SKILL.md)
        ├─ refuses unless the session is in plan mode
        ├─ loads intent.md + spec.md + CLAUDE.md, reads the code first
        ├─ writes files / sequence / risks / proof / handoff
        ├─ interrogates: what breaks, riskiest step, rollback, open questions
        ├─ commits intent/<slug>/plan.md on branch plan/<slug>   ← NO pull request
        └─ stops, and asks the engineer to read the plan
        │
        ▼
  engineer reads intent/<slug>/plan.md                      = the review that matters
        │
        ▼
  engineer starts a NEW session, choosing a model for the build   = STAGE 4
        ├─ builds from plan.md, not from the planning conversation
        ├─ runs the plan's own Proof section
        └─ stops and ASKS whether to open the PR
        │
        ▼
  human says yes → PR "plan + <type>: <what was built>"     = carries plan.md + the code
```

The skill ends at that commit and that request. Implementation is a separate session the
engineer starts once they have read the plan — the pause between the two *is* the
approval, so the plan session never rolls on into building, and never asks to.

**Three things are deliberately not automatic**, and each one is a place an agent would
otherwise remove a human decision:

1. **The plan gets no PR of its own.** It is reviewed by a person opening the file. It
   reaches GitHub later, inside the implementation PR, so there is one review of one
   coherent change rather than two reviews of half of it each — and the plan is still
   there in the diff, where the reviewer can check the code against it.
2. **Stage 4 is a new session with a deliberately chosen model.** A planning session's
   context is spent arguing about the design; a build wants a clean one. Which model
   builds is a judgement about the work, not something to inherit from whatever was
   planning.
3. **No pull request opens without being asked for.** Not the plan's, not a spec
   amendment's, not the implementation's. A PR is a request for a named person's
   attention, and approving one is not approving the next.

Zero model calls in the workflow. It closes the "did anyone notice this spec landed?"
gap, which is the real failure at this boundary, without taking the plan away from the
engineer.

## Specs get approved more than once

Planning is where an incomplete spec is found — that is lesson 4 working, not a process
failure. The engineer does not plan around the gap: they amend `spec.md` (or `intent.md`,
if what was *wanted* was wrong), open a PR, and the product owner re-approves by merging
it. Same gate, second pass.

So `plan-ready` triggers on modified specs too (`--diff-filter=AM`), and distinguishes
the two cases by whether a plan task already exists rather than by how git classified the
change:

- **no existing task** → open one, as on first approval
- **task exists** → comment on it with the spec diff, label it `spec-revised`, and reopen
  it if it had already been closed
- **task exists and `plan.md` moved in the same push** → comment only

That last case is the implementation PR landing. It amends the spec and closes the plan
task in one merge, so a push event alone cannot tell it apart from a product owner
re-approving an amended spec — both are a modified `spec.md` arriving next to a closed
task. `plan.md` moving with it is the tell, and it has to be checked, because GitHub
processes the PR's `Closes #n` a few seconds *before* this job reads the issue state: the
job would otherwise see `CLOSED`, conclude the spec was amended after the task closed, and
reopen the task the merge had just closed. (Observed on #25: closed 10:35:08, reopened by
this workflow 10:35:14.) `spec-revised` is skipped there too — it means "go re-read the
spec before planning further", and on an implementation push there is nothing left to
plan.

The `workflow_dispatch` path has no base commit to diff against, so it cannot make this
call and keeps the reopen.

The engineer's half is not automated, deliberately — noticing that a spec is wrong is
the judgement being paid for. The skill has the agent say what is missing and prepare the
amendment on a branch, then ask before opening the PR or writing to the issue; once the
engineer agrees, the issue gets `blocked-on-spec` and a link to the PR, and the landed
re-approval clears that label. `needs-policy-owner` covers concerns raised at *design* time; `blocked-on-spec`
covers concerns raised at *plan* time, which is where the trail used to just stop.

Regenerating the amended spec in CI is intentionally not offered: `spec-from-intent`
skips any intent that already has a `spec.md`, on the dispatch path too. An amendment is
a hand-edited PR, by the engineer who found the gap.

That keeps one issue per intent as the whole audit trail — approved, sent back, amended,
re-approved — instead of a second task competing with the first. The engineer gets told
that the spec they planned against is no longer the approved one, which is the failure
this boundary actually produces once specs start moving.

## Setup

- Labels `plan`, `ready-to-plan`, `spec-revised`, `blocked-on-spec` (and
  `needs-policy-owner`, shared with the spec flow).
- Optional repo variable `PLAN_ASSIGNEE` — a GitHub handle, typically the tech lead who
  distributes work. Unset means the issue is unassigned.
- Optional secret `SLACK_WEBHOOK_URL`. Lesson 13 notes Claude Tag in Slack as the richer
  version of this once you want Claude answering in the channel itself.

## When to revisit

Automate a *draft* plan only once all of these hold — the lesson-4 precondition, made
checkable:

- [ ] An eval suite gates changes to `CLAUDE.md`, skills and hooks (lesson 9)
- [ ] Agentic review runs on every PR with a `REVIEW.md` policy (lesson 10)
- [ ] Hooks block protected paths and deploys deterministically (lesson 11)
- [ ] First-pass merge rate on agent changes is high enough to trust (lesson 4)

Even then, the engineer's acceptance of the plan stays a human act. Generate a draft to
argue with; never a plan to rubber-stamp.
