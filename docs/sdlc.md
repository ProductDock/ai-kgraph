# AI-Native SDLC — notes and Stage 1→3 automation

This repository is also where we try out the process from Anthropic's
[AI-Native SDLC Playbook](https://academy.claude.com/courses/ai-native-sdlc-playbook)
course. The graph is built through it: every change starts as an `intent.md`.

| | |
|---|---|
| [`ai-native-sdlc-playbook.md`](ai-native-sdlc-playbook.md) | Full course notes, all 14 lessons, each section linked to its source lesson |
| [`spec-from-intent-automation.md`](spec-from-intent-automation.md) | How Stage 2 is automated, and which lessons justify each design choice |
| [`plan-handoff.md`](plan-handoff.md) | Why `plan.md` is *not* generated, and what is automated at that gate instead |
| [`pr-review-automation.md`](pr-review-automation.md) | The on-demand `@review` PR review, and why it isn't automatic |
| [`.claude/skills/write-intent/`](../.claude/skills/write-intent/SKILL.md) | Skill: interview an originator and open a PR with `intent/<slug>/intent.md` |
| [`.claude/skills/plan-from-spec/`](../.claude/skills/plan-from-spec/SKILL.md) | Skill: plan-mode session from an approved spec, interrogated, committed as `plan.md` |
| [`.github/workflows/spec-from-intent.yml`](../.github/workflows/spec-from-intent.yml) | On an approved `intent.md` reaching `main`, generates `spec.md` and opens a PR |
| [`.github/workflows/plan-ready.yml`](../.github/workflows/plan-ready.yml) | On an approved `spec.md` reaching `main`, opens a `plan: <slug>` task for an engineer |
| [`.github/workflows/release-notify.yml`](../.github/workflows/release-notify.yml) | When `verify` passes on `main`, tells Slack what shipped and who worked on it |
| [`intent/`](../intent/) | Where each change's `intent.md`, `spec.md` and `plan.md` live |

## The flow

```
idea → /write-intent ────────────▶ PR: intent.md ──▶ PO merges          = gate 1  (human)
     → spec-from-intent workflow ▶ PR: spec.md ────▶ PO merges          = gate 2  (human)
     → plan-ready workflow ──────▶ issue: plan: <slug>
     → /plan-from-spec ──────────▶ PR: plan.md ────▶ engineer accepts   = gate 3  (human)
     → build
```

Two automated steps, three human gates. `plan.md` stays interactive on purpose
([why](plan-handoff.md)).
