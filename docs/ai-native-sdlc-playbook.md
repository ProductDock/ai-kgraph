# The AI-Native SDLC Playbook — Course Notes

Source: [academy.claude.com/courses/ai-native-sdlc-playbook](https://academy.claude.com/courses/ai-native-sdlc-playbook)
(14 lessons, ~1 hour, by Anthropic's Applied AI team). Read 2026-09-07.

Every section links back to its lesson. Quoted lines are from the course.

---

## The core argument

AI made code generation fast, but "the processes around the code haven't changed at
the same pace." The bottleneck therefore moved *out* of the build phase and into
"plan, review/test, and deploy, which still run at human speed."

The fix is not a faster linear pipeline. The SDLC becomes **a loop, and AI is
embedded at each point**. Each stage hands off a **committed markdown artifact**
(`intent.md` → `spec.md` → `plan.md`) kept in version control, and human attention
concentrates at **governance gates** instead of at the start of every stage.

12 plays across 6 stages. Start manual (a person prompts each step); end automated,
where "each accepted artifact fires the next gate."

| Stage | Traditional | AI-native |
|---|---|---|
| Plan | Manual requirements gathering | Claude synthesizes pain points into `intent.md` |
| Design | Separate spec and design phases | Compressed into one agent-guided session |
| Build | Hand-written tests and code | AI-generated against versioned institutional knowledge |
| Test | QA gates at phase boundaries | Continuous evals throughout implementation |
| Deploy | Manual line-by-line review | Layered agentic review, human gates on critical code |
| Maintain | Manual production monitoring | Agents monitor and feed findings back into the loop |

**The distinction that carries the whole playbook:** *advisory* controls (`CLAUDE.md`,
skills, review findings) guide the agent; *deterministic* controls (hooks, managed
settings, evals, branch protection) enforce. A policy that must hold is never left
resting on a skill alone.

Lesson 1 — [Introduction](https://academy.claude.com/courses/ai-native-sdlc-playbook/introduction)

---

## Stage 1 — Plan

### `intent.md` — capture intent at the source

Lesson 2 — [Capture as intent.md](https://academy.claude.com/courses/ai-native-sdlc-playbook/capture-intent)

`intent.md` is "a proto-spec in the originator's own terms" that "contains what is
wanted, why, and under which constraints."

Traditionally an idea travels through backlog entries and refinement meetings, with
ownership transferring at each hop, and the original intent dilutes. Instead, the
contributor — often a non-engineer — brainstorms directly with Claude and commits a
markdown file that captures the vision *before* any handoff.

**Needs:** Claude access for non-engineers (claude.ai or Cowork); a standard
`intent.md` template; a version-controlled repo (an `intent/` folder in the product
repo); the GitHub connector so Claude can commit on the contributor's behalf.

**Steps:** describe the problem conversationally → brainstorm until concrete → ask
Claude to generate `intent.md` from the org template → correct its interpretations →
commit for product-owner review.

**Template sections:** problem statement, proposed outcome, affected users and
systems, constraints, open questions.

**Metrics.** Leading: time from first conversation to committed file — hours, not
weeks. Lagging: acceptance rate of intents that reach design, plus how much they get
edited after commit.

→ Implemented here as the [`write-intent` skill](../.claude/skills/write-intent/SKILL.md).

---

## Stage 2 — Design

### Requirements and design collapse into one session

Lesson 3 — [Requirements and design](https://academy.claude.com/courses/ai-native-sdlc-playbook/requirements-and-design)

Once the product owner approves `intent.md`, Claude produces the requirements-and-design
spec: "Both phases happen in a single prompted session. Claude takes `intent.md` and
produces a requirements and design spec, constrained by the organization's skills,
with areas of concern flagged."

The product owner **reviews** the spec; they do not write it. It becomes the planning
document engineering works from.

**Needs:** an approved `intent.md`, and organizational skills encoding brand, security,
compliance, and UX policy.

**Steps:** open a session with org skills enabled and `intent.md` attached → run the
standard prompt (later a slash command or CI/CD trigger) → review whether the spec
solves the original problem and closes the intent's open questions → take flagged
concerns to the relevant policy owners *before* engineering is involved → commit
`spec.md` alongside `intent.md` as a decision record → approve for build, pulling in
tech leads for higher-risk items.

**The standard prompt, verbatim:**

> Read the attached intent.md and produce a requirements and design spec for
> integrating it into our existing codebase. Apply the skills available to you so the
> plan conforms to our brand guidelines, security policies and UX standards. Document
> the spec fully as spec.md, ready to hand to the engineering team. Describe clearly
> any areas of concern, especially where you cannot satisfy contradicting policies.

**Front-end variant:** the product owner mocks the design in Claude Design (beta) from
the `intent.md`, iterates the mockup, then exports to Claude Code for implementation.

**Governance.** Policy conflicts surface during spec creation instead of weeks later in
review. The spec, the prompt that generated it, and the versions of the skills that
were active are all in version control.

**Metrics.** Leading: `intent.md` commit → `spec.md` commit elapsed time vs. the
traditional cycle. Lagging: `spec.md` commits landing *after* the first `plan.md` for
the same change — that is rework, and it is readable straight out of `git log`.

→ Automated here per [spec-from-intent automation](./spec-from-intent-automation.md).

---

## Stage 3 — Build

### Plan mode as the default starting point

Lesson 4 — [Plan mode](https://academy.claude.com/courses/ai-native-sdlc-playbook/plan-mode)

Traditionally an engineer reads the design and starts coding; implementation decisions
stay undocumented until code review, when rework is expensive. Instead the session
starts in **read-only plan mode**, Claude writes the plan, the engineer refines it,
and the approved plan is committed as `plan.md` — an audit trail and an input to later
review stages.

**Needs:** the `intent.md` / `spec.md` artifact, a `CLAUDE.md`, and Claude Code with
repo access.

**Steps:** start in plan mode → hand over `intent.md` and `spec.md` and ask for an
implementation plan → interrogate it about breaking changes and risk → iterate until
the implementation would be self-explanatory → commit as `plan.md` → accept and build
→ update `plan.md` if the implementation deviates.

`plan.md` covers: files changed, sequence of work, risks, and what will count as proof.

**Governance.** Design review happens *before* implementation. Plan revisions stay
logged with who approved them.

**Metrics.** Leading: first-pass merge rate, plan→PR time. Lagging: rework cycles per
change, and how far the final diff drifted from the plan.

**Auto mode** supports longer autonomous sessions once guardrails are mature — the
basis for team parallelism and for closing the SDLC loop autonomously.

**Legacy systems:** a repo file, an existing tool, or a bidirectional link can each be
declared the source of truth for an artifact, so this works next to established systems.

### `CLAUDE.md`

Lesson 5 — [The CLAUDE.md](https://academy.claude.com/courses/ai-native-sdlc-playbook/claude-md)

"CLAUDE.md gives Claude the context a new joiner would need, covering conventions,
commands, architecture, and the mistakes the team sees most often."

**Steps:** run `/init` to generate a starter from the codebase → cut it back to
day-one essentials (build/test/lint commands, load-bearing conventions, common errors)
→ keep it at the repo root under version control → **"When Claude makes a mistake
twice, the correction goes into CLAUDE.md"** → keep it under one page so it is read in
full at session start without burning context on stale detail.

A payments-service example carries: commands (build, unit/integration test, lint);
conventions (language version, data-type rules, testing requirements); architecture
(directory layout, module responsibilities); pitfalls (dependency restrictions, legacy
package policy).

**Metrics.** Leading: how often Claude repeats a mistake the file should have
prevented. Lagging: new-joiner onboarding → first merged PR.

### Skills as institutional knowledge

Lesson 6 — [Skills as institutional knowledge](https://academy.claude.com/courses/ai-native-sdlc-playbook/skills-as-institutional-knowledge)

"Write a skill for institutional knowledge that must be applied consistently."

**Steps:** pick knowledge that is currently enforced unevenly (security standards, API
conventions, brand guidelines) → create `.claude/skills/<name>/SKILL.md`, frontmatter
declaring the triggers and body describing the actions → distribute via the repo or
org-wide as a plugin → test that it triggers across task variations → update it when
policy changes, with the policy owner's approval → engineers pick up the new version
in their next session.

Example `secure-api-review` skill requires: JWT gateway auth on all external
endpoints; input validated against the OpenAPI schema; audit events emitted for
state-changing operations; PII kept out of logs and errors.

**Governance — important.** Skills are **advisory**: they guide Claude but do not
enforce. Deterministic enforcement needs hooks or review gates that *block*
non-compliant actions.

**Metrics.** Leading: policy approval → merged skill update. Lagging: PR findings
citing that policy, which should trend to zero.

Build-phase **hooks** supply the deterministic half: blocking protected edits, running
formatters, preventing credential leakage, backing critical policy.

### Parallel sessions and subagents

Lesson 7 — [Parallel sessions and subagents](https://academy.claude.com/courses/ai-native-sdlc-playbook/parallel-sessions-and-subagents)

- **Parallel sessions:** separate Claude Code instances on independent tasks, each in
  its own git worktree. The engineer is the only connection point.
- **Subagents:** scoped helpers inside one session, with their own context window and
  restricted tools, for recurring jobs like verifying the app.

"One engineer runs several Claude sessions at once, each in its own worktree on its own
task." The engineer's work shifts to orchestration and monitoring.

**Steps:** split work into file-independent tasks using plan-mode output → launch
sessions (`claude --worktree feature-auth`) → start with 2–3 and scale only as far as
your *review* capacity allows → define recurring jobs as markdown in `.claude/agents/`
with name, description, and tool permissions.

Example subagent: a verifier that runs the app, exercises the changed behavior, and
reports findings **without making fixes**.

**Governance.** Repo config, hooks, and permissions apply identically across every
session; actions are logged and attributed to the engineer who launched them.

**Metrics.** Concurrent sessions sustained without review quality dropping; changes
merged per week against rework rate from PR history.

---

## Stage 4 — Test

### Give Claude a feedback loop

Lesson 8 — [Give Claude a feedback loop](https://academy.claude.com/courses/ai-native-sdlc-playbook/give-claude-a-feedback-loop)

Traditionally "the signal that code works arrives late. CI minutes later, a tester days
later, production weeks later." Instead the session verifies its own work before a
human looks at it.

Not the same as a verifier subagent: **the loop iterates as often as needed; the
verifier runs once, in a fresh context, after the work is done**, for an unbiased final
read.

**Steps:**
1. Wrap verification into a single command (`make test`, `npm test`) that exits
   non-zero on failure.
2. List each command in `CLAUDE.md` with an example of successful output.
3. Make the target unambiguous: "all tests pass", "screenshot matches mock", "endpoint
   returns 200 with the new field".
4. For bugs, write the failing test first — have Claude reproduce and confirm the bug
   before fixing.
5. For UI, give it a screenshot or browser tool and let it run
   implement → screenshot → compare cycles.
6. Put "run all checks before marking the task done" in `CLAUDE.md`.
7. **Protect the loop:** block edits to test files during a fix, via git hooks or PR
   review.

**Evidence:** real command output, build logs, and screenshot diffs in the session
transcript, so code owners review knowing the mechanical checks already passed.

**Metrics.** Leading: first-pass CI success rate on agent-generated changes. Lagging:
PR review time and change failure rate.

### Continuous evals in CI

Lesson 9 — [Continuous evals in CI](https://academy.claude.com/courses/ai-native-sdlc-playbook/continuous-evals-in-ci)

"Evals are the AI-native equivalent of stage-gate QA. In practice that means a suite
that runs whenever the agent's configuration changes."

**Steps:** platform engineers collect 20–50 real tasks from production work, each with
its expected outcome → each becomes an eval defining what is acceptable (tests pass,
code quality holds, behavior preserved, policy followed) → the suite runs on any PR
touching `CLAUDE.md`, skills, or hooks, plus on a schedule → a config change that
lowers the pass rate needs team review before merge → every production incident becomes
a permanent regression eval.

The course shows a GitHub Actions workflow running Claude Code non-interactively,
iterating the eval files and checking results against expected outcomes.

**Governance.** Pass-rate thresholds as merge checks; an audit trail for comparison
over time.

**Metrics.** Leading: pass-rate trend, and incident → eval conversion time. Lagging:
regressions caught in CI vs. incidents that reached production.

---

## Stage 5 — Deploy

### AI in the PR review loop

Lesson 10 — [AI in the PR review loop](https://academy.claude.com/courses/ai-native-sdlc-playbook/ai-in-the-pr-review-loop)

Review capacity stops depending on who is free. "All PRs get an identical set of review
passes, with findings ranked by severity" — so human reviewers move from reading whole
PRs to judging **intent and risk**.

**Needs:** an up-to-date `CLAUDE.md`; Anthropic's managed Code Review service (research
preview) or `claude-code-action` in your own CI; model access via Bedrock, Vertex AI, or
Microsoft Foundry; branch protection requiring code-owner approval.

**Steps:** pick the deployment (managed service is fastest; `claude-code-action` gives
pipeline control) → write `REVIEW.md` defining the passes (bugs, security, compliance,
design principles), what counts as "Important" vs. "Nit", and exclusions such as
generated files → set human thresholds: findings neither auto-approve nor auto-block,
humans keep the gate through branch protection → tag `@claude` on a review comment and
it fixes and pushes, leaving an auditable thread → feed repeated mistakes back into
`CLAUDE.md` → tech leads rate findings monthly and cap nit volume (the example caps at
five per review).

**Governance.** Separation of duties holds: **the agent that wrote the code cannot
approve it.** Findings, fixes, and approvals all sit in PR history for audit.

**Metrics.** Leading: time to first review in minutes; review comments resolved without
a human touching the branch. Lagging: defects and vulnerabilities caught pre-merge vs.
those reaching production.

### Hooks as approval gates

Lesson 11 — [Hooks as approval gates](https://academy.claude.com/courses/ai-native-sdlc-playbook/hooks-as-approval-gates)

Hooks allow, block, or pause an action. Unlike Stage 3 guardrails, which run
autonomously, **deployment gates require human sign-off before proceeding**.

**Steps:** leadership names the approvals that must be human (change management,
release authorization, protected paths) → platform engineers turn each into a hook
script → team hooks live in `.claude/settings.json` under version control, critical ones
in admin-controlled **managed settings** → every block must explain itself and state the
approval path.

The example is a `PreToolUse` hook matching Bash, running `production-gate.sh`, which
refuses a production deploy without a release authorization: *"Production deploys need
a release authorization."*

**Enterprise controls in managed settings**, which engineers cannot circumvent:
permission deny/allow lists; sandbox enforcement with a network domain allowlist;
credential access restrictions; `allowManagedHooksOnly` so only administrator-defined
hooks run and user-level overrides are blocked; minimum version requirements.

**Metrics.** Leading: approval-gate wait time from OpenTelemetry timestamps. Lagging:
production incidents traced to gate violations, before vs. after.

### CI/CD integration and deployment

Lesson 12 — [CI/CD integration and deployment](https://academy.claude.com/courses/ai-native-sdlc-playbook/ci-cd-integration-and-deployment)

Claude runs non-interactively in the pipeline, sandboxed, with deployment capability
exposed through **MCP** rather than direct credentials.

**Needs:** AI review and approval gates already in place; a CI platform that can run
`claude-code-action` or `claude -p`; model access (API, Bedrock, Foundry, Vertex); MCP
servers for the deploy targets; isolated sandbox profiles with scoped, short-lived
credentials.

**Steps:**
1. Read-only first: `claude -p` for build triage and test summaries.
2. Then writes, PR-based only, behind the existing gates — lint fixes, docs updates.
3. Run agents in containers with network policy and temporary tokens.
4. Expose deploy, status, and rollback as scoped MCP tools, not shell commands.
5. Graduate autonomy dev → staging → production.
6. Rehearse rollback: "Rollback should be the most rehearsed path in the pipeline."

```yaml
- name: Triage failed build
  if: failure()
  run: >
    claude -p "Read the build log at out/build.log. Identify the most
    likely cause, say whether the failure looks flaky or real, and write a
    three-line summary for the PR thread." >> triage.md
```

**Governance.** Branch protection means agent output arrives as PRs, never commits to
main; a production-gate hook requires release-manager authorization; permissions are
graduated per environment.

**Metrics.** Leading: share of pipeline failures triaged without human escalation.
Lagging: DORA metrics straight from CI/CD and deployment systems.

---

## Stage 6 — Maintain

### Closing the loop on metrics

Lesson 13 — [Closing the loop on metrics](https://academy.claude.com/courses/ai-native-sdlc-playbook/closing-the-loop-on-metrics)

"Stage 6 shifts the focus to autonomous running of Claude to close the loop," with
deterministic confidence gates between phases. Instead of an alert waiting for a person,
"a trigger such as a control-band breach, a ticket, a channel message, or a schedule
invokes Claude without a person in the path."

**Steps:**
1. Pick one metric with a stable baseline (CI test failure rate, post-deploy 5xx rate).
2. Build the detection script on rolling windows and statistical rules (Western
   Electric) — **entirely deterministic**.
3. Define response tiers in version-controlled config:
   - **1σ** — log only
   - **2σ** — Claude reads the data and diagnoses
   - **3σ** — Claude proposes actions via PR or a pre-approved runbook
4. Deploy the trigger layer as a scheduled workflow, webhook, or cron job.
5. Have Claude generate an `intent.md` recording the anomaly, the evidence, and the
   proposed outcome.
6. Triage findings to product owners: fix, schedule, or dismiss.
7. Add evals so the same incident cannot recur.

The `bands.yaml` example watches CI test failure rate with Western Electric rules and
escalates log → diagnose → propose.

**Governance.** Tier boundaries in version-controlled config; production access
restricted through managed settings; every invocation, finding, and decision logged with
timestamps; **pre-approved runbooks only**.

**Metrics.** Leading: breach detected → `intent.md` created. Lagging: share of findings
that become merged fixes, and decline in repeated incident classes.

**Claude Tag** (public beta in Slack) "makes Claude a member of those channels", so it
responds in the incident thread and the institutional knowledge stays where the team
works. Work enters the loop as an incident message or a tagged ticket; small fixes
become PRs, larger work becomes an `intent.md` that restarts Stage 1.

---

## Closing thoughts and resources

Lesson 14 — [Closing thoughts and resources](https://academy.claude.com/courses/ai-native-sdlc-playbook/closing-thoughts-and-resources)

"Models and harnesses have become more advanced, allowing organizations to not just
transform how they produce code, but the entire software development lifecycle" — while
keeping human oversight and meeting enterprise governance and regulatory needs. The
playbook is presented as the "real best practices our Applied AI team executes on a
daily basis" with clients.

Resource list for platform teams, roughly in rollout order:

**Core setup and administration** — Claude Code organizational setup (admin decision
map); settings reference and precedence; server-managed settings via the Claude admin
console.

**Access and security** — permissions configuration; sandboxing (OS-level filesystem
and network isolation).

**Development and distribution** — hooks guide and reference; skills documentation;
plugins and private marketplace; managed MCP for controlling the tool surface.

**Enterprise infrastructure** — third-party deployment (Bedrock, Vertex AI, Microsoft
Foundry); network configuration; monitoring via OpenTelemetry and analytics dashboards;
Compliance API (activity feeds, chat management); security model documentation.

---

## Artifact chain, at a glance

```
idea ──Claude+person──▶ intent/<slug>/intent.md   (Stage 1, L2)
                              │  PO approves (commit)
                              ▼
                        intent/<slug>/spec.md     (Stage 2, L3) ── skills constrain, concerns flagged
                              │  PO reviews, tech lead on risk
                              ▼
                        plan.md                   (Stage 3, L4) ── plan mode, read-only first
                              │  engineer approves
                              ▼
            code + tests ──▶ self-verification    (Stage 4, L8) ── one command, non-zero on failure
                              │  evals gate config changes (L9)
                              ▼
                        PR ──▶ agentic review     (Stage 5, L10) ── REVIEW.md passes, human gate
                              │  hooks gate deploy (L11), MCP-scoped deploy (L12)
                              ▼
                        production ──▶ control bands (Stage 6, L13)
                              └──────── breach ⇒ new intent.md ────┘
```
