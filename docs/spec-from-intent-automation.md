# Automating `spec.md` from a committed `intent.md`

How to make Stage 2 of the playbook fire by itself. Implemented in
[`.github/workflows/spec-from-intent.yml`](../.github/workflows/spec-from-intent.yml).

## What the playbook actually says

The automation isn't invented here — it is assembled from four things the course states
directly:

1. **The trigger exists by design.** Lesson 3 says the standard spec prompt is run by
   the product owner today and is "eventually automated as a slash command or CI/CD
   trigger". Automating it is the stated end state, not an extension.
2. **The end state is artifact-driven.** Lesson 1: in the automated end state "each
   accepted artifact fires the next gate." A committed, accepted `intent.md` *is* the
   Stage 2 trigger.
3. **The prompt is fixed and reusable.** Lesson 3 gives it verbatim, so it can be
   baked into CI unchanged. This repo keeps that paragraph as-is and appends a
   structure requirement of its own — see [Two parts, two reviewers](#two-parts-two-reviewers).
4. **Agent output must arrive as a PR.** Lesson 12: branch protection means "agent
   output becomes PRs, blocking direct main commits." So the workflow never commits the
   spec to the default branch.

## The design

```
contributor + write-intent skill
        │  skill opens the PR on branch intent/<slug>
        ▼
  PR: intent/<slug>/intent.md          ← product owner reviews & merges  = APPROVAL GATE 1
        │
        │ push to main, path intent/**/intent.md
        ▼
  workflow: spec-from-intent
        ├─ skip if still marked draft, or a spec.md already exists
        ├─ flip the intent's Status to approved
        ├─ claude -p  <standard lesson-3 prompt>   (repo skills available)
        ├─ write intent/<slug>/spec.md  + spec.provenance.yml
        └─ open PR, branch spec/<slug>-<run>
        │
        ▼
  PR: spec.md next to intent.md        ← product owner reviews         = APPROVAL GATE 2
        │                                 (+ tech lead on higher-risk items)
        ▼
  merged → Stage 3: engineer opens Claude Code in plan mode with both files
```

### Why the trigger is "push to main", not "PR opened"

The product owner's approval of the intent is the Stage 2 entry condition (lesson 3,
step 1: it happens "after the product owner approves the `intent.md`"). With branch
protection, an `intent.md` reaching `main` *means* it was approved — the gate is already
enforced deterministically by the platform, so the workflow needs no approval logic of
its own. A literal `draft` guard catches an unfinished intent pushed straight to main by
accident; the workflow then flips `Status` to `approved` in the spec PR so the artifact
records what the merge already decided.

### Why the output is a PR

Two reasons from the course. Lesson 12's branch protection rule, and lesson 3's review
step — the product owner must validate "whether the spec addresses the original problem
and resolves questions from the intent document." A PR is that review, and it makes the
gate an artifact rather than a conversation. Lesson 3 also wants `spec.md` and
`intent.md` committed together as a decision record; keeping both in
`intent/<slug>/` gets that for free.

### Provenance

Lesson 3's governance note requires "the spec, the generation prompt, and the active
skill versions" to be tracked. The prompt lives in the workflow file (so a change to it
is a reviewed diff), and `spec.provenance.yml` records the intent path, timestamp,
model, workflow run URL, repo SHA, and the last commit SHA touching `.claude/skills` —
which is what pins the skill versions that constrained the spec.

### Two parts, two reviewers

Lesson 3 asks for a "requirements **and design** spec … ready to hand to the engineering
team", so technical depth belongs in the artifact. But two people gate it — the product
owner asks *does this solve the problem the intent describes*, the tech lead asks *does
this design hold* — and a single undifferentiated document serves neither. The first
generated spec ran to ~870 lines with dependency choices, rendering pipelines and CSP
directives interleaved with scope and requirements; there was no way for a product owner
to know which half was theirs.

The prompt therefore requires the spec to be ordered:

- **Part A — Product.** Summary, scope (in / out / deferred), the decisions that close the
  intent's open questions plus any decision the agent added for the PO to confirm or cut,
  functional requirements as observable behaviour, risks. No file paths, package names,
  code or API mechanics — where a technical choice has a product consequence, only the
  consequence appears, cross-referenced into Part B.
