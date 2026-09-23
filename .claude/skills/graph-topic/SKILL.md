---
name: graph-topic
description: Help anyone - engineer or not - add, rename, move or remove a topic in the AI learning graph, claim one (owner and status), or write its page, by editing src/lib/graph/seed.ts and content/ correctly, checking it the way the build will, and opening a pull request. Use when someone says "I'm starting on <topic>", "add <topic> to the graph", "I own/finished <topic>", "update the status of…", "write the page for…", "rename/move/remove <topic>", "add an image to <topic>", or asks how to put something on the graph.
---

# Work on a graph topic

The graph at `/graph` is drawn from **two places**, and every change is one or both:

| What | Where | Holds |
| --- | --- | --- |
| **The tree** | `src/lib/graph/seed.ts` | Topic names and nesting. Nothing else. |
| **A topic's page** | `content/<address>/index.md` or `content/<address>.md` | Owner, status, tags, and the written page. Optional. |

**Every topic already has a page**, generated from the tree, whether or not a file
exists. Without a file it reads "Unassigned", "Todo" and "No content yet." A content file
only fills that page in. So "starting on a topic" is usually *writing one small file*, not
touching the tree at all.

The person you are helping may not be an engineer. Talk in their terms: topics, pages,
owner, status. Do not show them TypeScript unless they ask. Do every file edit yourself.

## Procedure

1. **Ask what they are working on, and what they want to happen.** Most requests are one
   of these:
   - **Claim or update a topic.** Set the owner and/or status. Content file only.
   - **Write or edit its page.** Content file only.
   - **Add a new topic.** Tree, plus an optional content file.
   - **Rename or move a topic.** Tree, plus moving its file(s). See *Renaming and moving*.
   - **Remove a topic.** Tree, plus deleting its file(s). See *Removing*.
   - **Add an image to a page.** `public/content/…`, plus the content file.

2. **Find the topic in the tree.** Read `src/lib/graph/seed.ts` and show the person the
   branch it sits in, as a path: `PD AI › n Node › RAG`. Match loosely: "rag", "RAG
   pipelines" and "retrieval" may all mean the existing `RAG`. Ask before you assume.
   - **If it isn't there**, it's a new topic. Propose where it belongs: name the parent,
     show its current children, and say why. Let them choose. Placement is their call.
   - Work out its **address** (see *Addresses*) and tell them the page URL:
     `/graph/<address>`.

3. **Start a branch from an up-to-date `main`.** `git switch main && git pull`, then
   `git switch -c content/<short-slug>`, e.g. `content/claim-rag`. Never commit to `main`.

4. **Make the edits** by following the rules below. Keep the change to what they asked
   for. Do not tidy other topics or rename placeholders nobody asked about.

5. **Check it the way CI will.** Run all four. The build is what validates the content
   files against the tree:
   ```bash
   npm run lint && npm run typecheck && npm test && npm run build
   ```
   If anything fails, look the message up in *When the build fails*, fix it, and explain
   in one plain sentence what was wrong. **Do not edit test files to make them pass.** The
   tests that read the live tree check only rules that hold for any content. If one fails,
   the edit broke a real rule (usually the layout: too many children crowding a branch).
   Stop and tell the person to ask an engineer.

6. **Offer a preview.** `npm run dev`, then open `http://localhost:3000/graph/<address>`
   for the page and `http://localhost:3000/graph?focus=<address>` for its place in the
   graph.

7. **Show what changed and confirm before publishing.** List the files in plain words
   ("adds a page for Techniques, owned by Ana, In Progress"). Remind them that
   **everything merged is public to every visitor immediately**, with no drafts. Only
   once they say yes: commit as `content: <what changed>` and open the PR:
   ```bash
   gh pr create --title "content: <what changed>" --body "<plain summary, page URL(s)>"
   ```
   End the PR body with the attribution line your session's instructions give for pull
   requests. Hand them the link. A reviewer merges it, and the page is live on deploy.

## The content file

