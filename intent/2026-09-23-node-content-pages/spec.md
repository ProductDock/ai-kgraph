# Spec: give every node its own content page, written in markdown

- **Intent:** [`intent.md`](./intent.md) — *give every node its own content page, written in markdown*
- **Originator:** Nemanja Vasic
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** awaiting product owner and engineering review

## Review guide

This spec has two audiences, split so each can stop where their job ends.

- **Product owner:** read **Part A** and **Areas of concern**. Between them you have
  everything you need to approve, redirect, or cut a decision — what changes on screen,
  what's still open, and where this spec had to make a call in your name. No file names,
  code, schemas, or rendering mechanics appear in Part A; where a technical choice has a
  consequence you'd care about, it's stated as that consequence, with a pointer into
  Part B for whoever wants the mechanics.
- **Engineering:** read Part A for the same context the product owner has, then Part B,
  which is where the build actually lives, then **Areas of concern**.
- **Both:** every item in **Areas of concern** is written so the product owner can act on
  it without reading Part B.

Section numbers run continuously across both parts, so a cross-reference like "see §9.4"
always points at the same place no matter which part you're in.

---

## Part A - Product

### 1. Summary

The hover card added by `node-hover-card` shows a node's name, owner and status, and a
fourth row — "Open page" — that has never gone anywhere. Today the graph tells you *what*
a topic is called and *who* owns it, but not what the topic actually *is*: there's no
explanation, no notes, no list of what hangs off it. This spec builds the destination that
row has been pointing at since it shipped.

Every node except the hub gets its own page, written in markdown and reached either by
clicking "Open page" on its card or by typing its address directly. A page shows a way
back to the graph, a way to jump straight into the graph already centred on that node, a
breadcrumb of where it sits in the tree, its title, tags, owner and status, its written
content, and a list of what hangs off it. A node nobody has written anything for still gets
a real page — it just says so, rather than being a dead end.

The content itself moves into the repository as markdown files, authored and changed
through the same pull-request workflow the graph's own topics already use. Two facts that
used to live in the tree's own definition — who owns a topic, and how done it is — move
with it: they become part of a topic's written content instead of part of its place in the
tree. The tree itself doesn't change shape because of this — what topics exist and how
they nest is still decided in one place, same as always.

### 2. Scope

#### 2.1 In scope

- A real destination for "Open page," on every node's card except the hub's: clicking it
  opens that node's page in the same tab, and the browser's Back button returns to the
  graph. It works the same way after a desktop hover and after a tablet long-press.
- A page for every node except the hub, showing, in order: a link back to the graph
  overview, a link that opens the graph already centred on this node, a breadcrumb of the
  node's place in the tree, the node's title/tags/owner/status, its written content, and a
  "Key Topics" list of what hangs off it — generated from the tree, never typed by hand.
- A working page for a node nobody has written anything for yet — its title, owner,
  status and Key Topics still show, with a plain "no content yet" note standing in for the
  missing body, so "Open page" never leads to a dead end.
- The hub's card changes: it shows only the hub's own name — no "Open page," no owner, no
  status — because the hub is the frame the graph sits inside, not a piece of work with an
  owner of its own. There's no page for the hub; the graph overview already is one.
- Written content that supports the formatting people already expect from a markdown
  file on GitHub — tables, strikethrough, checklists, links, highlighted code, images kept
  in the repository — but never raw HTML: anything written as an HTML tag shows up as
  plain text, not as a rendered element.
- Who owns a topic and how done it is move out of the tree's own definition and into that
  topic's written content, changed the same way — an edit and a pull request. A topic with
  no written content, or written content that leaves one or both out, still reads
  "Unassigned" / "Todo," exactly as it does today.
- A typo'd address, or a link to a topic that's since been renamed or removed, shows a
  clear "page not found" view with a way back to the graph, rather than an error or a blank
  page.

#### 2.2 Out of scope

Restated from the intent, so nothing below is quietly folded into this piece of work:

- Any admin screen, editor, or import tool for writing content. It's hand-written markdown,
  in pull requests, the same as the tree's topics are today.
- What topics exist, how they nest, and what order they come in. That's still decided in
  one place; content only adds to a topic that already exists there.
- A one-line description per child in a "Key Topics" list — the intent considered this and
  declined it; the list shows names only (§3, Q3).
- Any draft, unpublished, or staged state for a page. There is no notion of "written but
  not yet public" — a merged pull request is live to every visitor immediately, the same
  model the tree itself already uses (§3, Q5; Areas of concern, C-1).
- Redirects for a page whose address has changed because its topic was renamed. An old
  link simply stops working (§3).
- Any change to how the 3D graph itself is drawn. Colour, size and position mean exactly
  what they mean today; a topic's written content is something you reach by leaving the
  graph, never a new visual channel on the graph itself.
- Checking that a link from one topic's content to another actually lands somewhere real.
  A broken cross-reference between two pages is possible and isn't caught (§6; Areas of
  concern, C-4).
- Making "Open page," or anything else on the card, reachable without a mouse, trackpad,
  or touchscreen. The graph's existing gap for keyboard and screen-reader use is untouched
  by this feature, except that it now also hides a real destination, not just information
  (§6; Areas of concern, C-2).
