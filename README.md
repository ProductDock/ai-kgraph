# ai-kgraph — the AI learning graph

A 3D map of the AI topics we are learning about. It's a hub, a ring of top-level topics,
and branches growing outward, and you can orbit it, click to focus, and hover (or
long-press on a tablet) to see who owns a topic and how far along it is. Every topic can
have its own markdown page, opened from that card and served at `/graph/<topic>`.

## Adding to the graph

You don't need to be an engineer. In Claude Code, say what you want, e.g. *"I'm starting
on pgvector"*, *"add LangGraph under AI agents"*, *"write the page for RAG"*. The
[`graph-topic`](.claude/skills/graph-topic/SKILL.md) skill makes the edit, checks it the
way the build will, and opens a pull request for someone to review.

By hand, the tree and the pages live here:

| | |
|---|---|
| [`src/lib/graph/seed.ts`](src/lib/graph/seed.ts) | The tree: names and nesting only. At most five levels deep, sibling names unique. |
| [`content/`](content/) | One page per topic, `content/<address>.md` or `content/<address>/index.md`. Frontmatter holds `title`, `tags`, `status` (`Todo`/`In Progress`/`Done`) and `assignee`. |
| `public/content/<address>/` | Images for that page, referenced as `/content/<address>/<file>`. |

The build fails, naming the file, on a page that matches no topic, an unknown key, or a
status outside those three. Everything in `content/` is public once merged.

## Skills

The repo ships Claude Code skills in [`.claude/skills/`](.claude/skills/). Open Claude Code
in the repo and either type the slash command or just say what you want. Each skill
triggers on phrases like the ones below, so you rarely need to remember the name.

**Anyone, engineer or not**

| Skill | Use it when | Say, for example |
|---|---|---|
| [`/graph-topic`](.claude/skills/graph-topic/SKILL.md) | You're adding, claiming, renaming, moving or removing a topic, changing its status, or writing its page. It edits `seed.ts` and `content/`, checks them the way the build will, and opens a PR. | *"I'm starting on pgvector"*, *"I finished RAG"*, *"add an image to n8n"* |
| [`/write-intent`](.claude/skills/write-intent/SKILL.md) | You have an idea, a pain point or a bug that's bigger than a content edit. It interviews you and opens a PR with `intent/<slug>/intent.md`, which starts the [SDLC flow](docs/sdlc.md). Use this before any code, not after. | *"I have an idea…"*, *"we should fix X"* |
| [`/grilling`](.claude/skills/grilling/SKILL.md) | You want a plan or decision stress-tested before you commit to it. It asks questions in rounds, each with a recommended answer. | *"grill me on this"* |

**Engineers building a change**

| Skill | Use it when | Say, for example |
|---|---|---|
| [`/plan-from-spec`](.claude/skills/plan-from-spec/SKILL.md) | You're picking up a `plan: <slug>` issue. It reads the approved `intent.md` and `spec.md`, works through the plan with you in plan mode, and commits `plan.md`. It never implements anything and never opens a PR. | *"let's implement node-content-pages"*, *"write the plan"* |
| [`/design-system`](.claude/skills/design-system/SKILL.md) | You're writing a spec or plan that touches UI, or building or reviewing a component. It applies ProductDock's colour, type, spacing, motion and accessibility rules. | *"check this against the brand guidelines"* |
| [`/extract-design-system`](.claude/skills/extract-design-system/SKILL.md) | Rarely. It pulls starter tokens from a public website into `design-system/`. The current tokens came from a productdock.com extraction; re-running it over them is a brand decision, not a refresh. | *"extract the design system from <url>"* |

**Reviewing**

| Skill | Use it when | Say, for example |
|---|---|---|
| [`/nextjs-code-review`](.claude/skills/nextjs-code-review/SKILL.md) | Before you open a PR that touches `src/`. It checks Server/Client Component boundaries, caching, metadata and performance. | *"review my Next.js changes"* |
| [`/security-review`](.claude/skills/security-review/SKILL.md) | A change handles input, rendering of user content, headers or env vars. | *"security review this branch"* |

You don't have to run the two review skills yourself on a PR. Comment `@review` on it and
[`claude-review.yml`](.github/workflows/claude-review.yml) runs both against
[`REVIEW.md`](REVIEW.md). It only posts comments; a human still approves.

## Running it

```bash
nvm use          # reads .nvmrc
npm ci
cp .env.example .env.local
npm run dev      # then open http://localhost:3000/graph
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` | Vitest |

When a new version passes `verify` on `main`, Slack hears what changed and who worked on
it ([`release-notify.yml`](.github/workflows/release-notify.yml)).

## More

- [`CLAUDE.md`](CLAUDE.md): how the app is put together, and the rules behind the
  graph's layout, colour and camera.
- [`docs/sdlc.md`](docs/sdlc.md): the AI-Native SDLC process this repo is built with
  (intent → spec → plan).