- **Part B — Technical design.** Fit with the existing app, non-functional requirements,
  design, security, verification. Assumes its reader has read Part A.
- **`## Areas of concern`** stays last and outside both parts, each concern written so the
  PO can act on it without reading Part B: the conflict, the resolution taken, and the
  decision needed from them. Each is a fixed four-line shape — a one-line heading, then
  **Conflict** / **Chosen** / **Decide**, one sentence each — because free-form concerns
  ran to a paragraph apiece and restated reasoning the cross-referenced section already
  held. A risk with no decision attached goes in Part A's risks instead, so a non-empty
  section (and the `needs-policy-owner` label it triggers) always means "someone must
  answer something".

Sections are numbered continuously across both parts so cross-references resolve. The PR
body tells the product owner to read Part A and the concerns, and that Part B is the tech
lead's review, not theirs.

This is a repo-local addition to the lesson-3 prompt, not a departure from it: nothing is
removed from the spec, only ordered and labelled by audience. The Stage 3 handoff is
unaffected — `plan-from-spec` still reads one `spec.md`.

### Flagged concerns get routed, not buried

The prompt asks for a closing `## Areas of concern` section. The workflow lifts that
section into the PR body and, when it is not `None.`, adds a `needs-policy-owner`
label. That is lesson 3, step 4: concerns go to policy owners *before* engineering is
involved.

### The PR is announced, because it waits on one person

A spec PR blocks on a named product owner reading it, and nothing else in the pipeline
tells them it exists. So the workflow posts the PR URL to `SLACK_WEBHOOK_URL` if that
secret is set, prefixed with a warning when `needs-policy-owner` was applied — a spec
with unresolved concerns is the one most worth reading early.

That pairs with `plan-ready`, which posts when the same spec is *approved*. Between
them the channel sees both ends of gate 2: it opened, and it cleared. The notification
is best effort — an unset webhook logs a notice and the spec PR still exists.

## Prerequisites

- `ANTHROPIC_API_KEY` as a repository secret — or the Bedrock / Vertex AI / Microsoft
  Foundry env vars instead (lesson 12 lists all three as supported model access paths).
- Branch protection on `main` requiring review, so both gates are real.
- The org's policy **skills** present in `.claude/skills/` or installed as a plugin.
  Without them the prompt has nothing to constrain it and the spec will be generic —
  this is the one prerequisite lesson 3 names explicitly.
- Labels `spec`, `needs-po-review`, `needs-policy-owner`.
- Optional: `SLACK_WEBHOOK_URL` as a repository secret, to announce the spec PR. Shared
  with `plan-ready`; without it the workflow logs a notice and carries on.
- Repository setting: *Allow GitHub Actions to create and approve pull requests*.

## Guardrails worth adding next

- **Evals on the prompt (lesson 9).** The spec prompt and the skills are agent
  configuration. Any PR touching `.github/workflows/spec-from-intent.yml` or
  `.claude/skills/**` should run the eval suite, and a drop in pass rate should block
  the merge.
- **The `spec.md`-after-`plan.md` metric (lesson 3).** Rework is measurable straight
  from `git log`: count `spec.md` commits landing after the first `plan.md` for the same
  slug. A scheduled job can publish it.
- **Separation of duties (lesson 10).** The bot that writes the spec must not be able
  to approve its PR. Use `github.token` for creation only, and require a human code
  owner in branch protection.
- **`claude-code-action` instead of `claude -p`.** Lesson 10 and 12 both name it; it
  gives more pipeline control than a raw CLI invocation if you want the agent to
  respond to review comments on the spec PR too.

## Known limitations of this implementation

- If a single push approves several intents, all their specs land in **one** PR named
  after the first slug. Fine at low volume; split by slug if that stops being true.
- Regeneration is manual on purpose: an existing `spec.md` is skipped, so an edited
  `intent.md` will not silently rewrite a spec someone already reviewed. Use
  `workflow_dispatch` with the slug, after deleting the old spec, to redo one.
- The draft guard and the Status flip both depend on the `**Status:**` line from the
  `write-intent` template. Change the template and the workflow's `grep`/`sed` together.