- Tag pages, or filtering the graph by tag. Tags are shown as plain labels and do nothing
  else — a deliberate limit the intent states outright.

#### 2.3 Deferred

- Whether tags should eventually drive anything — filtering, a tag index — is explicitly
  future work, not a promise made here.
- Any richer treatment for images beyond showing them at the size and shape they were
  authored at — no responsive sizing, no optimisation pipeline.
- Whether the graph's own known gap for keyboard and screen-reader users (tracked
  separately) should be reprioritised now that it also hides a working link. This spec
  doesn't make that call (Areas of concern, C-2).
- Any way to check, at review time, that a content page's links to other pages still
  resolve. Flagged as a real gap now (§6; Areas of concern, C-4), not solved here.

### 3. Decisions that close the open questions

The intent left six open questions. Five are closed here with a reasoned decision; the
sixth is not an engineering or design call to make, and is carried to **Areas of concern**
instead.

One clarification before the table: the intent's own worked example shows only a back
link, a "View Graph" link, and the title/owner/status block — it doesn't show the
breadcrumb the "Proposed outcome" section separately asks for. This spec treats the
bulleted list as the requirement and the worked example as illustrative of the title block
only, the same way the `node-hover-card` spec resolved an identical wrinkle in its own
worked example. Separately: the back-link's wording ("Back to AI Learning Graph") and the
breadcrumb's wording are not the same thing — the back link is fixed chrome text, while the
breadcrumb is built from each ancestor's actual authored name in the tree (currently
starting from the hub's own name, "PD AI," which is still a provisional placeholder per the
base graph spec's own open question). The two will read differently on screen, and that's
expected, not a bug.

| # | Open question | Decision |
| --- | --- | --- |
| Q1 | Should "View Graph" also work as a shareable link to a focused node? | Yes. It's an ordinary link that names which node to focus on arrival, so copying it, sending it to someone else, or reopening it later reproduces the same focused view (§9.6). An address that names a node which no longer exists doesn't error — it opens the ordinary overview instead, the same way a stale bookmark to the graph itself would (§4, D-1). |
| Q2 | Does moving owner/status out of the tree force an empty-looking content file for every node that has them today? | No. A content file is only created where there's a real, authored fact to put in it — today, that's exactly the two topics that already carry an owner or a status. Neither file is empty: each carries the fact that was already authored, even where there's little or no written body yet (§4, D-4; §7). |
| Q3 | Should "Key Topics" show a one-line description per child? | No, as the intent's own reasoning already concludes — no field for that was chosen, so the list shows child names only, generated from the tree. |
| Q4 | Do content pages need the same accessibility bar as the graph's own chrome? | Yes, and more firmly than the question implies: unlike the 3D graph, a content page is an ordinary page — there's no structural reason it can't meet the same WCAG 2.2 AA bar as the rest of the site's chrome, so this spec treats it as a requirement, not an aspiration (§8). |
| Q5 | Is it acceptable that content pages are public to every visitor, with no notion of draft or unpublished? | Not something this spec closes — it's a call about what's acceptable to publish, not a design or engineering question. Carried to **Areas of concern, C-1**, unresolved. |
| Q6 | Should the page's browser-tab title and link-preview title be the node's name or its written title? | The node's name. A written `title` changes the on-page heading only, the same limit the intent's own Constraints already state; keeping the tab title and address tied to the same name keeps one identity for a topic wherever it's referenced from, rather than two different strings depending on where you're looking. |

### 4. Decisions added beyond the intent

The intent settled the shape of the outcome and, with §3 above, five of its own open
questions. Turning that into something buildable needed a small number of further calls.
None of these should be read as settled just because they're written down — confirm or
cut each one.

1. **A "View Graph" link that names a node which no longer exists opens the ordinary
   overview instead of an error.** The intent asks for "not found" handling for a content
   page's own address (§2.1), but a stale link *into the 3D view* is a softer failure —
   the graph itself still loads fine, just without the focus the link intended. **This is a
   value this spec adds, not one the intent specified** — confirm that a silent fallback is
   the right call, or ask for it to show a brief notice that the requested topic couldn't
   be found instead.
2. **Content pages get their own "page not found" wording** — "back to the graph," not
   the sitewide page's "back to home" — so a broken link into this feature reads as
   pointing you back to where you came from, matching the intent's own wording (§2.1)
   literally rather than reusing a generic message written before this feature existed
   (§9.3). **Confirm this small piece of extra wording is worth having**, or ask for the
   sitewide "not found" page to be used unchanged.
3. **Images live in a predictable public location that mirrors a topic's address, not
   literally inside the same folder as its markdown file.** The intent asks for images
   "stored in the repo next to the page" (§2.1); this spec narrows that to "the same
   address, a different folder" in exchange for adding no new build step and no new server
   route to what is otherwise a fully static app (§9.4). The practical difference for
   whoever writes a page: an image for the RAG topic's page lives at a fixed public path
   built from `n-node/rag`, not literally beside `rag`'s markdown file the way a folder-only
   convention would suggest. **This is the decision in this document most worth checking
   against how people actually expect to add an image** — confirm it, or ask for the
   literal "beside the file" version, which is more build machinery than this spec adds.
