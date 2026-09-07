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
   baked into CI unchanged.
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

### Flagged concerns get routed, not buried

The prompt asks for a closing `## Areas of concern` section. The workflow lifts that
section into the PR body and, when it is not `None.`, adds a `needs-policy-owner`
label. That is lesson 3, step 4: concerns go to policy owners *before* engineering is
involved.

## Prerequisites

- `ANTHROPIC_API_KEY` as a repository secret — or the Bedrock / Vertex AI / Microsoft
  Foundry env vars instead (lesson 12 lists all three as supported model access paths).
- Branch protection on `main` requiring review, so both gates are real.
- The org's policy **skills** present in `.claude/skills/` or installed as a plugin.
  Without them the prompt has nothing to constrain it and the spec will be generic —
  this is the one prerequisite lesson 3 names explicitly.
- Labels `spec`, `needs-po-review`, `needs-policy-owner`.
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
