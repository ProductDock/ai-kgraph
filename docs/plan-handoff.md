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
        ├─ opens issue "plan: <title>", labels plan + ready-to-plan
        ├─ carries over any concerns flagged in the spec
        ├─ assigns ${{ vars.PLAN_ASSIGNEE }} if set
        └─ posts to Slack if SLACK_WEBHOOK_URL is set
        │
        ▼
  engineer runs /plan-from-spec <slug>    (.claude/skills/plan-from-spec/SKILL.md)
        ├─ refuses unless the session is in plan mode
        ├─ loads intent.md + spec.md + CLAUDE.md, reads the code first
        ├─ writes files / sequence / risks / proof
        ├─ interrogates: what breaks, riskiest step, rollback, open questions
        └─ commits intent/<slug>/plan.md  ← then, and only then, implements
```

Zero model calls in the workflow. It closes the "did anyone notice this spec landed?"
gap, which is the real failure at this boundary, without taking the plan away from the
engineer.

## Setup

- Labels `plan`, `ready-to-plan` (and `needs-policy-owner`, shared with the spec flow).
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