4. **A content file that exists only to carry an owner or a status, with no written body,
   reads exactly like a missing file** — the same "no content yet" note, not a page that
   looks technically finished but reads as blank. This directly answers Q2's underlying
   worry: a page never looks broken just because nothing has been written yet, whether or
   not a file exists behind it.
5. **A link from one topic's content to another isn't checked against the tree.** The
   intent's build already fails when a *file* is orphaned by a rename (§2.1); this spec
   doesn't extend that check to a *link* written inside a file's own body, because doing so
   is real, unscoped work (parsing every body for internal links, resolving each one against
   the tree, on every build). **Confirm this gap is acceptable for now** (§6; Areas of
   concern, C-4) — it's the same shape of trade the intent already accepts for renamed
   topics, extended to a second kind of reference the intent didn't anticipate.
6. **Code blocks are coloured using the app's own existing set of role colours, not a
   third-party syntax theme.** A ready-made syntax-highlighting theme would be the first
   set of colours in this app that never went through the brand mapping every other surface
   has (§9.4). **This is a quality bar this spec is holding itself to, not one the intent
   asked for** — confirm it's worth the small amount of extra design work, or accept a
   ready-made theme as a faster, off-brand alternative.

### 5. Functional requirements

Each of these is something you can point at, click, or type into an address bar, on
screen; verification is §11.

- **FR-1.** Clicking "Open page" on any node's card, other than the hub's, opens that
  node's own page, in the same browser tab.
- **FR-2.** The browser's Back button, from a node's page, returns to the graph showing
  the same view it showed before the click.
- **FR-3.** "Open page" opens the same page whether it was reached by a desktop hover or
  a tablet long-press.
- **FR-4.** An open card never blocks the scene underneath it from being dragged — for
  example, starting an orbit-drag on top of a card still turns the graph, exactly as it
  would with no card open.
- **FR-5.** Every node except the hub has its own page, at an address built from its
  slugged name path, matching the path of its parents — e.g.
  `/graph/n-node/rag/agentic-rag`.
- **FR-6.** A node with no written content still shows a working page: its title, owner,
  status, and Key Topics list, with a plain "no content yet" note in place of a body.
- **FR-7.** Each entry in a "Key Topics" list is a child's own name, generated from the
  tree rather than typed by hand, and links to that child's own page.
- **FR-8.** The hub's card shows only its own name — no "Open page" row, no Assignee row,
  no Status row — and the hub has no page of its own; `/graph` is its page.
- **FR-9.** An address that matches no node — a typo, or a link to a topic that's been
  renamed or removed — shows a "page not found" view with a way back to the graph.
- **FR-10.** A page's written content renders GitHub-flavoured formatting — tables,
  strikethrough, checklists, autolinks — highlighted code blocks, images stored in the
  repository, and links to other topics' pages; anything written as a raw HTML tag shows
  as plain text, never as rendered markup.
- **FR-11.** A node's Assignee and Status are read from its own written content; a node
  with no content, or content that leaves one or both fields out, reads "Unassigned" /
  "Todo," exactly as it does today.
- **FR-12.** Clicking "View Graph" from a node's page opens the graph with the camera
  already flown to and centred on that node — the same view reached by clicking that node
  directly inside the graph.
- **FR-13.** The address "View Graph" opens is an ordinary, shareable link: copying it,
  sending it to someone else, or reopening it later reproduces the same focused view.
- **FR-14.** Clicking a node inside the 3D graph is unchanged by any of this: it still
  only moves the camera and never navigates away from the graph.

Checkable, in the intent's own words: open `/graph`, hover the `RAG` node, click "Open
page," and land on a page showing its title, owner, status, written content, and a Key
Topics list of its children — with a way back to the graph and a way to reopen the graph
centred on `RAG`.

### 6. Risks

| Risk | Why it matters |
| --- | --- |
| **Written content, like owner and status before it, is public to every visitor the moment a pull request merges, with no draft state** (§3, Q5; Areas of concern, C-1). | This extends an exposure the `node-hover-card` spec already put on the record for two short fields to full written prose — notes, in-progress thinking, anything typed into a topic's body — the moment it's merged, not when someone decides it's ready to be read. |
| **A broken or stale link between two topics' pages ships silently** (§4, D-5; Areas of concern, C-4). | Nothing in the build catches a link that pointed at a topic which has since been renamed or removed — unlike a renamed node's orphaned content *file*, which does fail the build. A reader can click through to nothing without anyone knowing until they report it. |
| **The graph's known gap for keyboard and screen-reader users now also hides a working link, not just information** (Areas of concern, C-2). | Before this feature, that gap meant "you can't read a topic's name or owner any other way." After it, the same gap also means "you can't reach a topic's actual content any other way either" — a stronger version of a risk the `node-hover-card` spec already accepted for two fields, now extended to the whole feature this spec builds. |
| **Every content file becomes a second place, alongside the tree's own definition, that has to stay consistent with it.** | A rename handled correctly in the tree but missed in a cross-link, an image path, or an old bookmark degrades quietly — a reader hits a dead link or a missing image rather than the build catching it, the same trade the intent already accepts for a renamed node's file placement, now spread across more surfaces. |
| **This is the first time this app renders externally-authored-looking formatted text at all.** | Every piece of content here is still pull-request-reviewed, committed data — not a stranger's input — but a bug in the rendering step itself (as opposed to the content) is the first place this app would have anything resembling an HTML-injection-shaped failure mode, even though nothing about the trust model actually changed (§10). |

