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
