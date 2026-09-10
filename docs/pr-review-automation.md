# Stage 5: agentic PR review, triggered by `@review`

Implemented in [`.github/workflows/claude-review.yml`](../.github/workflows/claude-review.yml),
scoped by [`REVIEW.md`](../REVIEW.md).

## What the playbook says, and where this departs from it

Lesson 10 ([AI in the PR review loop](https://academy.claude.com/courses/ai-native-sdlc-playbook/ai-in-the-pr-review-loop))
describes the end state as "all PRs get an identical set of review passes" — review
runs automatically, unconditionally, on every PR.

This repo runs it on a comment instead: `@review` on the PR. That is a deliberate
step short of the playbook's stated end state, for the same reason
[`docs/plan-handoff.md`](./plan-handoff.md) keeps `plan.md` a human act rather than
generating it in CI — automating the trigger is cheap; automating the judgment about
when a pass is *trustworthy enough to run unattended* is not, and this repo hasn't
earned that yet:

- `REVIEW.md` is brand new and unexercised — its severity split and nit cap haven't
  been tuned against real findings.
- There's no eval suite (lesson 9) gating changes to `REVIEW.md` or the two review
  skills, so a bad edit to either would silently degrade every PR's review with
  nothing to catch it.
- Lesson 10's own metrics — findings resolved without a human touching the branch,
  defects caught pre-merge — don't exist yet to say whether the passes are worth
  running on every PR or just noise.

Comment-triggered gets the same review capability without spending CI minutes (and
review-comment volume) on PRs where it isn't wanted yet — a draft PR, a WIP branch,
docs-only changes. It's the manual half of the same gate the playbook automates fully
once its own preconditions hold.

## Why `issue_comment`, not `pull_request` on open

`issue_comment` is the event GitHub fires for a comment on a PR's conversation tab.
Its default checkout is the repo's default branch, not the PR branch — the workflow
resolves the PR's head SHA via `gh pr view` first and checks that out explicitly,
the same pattern `plan-ready.yml` uses for `gh issue`/`gh pr` calls (`GH_TOKEN:
${{ github.token }}`, no extra secret needed for read/comment access to the same repo).

## Separation of duties (lesson 10)

The review posts findings as PR comments only — `REVIEW.md`'s closing section makes
this explicit. It does not push fixes or resolve its own findings. Acting on a
finding is a separate step a person requests, so the same session is never both the
author of a fix and the approver of it. Branch protection requiring a human
code-owner review stays the actual merge gate; this workflow only ever advises.

## Prerequisites

- `ANTHROPIC_API_KEY` as a repository secret — already provisioned for
  `spec-from-intent.yml`; reused here, not duplicated.
- `.claude/skills/nextjs-code-review/` and `.claude/skills/security-review/` present
  (they are, as of the commit that added this workflow) — `REVIEW.md` names both by
  path and the review has nothing to run without them.
- Branch protection on `main` requiring code-owner approval, so review findings stay
  advisory and can't substitute for it.

## When to revisit

Move to running review automatically on every PR open once:

- [ ] `REVIEW.md`'s severity rules and nit cap have been used enough to trust them
- [ ] An eval suite (lesson 9) gates changes to `REVIEW.md` and the two review skills
- [ ] Lesson 10's metrics (time to first review, findings resolved unassisted,
      pre-merge defect catch rate) are being tracked, so the switch is measurable
      rather than assumed

Until then, `@review` is the whole automation: a person still decides when a PR is
ready to be read.