---

## Part B - Technical design

### 7. How this fits the existing app

This adds a new, purely build-time content source, a new route tree under `/graph/`, a
change to what the seed schema is allowed to hold, and small, additive changes to the
existing hover card and 3D scene. It adds no environment variable and, deliberately, no
new server action or API route — every page this spec adds is resolved entirely at build
time, the same way the graph itself already is.

| File | Change |
| --- | --- |
| `src/lib/graph/schema.ts` | `graphSeedSchema` loses `assignee` and `status`. Back to exactly `name` and `children`, still `.strict()` — an unrelated typo'd key still fails the build the same way it does today. |
| `src/lib/graph/types.ts` | `GraphSeed` loses `assignee?`/`status?`. `GraphNode` loses them too — they're no longer a property of a node's *place in the tree*, they're a property of its *content*, resolved in a different module (§9.2). A new interface, e.g. `NodeContent` (`assignee`, `status`, `title`, `tags`, `body`, `hasFile`), carries them from here on. |
| `src/lib/graph/tree.ts` | `flatten()` stops defaulting `assignee`/`status` — that default now lives in the content module, applied once there instead (§9.2). Everything else about `flatten()` — ids, depth cap, sibling-uniqueness, node budget — is unchanged. |
| `src/lib/graph/content.ts` (new) | Walks `content/`, matches each file to a node id, validates its frontmatter, and returns a `Map<nodeId, NodeContent>` covering every node — including ones with no file, resolved to the defaults. Fails the build, naming the file, for every condition the intent lists (§9.1). |
| `src/lib/graph/scene.ts` | `buildScene()` gains a step between `flatten()` and layout: it calls the new content module and copies `assignee`/`status` onto each scene node, exactly where `flatten()` used to put them. Nothing about layout, colour, or radius changes — content still doesn't feed the picture (§9.7). |
| `src/lib/graph/seed.ts` | `RAG` loses its `assignee`/`status` fields; `Evals` loses its `status` field. Both facts move into new content files (below). |
| `content/n-node/rag/index.md` (new) | `assignee: Nemanja Vasic`, `status: Done` in frontmatter; body is the intent's own worked-example paragraph about RAG, carried over verbatim, the same "ship what was written, don't invent copy" convention `seed.ts` already follows for its own placeholder labels. |
| `content/n-node/evals/index.md` (new) | `status: In Progress` in frontmatter; no body — reads as "no content yet" (§4, D-4), same as a node with no file at all. |
| `src/app/graph/[...slug]/page.tsx` (new) | The content-page route (§9.3). Server Component; `generateStaticParams` lists every non-hub node's id, split into segments; `dynamicParams = false`, so an address outside that list 404s without the page component ever running. Renders the back/View-Graph links, breadcrumb, title/tags/assignee/status, rendered body (or the "no content yet" note), and Key Topics list. |
| `src/app/graph/not-found.tsx` (new) | Segment-level "not found," reached by `notFound()` from the route above: "back to the graph" instead of the sitewide page's "back to home" (§4, D-2). The existing `src/app/not-found.tsx` is untouched and still covers the rest of the site. |
| `src/components/common/markdown-body.tsx` (new) | Renders a node's markdown body: GFM tables/strikethrough/checklists/autolinks, highlighted fenced code, images, and internal/external links — never raw HTML (§9.4). A Server Component; no client JavaScript is added for a content page. |
| `src/app/graph/_components/node-hover-card.tsx` | `NodeCardContent` gains an `href: string | null` field — `null` only for the hub. When `href` is set, "Open page" becomes a real link, scoped with its own `pointer-events-auto` inside the still-`pointer-events-none` card, and given `tabIndex={-1}` (§9.5). When `href` is `null`, the card renders the name row only — no Assignee, Status, or Open-page row at all (FR-8). |
| `src/app/graph/_components/graph-scene.tsx` | `openCard()` now builds the card's content including `href` (`null` when `node.parentId === null`, i.e. the hub). Separately, the scene reads an initial `focusId` prop: if it names a real node, the intro sweep is skipped and `focusNode()` is called immediately on arrival instead (§9.6); otherwise, behaviour is unchanged. |
| `src/app/graph/_components/graph-view.tsx` | Gains a `focusId: string \| null` prop, threaded straight through to `GraphSceneCanvas`. |
| `src/app/graph/page.tsx` | Reads a `focus` request parameter and passes it down as `focusId` (§9.6). Engineering note: this app's installed Next.js major is newer than this document's author has direct access to (`node_modules` isn't present in the environment this spec was written in) — confirm the exact shape request parameters take in a Server Component in this version before implementing, per `CLAUDE.md`'s standing instruction to read `node_modules/next/dist/docs/` first. |
| `src/lib/graph/content.test.ts` (new) | Unit coverage for every build-failure condition (§9.1) and the defaulting behaviour, isolated from the filesystem walk itself where practical, mirroring how `tree.test.ts` covers `flatten()`. |
| `src/app/graph/_components/node-hover-card.test.tsx` | Gains cases for the hub's name-only card and for the new link (present, scoped `pointer-events-auto`, `tabIndex={-1}`). |
| `CLAUDE.md` | The "Graph data" section's note that `status`/`assignee` "have now arrived" in the seed is corrected: they've since left it again, for `content/`'s frontmatter, with a pointer to this spec — the same way every other graph-data decision documents itself there. A new bullet records the `content/` matching and validation rules, the same way the seed's own invariants are recorded today. |

**New dependencies.** None of today's dependencies parse frontmatter, render markdown, or
highlight code, so this spec adds four: `gray-matter` (frontmatter), `react-markdown` and
`remark-gfm` (rendering — see §9.4 for why this pairing, not a raw-HTML-capable one), and a
syntax-highlighting rehype plugin (e.g. `rehype-highlight`) whose output is plain CSS
classes, not inline styles (§10). All four run only inside the build-time Server Component
path this spec adds; none is imported from anywhere the 3D scene's client bundle could pick
it up, and the existing `dynamic(..., { ssr: false })` boundary around `three` (`graph-view.tsx`)
is untouched.

### 8. Non-functional requirements

- **Stays fully static.** Every page this spec adds is resolved at build time —
  `generateStaticParams` plus `dynamicParams = false` means an address outside the known
  node list never reaches a running page component at all, matching the graph route's own
  existing "no fetch, no dynamic API" posture (`graph/page.tsx`'s comment on `buildScene`).
  No new environment variable and nothing new touches `process.env`; `src/lib/env.ts`
  remains the only file that does (`CLAUDE.md`).
- **No new client-side JavaScript for a content page.** `markdown-body.tsx` and the
  route itself are Server Components; nothing here is `'use client'`. The 3D graph route
  remains the only place this app ships a client-heavy bundle.
- **WCAG 2.2 AA on content-page chrome is a requirement, not an aspiration** (§3, Q4) —
  unlike the 3D graph's own tracked accessibility debt, there is no structural reason an
  ordinary server-rendered page can't clear the same bar the rest of the site's chrome
  already does: heading structure, link text, colour contrast on tags/labels, and a
  focus-visible ring on every real link (design-system skill's accessibility baseline).
- **Build-time cost is bounded and cheap.** `flatten(seed)` re-runs once per generated page
  (as it already does once for `/graph` itself) — pure, `O(nodes)`, well under the app's own
  150-node ceiling. `loadNodeContent()` walks a small, repo-local directory once per page
  generated; if that walk becomes measurable as the tree grows, memoising it for the
  duration of one `next build` is a reasonable follow-up, not a requirement of this spec —
  unlike `makeQueryClient()`'s per-request rule, this is a build-time-only concern, not a
  runtime data-isolation one (`CLAUDE.md`, "Per-request QueryClient").
- **No change to the render-on-demand model.** The one change inside the imperative 3D
  scene effect — skipping the intro sweep and calling `focusNode()` immediately when a
  valid `focusId` arrives — reuses the exact `focusNode`/`flyTo` path a click already
  takes; it introduces no new timer and no new source of `invalidate()` beyond what already
  exists.
- **`lib/graph/` stays framework-agnostic.** `content.ts` reads the filesystem the same way
  the pre-existing `lib/content/read.ts` seam already does (`node:fs`, no import from `app/`
  or `components/`), so this addition doesn't cross the boundary `CLAUDE.md` draws for that
  directory. It does not import `three`, `app/`, or `components/`.

### 9. Design

#### 9.1 The `content/` tree: matching, defaulting, and what fails the build

Every node id — the same slugged name path `flatten()` already computes — is the key a
content file is matched against. A file is matched two ways: `<id>/index.md` for a node
with children, or `<id>.md` for a childless one; a childless node may use either form, never
both. The walk over `content/` derives a candidate id from each file's own path — stripping
a trailing `/index` for the folder form, stripping `.md` for the leaf form — never from
anything a request or a build argument supplies, the same allow-list-from-disk discipline
the existing `lib/content/read.ts` seam already established for a different pair of
directories (`docs/`, `intent/`). This spec doesn't extend that module, because its matching
rules genuinely differ — index-file flattening, the one-file-per-node rule, and cross-
checking against the *tree's* ids rather than treating every `.md` file as its own slug —
and folding two different jobs into one seam would blur both. The pattern is reused; the
module is not.

Every one of the intent's five build-failure conditions is checked here, and every failure
names the offending file, the same way an invalid seed names the offending node:

1. A file's derived id matches no node in the flattened tree.
2. Two files derive the same node id (`<id>/index.md` and `<id>.md` both present).
3. Frontmatter carries a key outside `title` / `tags` / `status` / `assignee` — the
   `.strict()` schema fails the same way the seed's own schema already does for an
   unrecognised key, and for the same reason: a silently-ignored typo looks identical to
   missing content.
4. `status` is anything other than `Todo` / `In Progress` / `Done`.
5. A file exists at `content/index.md` — the hub's content, which the intent explicitly
   disallows.

`tags` is validated more loosely than the other three fields: each tag is trimmed and
non-empty under the same rule `name`/`assignee` already use, then lower-cased and
de-duplicated. Two tags that differ only by case are not a build failure — they're the same
tag, silently — because tags are inert, cosmetic labels (§2.1) and the intent reserves a
failed build for the five conditions above, not for this. Every node with no matching file,
and every matched file that leaves a field out, resolves to the same defaults `flatten()`
used to apply directly: `assignee: "Unassigned"`, `status: "Todo"`, `title:` the node's own
name, `tags: []`, `body: ""`. A file that exists purely to carry `assignee` or `status`
with no body reads identically to a missing file wherever the body would show (§4, D-4) —
the "no content yet" note is keyed on an empty body, not on whether a file happens to exist.

#### 9.2 Where owner and status live now

`flatten()` no longer resolves a default for `assignee`/`status` — that responsibility
moves to the new content module entirely, so `GraphNode` itself no longer carries either
field (§7). `buildScene()` merges the content module's per-node `assignee`/`status` onto
each scene node at the same point it already applies position and colour, which keeps
`GraphSceneNode`'s own shape — and therefore the hover card and the 3D scene's pointer
handling — essentially unchanged by this spec. The content-page route (§9.3) reads the same
`NodeContent` map directly, since a page needs the rest of it too (`title`, `tags`, `body`).

#### 9.3 Routing: addresses, static generation, and "not found"

A non-optional catch-all segment under `/graph/` (`[...slug]`) only ever matches
`/graph/<something>` — never bare `/graph`, which stays the existing 3D-view route with no
conflict. `generateStaticParams` lists every node id except the hub's, split on `/` into
the segments the catch-all expects; `dynamicParams = false` means an address outside that
list is rejected before the page component runs at all, rather than rendered on request —
keeping this feature exactly as static as the graph route it sits beside. A rejected
address, or a page component that calls `notFound()` for any other reason, surfaces the
new segment-level `not-found.tsx` (§4, D-2; §7) rather than the sitewide one.

A breadcrumb is built by walking a node's `parentId` chain back to the hub, in order, each
crumb linking to that ancestor's own page (the hub's crumb linking to `/graph`). A "Key
Topics" entry is exactly a child's own name and its own address, taken directly from the
tree in the order the seed already lists its children — the same order the branch key and
the layout already read children in, so nothing about this feature introduces a second,
independent ordering rule.

#### 9.4 Rendering markdown without rendering HTML

`react-markdown` renders directly to React elements rather than to an HTML string, and —
unlike a `remark`/`rehype`-to-HTML-string pipeline — never turns a raw `<script>` or any
other literal tag in the source into markup unless a plugin (`rehype-raw`) is explicitly
added to make it do so. This spec deliberately does not add that plugin: FR-10's "raw HTML
is not rendered" is the default behaviour of the library actually chosen, not a rule this
spec has to separately enforce, and no page in this feature ever calls
`dangerouslySetInnerHTML` (§10). `remark-gfm` adds the GitHub-flavoured pieces the intent
asks for — tables, strikethrough, checklists, autolinks — on top of that.

Fenced code blocks are highlighted by a rehype plugin that annotates tokens with CSS
classes (e.g. `rehype-highlight`), not one that emits inline colours. Rather than shipping a
ready-made syntax theme — the first set of colours in this app that would never have passed
through the brand mapping every other surface already has (design-system skill; §4, D-6) —
a small stylesheet maps the handful of token classes actually produced (keyword, string,
comment, number, function/tag name) onto the existing role tokens already declared in
`globals.css` (`--text-primary`, `--text-muted`, `--focus-ring`, `--accent-secondary`,
one of the `--status-*` tokens), in both themes. A code block's own background and border
follow the same small-radius, hairline-border, `--surface-1` treatment every other card-like
surface in the app already uses.

An image is referenced from a topic's markdown by a path built from that topic's own
address rather than a path relative to the markdown file itself (§4, D-3) — a deliberate,
flagged narrowing of the intent's "next to the page" wording, chosen to avoid adding either
a new build-time copy step or a new server route to an app that currently has neither. A
link from one topic's page to another is written as an ordinary site-relative path (e.g.
`/graph/n-node/rag`) and rendered as-is — not checked against the tree at build time (§4,
D-5; §6).

#### 9.5 The hover card's first real interactive element

Until now, the card layer has been entirely `pointer-events: none` and `aria-hidden`, with
"Open page" as static, inert text (`node-hover-card` spec §9.4) — there was nothing on it
that could be clicked, so nothing about its posture toward assistive technology mattered
beyond what the label layer already established. That changes here: "Open page" becomes a
real `<Link>`. It is given its own `pointer-events-auto`, so it — and only it — responds to
a click, while the rest of the card keeps the `pointer-events-none` that lets an orbit-drag
pass straight through it (FR-4). It is also given `tabIndex={-1}`, deliberately: a focusable
element inside an `aria-hidden` ancestor is a well-known way to end up with a link a
keyboard user can `Tab` onto without a screen reader ever announcing it or the browser ever
showing why — a worse, and stranger, outcome than the link simply not being reachable by
keyboard at all, which is the accessibility posture the graph already has and which this
spec does not change (Areas of concern, C-2). The hub's card, which has no `href` (§8, the
`NodeCardContent` change), renders none of the Assignee, Status, or Open-page rows at all —
not a card with those rows disabled, a card that never had them (FR-8).