```md
---
title: Retrieval-Augmented Generation
tags: [retrieval, llm]
assignee: Ana Petrović
status: In Progress
---

A few paragraphs in markdown. Tables, checklists, code blocks and images all work.
```

- **Every key is optional, and these four are the only ones allowed.** Any other key,
  including a misspelling like `staus`, fails the build.
- `status` must be exactly `Todo`, `In Progress` or `Done`, with that capitalisation.
- `assignee` is free text, and **a typo ships silently**. Before writing a name, check
  how it's already spelled: `grep -rh "^assignee:" content/ | sort -u`.
- `title` changes the page heading only. The tab title and the graph label always use
  the topic's name from the tree. Leave `title` out unless the name is a short form
  (`RAG`) and the heading should be the long one.
- `tags` are small labels on the page. They are lower-cased, and duplicates are dropped.
- **YAML traps.** Quote a value that YAML would read as something else:
  `assignee: "Yes"`, `title: "2024 roadmap"`, and any value containing `: ` or starting
  with `[`, `{`, `#` or `-`. An unquoted `assignee: 2024` fails the build.
- **The body.** Don't start with a `# Title` line, because the page already shows the
  title. Headings you write render one level down (`#` becomes a sub-heading). Raw HTML
  shows as literal text, never as markup. A file with no body reads "No content yet.",
  the same as having no file, so claiming a topic before writing about it is fine.
- **Links to other topics** use their address: `[Vector db](/graph/n-node/rag/vector-db)`.
  These links are **not checked**, so get the address right (see *Addresses*).
- **Images** go in `public/content/<address>/`, e.g.
  `public/content/n-node/rag/pipeline.png`, and are referenced from the body as
  `![Pipeline diagram](/content/n-node/rag/pipeline.png)`. Always write real alt text.
  Never put images under `public/graph/`: that path collides with the page routes.
- **One file per topic**, as either `<address>/index.md` or `<address>.md`, never both.
  Prefer `<address>/index.md`: it keeps working when the topic later gets children.

## Addresses

A topic's address is its path of names, **without the hub**. Each name is lower-cased,
every run of characters other than `a-z` and `0-9` becomes a single `-`, and leading or
trailing `-` are dropped.

| Tree path | Address | Page | Content file |
| --- | --- | --- | --- |
| PD AI › n Node › RAG | `n-node/rag` | `/graph/n-node/rag` | `content/n-node/rag/index.md` |
| PD AI › AI Agents › Workflows › n8n | `ai-agents/workflows/n8n` | `/graph/ai-agents/workflows/n8n` | `content/ai-agents/workflows/n8n/index.md` |
| PD AI › Protocols › MCP › Oauth with Keycloak | `protocols/mcp/oauth-with-keycloak` | … | `content/protocols/mcp/oauth-with-keycloak/index.md` |

**The hub (`PD AI`) has no page and no content file.** `/graph` is its page, and
`content/index.md` fails the build.

## Rules for the tree (`seed.ts`)

A topic is `{ name: "…" }`, and a topic with sub-topics is
`{ name: "…", children: [ … ] }`. Nothing else goes on it: no owner, no status. Those go in
the content file, and putting them in the tree fails the build.

- **Names:** 1–60 characters, no leading or trailing spaces, and at least one letter or
  digit. Keep the author's wording and casing (`n8n`, `pgvector`).
- **Siblings must differ after slugging.** `RAG` and `rag` under the same parent, or
  `C++` and `C`, collide, and the build fails.
- **At most five levels, counting the hub.** `PD AI › n Node › RAG › Vector db › pgvector`
  is already as deep as it goes: nothing can be added under `pgvector`. If a sixth level
  seems needed, suggest a sibling instead, or say it's a content decision for an engineer
  (`MAX_DEPTH`).
