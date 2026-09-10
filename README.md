# AI-Native SDLC — notes and Stage 1→3 automation

Notes from Anthropic's [AI-Native SDLC Playbook](https://academy.claude.com/courses/ai-native-sdlc-playbook)
course, plus a working implementation of the Plan → Design → Build handoffs.

| | |
|---|---|
| [`docs/ai-native-sdlc-playbook.md`](docs/ai-native-sdlc-playbook.md) | Full course notes, all 14 lessons, each section linked to its source lesson |
| [`docs/spec-from-intent-automation.md`](docs/spec-from-intent-automation.md) | How Stage 2 is automated, and which lessons justify each design choice |
| [`docs/plan-handoff.md`](docs/plan-handoff.md) | Why `plan.md` is *not* generated, and what is automated at that gate instead |
| [`.claude/skills/write-intent/`](.claude/skills/write-intent/SKILL.md) | Skill: interview an originator and open a PR with `intent/<slug>/intent.md` |
| [`.claude/skills/plan-from-spec/`](.claude/skills/plan-from-spec/SKILL.md) | Skill: plan-mode session from an approved spec, interrogated, committed as `plan.md` |
| [`.github/workflows/spec-from-intent.yml`](.github/workflows/spec-from-intent.yml) | On an approved `intent.md` reaching `main`, generates `spec.md` and opens a PR |
| [`.github/workflows/plan-ready.yml`](.github/workflows/plan-ready.yml) | On an approved `spec.md` reaching `main`, opens a `plan: <slug>` task for an engineer |
| [`intent/`](intent/) | Where each change's `intent.md`, `spec.md` and `plan.md` live |

## The flow

```
idea → /write-intent ────────────▶ PR: intent.md ──▶ PO merges          = gate 1  (human)
     → spec-from-intent workflow ▶ PR: spec.md ────▶ PO merges          = gate 2  (human)
     → plan-ready workflow ──────▶ issue: plan: <slug>
     → /plan-from-spec ──────────▶ PR: plan.md ────▶ engineer accepts   = gate 3  (human)
     → build
```

Two automated steps, three human gates. `plan.md` stays interactive on purpose
([why](docs/plan-handoff.md)).

## The app

`src/` is a Next.js App Router application built around this SDLC tree — nothing above
moves. It's a foundation, not a product yet: no product screens, no data layer, no auth.
See [`CLAUDE.md`](CLAUDE.md) for how it's put together.

```bash
nvm use          # reads .nvmrc
npm ci
cp .env.example .env.local
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` | Vitest |