#### 9.6 "View Graph": arriving already focused

A request parameter on the graph route names a node to focus on arrival. If it names a
real node, the scene skips its own ambient intro sweep (`INTRO_MS`/`INTRO_SWEEP` in
`graph-scene.tsx`) and calls the same `focusNode()` a click already triggers, immediately,
from the camera's normal starting position — one continuous fly-in to the named node, rather
than the sweep followed by a second move. If it names nothing real, or is absent, behaviour
is entirely unchanged: the ordinary intro sweep into the overview plays, exactly as it does
today. Because the link is an ordinary URL naming a node id, and reopening it reproduces the
same behaviour, it satisfies "shareable" (§3, Q1) without adding a new mechanism beyond
what "View Graph" itself needs.

#### 9.7 What does not change

Layout, colour, and radius (`layout.ts`, `colour.ts`, `palette.ts`) are untouched — content
still doesn't feed the picture the graph draws, only data that rides alongside a node's
existing identity, the same boundary the `node-hover-card` spec already drew and this one
holds. Clicking a node inside the 3D view still only moves the camera (FR-14); the existing
hover/long-press-to-open-card behaviour, and the card's following-the-node positioning
(`node-hover-card` spec §9.3), are unchanged except for the hub special-case and the new
link (§9.5).

### 10. Security