- **At most 150 topics in total.**
- **Four top-level topics, and no more.** The first level (the ring round the hub) already
  has four, and each has its own colour. **A fifth does not fail the build. It silently
  gives two branches the same colour.** Never add one yourself. Say it needs a product
  decision (CLAUDE.md, "The ring holds four topics") and offer to place the topic inside
  an existing branch instead.
- **Order matters a little.** Children appear in the order written, in the page's "Key
  Topics" list and in the key. Add a new topic at the end unless they want it elsewhere.
- Some names are **recorded verbatim as placeholders or notes**, marked with comments
  like `// [verbatim - reads as a note] (D-11)` or `// [placeholder name…] (D-10)`. If the
  person renames one of those, delete its marker comment too. Otherwise leave them alone.

## Renaming and moving

A topic's address is built from its name **and every name above it**. So renaming or
moving a topic changes the address of it **and all of its sub-topics**:

1. Edit the tree.
2. For the topic and every descendant that has a content file, move the file to the new
   address with `git mv`, and do the same for any `public/content/<old-address>/` images
   folder. An un-moved file fails the build naming it ("matches no node in the tree"), so
   the build will catch any you miss.
3. Find links other pages make to the old address, fix them, and fix image paths inside
   the moved pages:
   `grep -rn "/graph/<old-address>\|/content/<old-address>" content/`.
   **Nothing checks these**, so a missed one is a dead link.
4. Tell the person that **old links and bookmarks to the page stop working**. There are
   no redirects, and a stale "View Graph" link falls back to the overview.

**Never rename the hub (`PD AI`) as a routine edit.** Its name is part of every topic's
internal id, and tests depend on it. Tell the person that's an engineering change.

## Removing

Remove the topic from the tree. **Its sub-topics go with it.** Say which ones before you
do it. Then delete the content files and image folders for all of them, and grep
`content/` for links to their addresses, as in step 3 above.

## When the build fails

| Message contains | What it means | Fix |
| --- | --- | --- |
| `content/<path>: matches no node in the tree` | The file's path isn't any topic's address: a typo, or a topic that was renamed, moved or removed | Move or rename the file to the right address, or delete it |
| `already has content/…` | Two files for one topic (`x.md` and `x/index.md`) | Merge them into one |
| `content/<path>: …Unrecognized key…` | A frontmatter key other than `title`, `tags`, `status`, `assignee` | Fix the spelling, or remove the key |
| `content/<path>: status: …` | `status` isn't exactly `Todo`, `In Progress` or `Done` | Use one of the three, with that capitalisation |
| `content/<path>: assignee: …` / `title: …` | Empty, has surrounding spaces, over 60 characters, or YAML turned it into a number or boolean | Trim it, or quote it |
| `frontmatter could not be parsed` | Broken YAML: often an unquoted `: `, or a missing closing `---` | Quote the value, and check both `---` lines |
| `the hub has no page` | `content/index.md` exists | Delete it. The hub's page is `/graph` |
| `Invalid graph seed - … Unrecognized key` | Something besides `name`/`children` on a topic in the tree (often `assignee`/`status`) | Move it into the topic's content file |
| `Invalid graph seed - duplicate node id` | Two siblings slug to the same name | Rename one |
| `Invalid graph seed - … sits at depth 5` | A sixth level | Place it higher. See the depth rule |
| `Invalid graph seed - … has no usable id` | A name with no letters or digits | Use a real name |
| `must be non-empty and free of leading/trailing whitespace` | A name with spaces at either end, or empty | Trim it |
| `Invalid graph seed - more than 150 nodes` | Over the node budget | Needs an engineer (`MAX_NODES`) |

## Rules for you

- Touch only `src/lib/graph/seed.ts`, `content/**` and `public/content/**`. Anything else
  (tests, components, colours, layout) is out of scope for this skill. Say so and stop.
- Never add a fifth top-level topic, a sixth level, or a content file for the hub.
- Never invent page content. Write what the person tells you, in their words. If they
  want a starter page, offer a skeleton of headings for them to fill in, and leave the
  body empty until they give you words.
- Never open the pull request before the person has seen the change and said yes.