This adds the app's first markdown-rendering pipeline and its first dynamic route tree, but
changes nothing about where content comes from or who can put it there — every file this
feature reads is committed, pull-request-reviewed data, the identical trust level `seed.ts`
already has.

- **No `dangerouslySetInnerHTML` is added.** `react-markdown` renders to React elements
  directly; nothing in this feature produces or injects an HTML string. The one pre-existing
  use of `dangerouslySetInnerHTML` in the app (the theme-flash script in `layout.tsx`) is
  unrelated and untouched.
- **Raw HTML in a content file is inert by construction, not by a rule this spec has to
  enforce separately.** `react-markdown` only interprets raw HTML in its source if the
  `rehype-raw` plugin is added; this spec deliberately does not add it (§9.4), so FR-10's
  "raw HTML is not rendered" is the chosen library's default behaviour.
- **No new environment variable, and nothing new reads `process.env`.** `src/lib/env.ts`
  remains the only file that does.
- **No new server surface.** No server action and no API/data route are added — every page
  is resolved at build time via `generateStaticParams` and `dynamicParams = false` (§8, §9.3),
  the same static posture the graph route already has. There was an alternative design
  considered and rejected here — a small route handler serving images directly from
  `content/` — specifically to avoid introducing this app's first runtime file-serving
  surface; §9.4's image-path decision is a direct consequence of that rejection.
- **Path safety in the new content walker.** `content.ts`'s node-id matching follows the
  same discipline already established and exercised by `lib/content/read.ts` — a slug is
  only ever built from what's actually present on disk, never accepted from a request or
  any other external input, so there is no traversal surface here despite this being the
  first feature to introduce a real, visitor-facing file-to-URL mapping (§9.1).
- **No CSP impact.** No new script, font, or style source is added. The chosen
  syntax-highlighting approach emits CSS classes, not inline `style` attributes, so it adds
  no new pressure on the (currently Report-Only) `style-src` directive beyond what Next's
  and Tailwind's own inline styles already do.
- **A deliberate, on-the-record extension of an exposure already accepted for two fields,
  now covering full written content.** The `node-hover-card` spec's Areas of concern (C-1)
  already puts on the record that every visitor's browser receives every node's assignee
  and status, published at build time with no per-viewer gating. This feature is the same
  exposure, extended to whatever prose a topic's content file actually contains, the moment
  a pull request merges — carried forward here rather than treated as a new, separate
  finding, and carried to **Areas of concern, C-1** for the product decision it actually is.
- **New dependencies are build/render-path-only.** `gray-matter`, `react-markdown`,
  `remark-gfm`, and the syntax-highlighting rehype plugin (§7) run inside Server Components
  only; none performs network I/O, none reads `process.env`, and none is reachable from the
  3D graph's client bundle.

### 11. Verification

| # | Check | How | Pass |
| --- | --- | --- | --- |
| V-1 | Clicking "Open page" on a non-hub node's card opens that node's page in the same tab | Manual | pass |
| V-2 | The browser Back button, from a node's page, returns to the same graph view shown before the click | Manual | pass |
| V-3 | "Open page" opens the same page after a desktop hover and after a tablet long-press | Manual, on a real or emulated touchscreen | pass |
| V-4 | Starting an orbit-drag on top of an open card still turns the graph | Manual | pass |
| V-5 | Every non-hub node in the seed resolves to a generated page at its slugged path | `generateStaticParams` output checked against `flatten(seed)`'s node list, in a build or a test | pass |
| V-6 | A node with no content file still renders title, owner, status, and Key Topics, with a "no content yet" note | Manual, on a node deliberately left without a file | pass |
| V-7 | A content file with frontmatter but no body reads identically to a missing file | Manual/unit, comparing the two cases | pass |
| V-8 | Each Key Topics entry is a child's own name, in the seed's own child order, linking to that child's page | Unit test against a small synthetic tree | pass |
| V-9 | The hub's card shows only its name; the hub has no generated page | Manual + `generateStaticParams` exclusion check | pass |
| V-10 | A typo'd or stale address shows the graph-scoped "not found" view with a working link back to `/graph` | Manual | pass |
| V-11 | GFM tables/strikethrough/checklists/autolinks, highlighted code, and images all render from a sample content file; a literal `<script>` in the same file renders as visible text, not as markup | Unit test on the rendered output of a fixture file | pass |
| V-12 | A node's assignee/status come from its content file where one exists, and default to Unassigned/Todo otherwise, including a file that authors only one of the two | Unit tests in `content.test.ts` | pass |
| V-13 | Each of the five build-failure conditions (§9.1) fails the build naming the offending file | Unit tests in `content.test.ts`, one per condition | pass |
| V-14 | "View Graph" from a node's page flies the camera to and centres it on that node, without playing the ambient intro sweep first | Manual | pass |
| V-15 | Reopening a copied "View Graph" address reproduces the same focused view; an address naming a node that no longer exists falls back to the ordinary overview | Manual | pass |
| V-16 | Clicking a node inside the 3D view still only moves the camera and never navigates | Manual | pass |
| V-17 | No regression to node colour, size, or position (`palette.contract.test.ts`, `layout.test.ts` still pass unchanged) | Re-run existing suites | all still pass |
| V-18 | No regression to the render-on-demand model: the scene still renders zero frames while idle after the focus-on-arrival change | Manual, dev-tools frame count | pass |
| V-19 | No regression on existing suites | Re-run `tree.test.ts`, `graph-labels.test.ts`, `graph-view.test.tsx`, `node-hover-card.test.tsx` | all still pass |

---

## Areas of concern

**C-1 — Written content is now public the moment a pull request merges, with no notion of
draft or unpublished, and this compounds an exposure already accepted once before.** The
`node-hover-card` spec's own Areas of concern (C-1) already put on the record that every
node's assignee and status ship to every visitor's browser at build time, whether or not
they ever hover that node. This feature is the same shape of exposure, extended from two
short fields to however much prose a topic's page actually contains — internal notes,
early thinking, anything typed into a content file — live the moment it's merged, not when
someone decides it's ready to be read widely. **Resolved here by carrying the exposure
forward honestly, the same way the earlier spec did, rather than treating it as a new,
separate question** (§10). **The decision needed from you:** confirm that everything written
into a topic's page is fine to publish to every visitor immediately on merge — no staging,
no review-then-hide step — or say what should gate a page going live if not "the pull
request merged."

**C-2 — The graph's first real, working link is reachable only by mouse, trackpad, or
touch — a keyboard or screen-reader user still can't reach a topic's content at all through
the card, and now that includes an actual destination, not just information.** Before this
feature, the graph's known accessibility gap (tracked separately) meant a keyboard or
screen-reader user couldn't learn a topic's name, owner, or status any way but reading the
page's static chrome. After this feature, the same gap also means they can't reach the page
this whole piece of work builds, at all, through the card — the card's one real link is
deliberately excluded from the keyboard tab order (§9.5) so it doesn't become a confusing,
silent trap instead. **Resolved here by not attempting to fix it inside this piece of
work** — that's explicitly separate, already-scoped work, and pulling it in here would blow
well past what this spec asks for. **The decision needed from you:** confirm it's
acceptable to ship this widening now, with that separate accessibility work still queued
and not accelerated, or say whether this specific consequence — a real destination, not
just data, becoming pointer-only — changes that work's priority.

**C-3 — Images for a topic's page live in a location that mirrors its address, not
literally next to its markdown file, narrowing the intent's own wording.** The intent asks
for images "stored in the repo next to the page" (§2.1); this spec places them at a fixed
public path built from the topic's own address instead (§4, D-3; §9.4), specifically to
avoid adding either a new build step or a new server route to an app that currently has
neither. **Resolved here by choosing the option with the least new machinery**, on the
judgement that "the same address, a different folder" is a small enough difference in how
someone actually adds an image. **The decision needed from you:** look at the two options
once you see them written down for a real page, and say whether the difference matters
enough to be worth the extra build machinery the literal reading would need.

**C-4 — A link from one topic's page to another isn't checked against anything, so a
renamed or removed topic can leave a dead link on another page with nothing catching it.**
The intent's build already fails when a content *file* is orphaned by a rename; this spec
doesn't extend that same protection to a *link* written inside a file's own body, because
doing so is real, unscoped work — parsing every page's content for internal links and
re-checking each one against the tree, on every build (§4, D-5). **Resolved here by
accepting the gap for now**, the same kind of trade the intent already makes for renamed
topics, just for one more kind of reference it didn't anticipate. **The decision needed
from you:** confirm this gap is acceptable to ship with, or ask engineering to scope a
build-time link check as explicit follow-up work.

**C-5 — Content pages show their own "not found" wording, distinct from the rest of the
site's.** This spec adds a `/graph`-scoped "not found" view that says "back to the graph"
rather than reusing the sitewide page's "back to home" (§4, D-2), matching the intent's own
wording for this specific feature. **Resolved here by adding the small extra wording**
rather than reusing what already exists. **No urgent decision needed from you** — this is
flagged so the two different "not found" messages elsewhere in the app aren't mistaken for
an inconsistency the next time someone notices them side by side.
