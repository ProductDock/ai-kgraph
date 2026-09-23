# Plan: give every node its own content page, written in markdown

- **Intent:** [`intent.md`](./intent.md) · **Spec:** [`spec.md`](./spec.md) (merged, 02decd2)
- **Plan task:** #53
- **Stage:** 3 — plan

"Open page" on the hover card has never led anywhere. This plan builds the page it points
at. Every non-hub node gets a statically generated page at `/graph/<address>`, rendered
from `content/**.md`. Assignee and status move from `seed.ts` into that frontmatter.
"View Graph" opens `/graph` already focused on the node.

**Decisions taken while planning.** The originator settled each of these on 2026-09-23.
None of them widens the spec.

- **Areas of concern C-1…C-5 are all accepted as written.** Content is public on merge.
  The card link is pointer-only with `tabIndex={-1}`. Images live under
  `public/content/<address>/`. Cross-page links are not checked. The not-found view is
  graph-scoped.
- **Hover gap (FR-1 on desktop).** As built today, the card closes the moment the pointer
  leaves its node. Crossing the gap to the card, or entering the link (which fires the
  canvas's `pointerleave`), therefore closes it before the link can be clicked. Fixed here
  with a short close grace period plus hover-the-link hold-open. The `node-hover-card` plan's
  deviation note #1 predicted this: *"If the 'Open page' row becomes a real link, this
  flips back and the hover-the-card state comes with it."*
- **Back view (FR-2).** Leaving `/graph` unmounts the scene, so today Back replays the intro
  into the overview. Fixed here by saving the camera when "Open page" is clicked and
  restoring it only when `/graph` is re-entered by history traversal (Back/Forward).
  "Back to AI Learning Graph" still opens the overview.

## Files changed

### Dependencies (`package.json`, `package-lock.json`)
`npm install --save-exact gray-matter react-markdown remark-gfm rehype-highlight`, with
exact pins to match every other entry. The spec names these four. All of them are
imported only by `src/lib/graph/content.ts` and `src/components/common/markdown-body.tsx`,
and neither file is reachable from `graph-scene.tsx`.

### `src/lib/graph/` (framework-agnostic; imports nothing from `three`, `app/` or `components/`)

| Path | Change |
| --- | --- |
| `types.ts` | `GraphSeed` loses `assignee?`/`status?`. `GraphNode` loses `assignee`/`status`. New `NodeContent { title; tags: string[]; assignee; status; body; hasFile }`. `GraphSceneNode` becomes `GraphNode & Pick<NodeContent, "assignee" \| "status"> & {…geometry}`, so the card and scene read the same two fields as today. |
| `schema.ts` | `graphSeedSchema` goes back to exactly `name` + `children`, still `.strict()`. `trimmedString`, `MAX_ASSIGNEE_LENGTH` and a new `nodeStatusSchema` (`z.enum(["Todo","In Progress","Done"])`) are **exported** so `content.ts` reuses the seed's own rules and the two cannot drift. Update the doc comment. |
| `tree.ts` | `flatten()` stops writing `assignee`/`status`. Delete that block and its comment. Nothing else changes. |
| `paths.ts` **(new, pure, client-safe)** | `nodeAddress(id)` strips the root segment (`pd-ai/n-node/rag` → `n-node/rag`). `nodeHref(id)` → `/graph/n-node/rag`. `nodeIdFromAddress(rootId, address)` does the inverse and returns `null` for an empty address. `breadcrumb(nodes, id)` → ancestors from the hub down, excluding the node itself. `keyTopics(nodes, id)` → children in seed order. No `node:fs`, because the hover card imports it. |
| `content.ts` **(new, server/build only)** | `resolveNodeContent(nodes, files: {path: string; raw: string}[]): Map<id, NodeContent>` is pure: it matches files, validates them and applies defaults. `loadNodeContent(seed, dir = join(process.cwd(), "content"))` walks `dir` for `*.md` (same walk as `lib/content/read.ts`; a missing dir means no files), calls `flatten(seed)`, then `resolveNodeContent`. Ids are derived **only from on-disk paths** (strip `/index.md` or `.md`, prefix the root id). The frontmatter schema is `z.strictObject({ title?: trimmedString(MAX_NAME_LENGTH), tags?: z.array(trimmedString(…)), status?: nodeStatusSchema, assignee?: trimmedString(MAX_ASSIGNEE_LENGTH) })`. Tags are lower-cased and de-duplicated silently. `body` is `matter(raw).content.trim()`. The five failures from spec §9.1 each throw `Invalid content - content/<path>: <reason>`, naming the file. `content/index.md` is checked **first**, so the hub case reads "the hub has no page", not "matches no node". Defaults: `"Unassigned"`, `"Todo"`, `title = node.name`, `tags = []`, `body = ""`, `hasFile = false`. |
| `scene.ts` | `buildScene(seed, content: ReadonlyMap<string, NodeContent> = new Map())` spreads `assignee`/`status` from `content.get(id)`, or from the defaults, onto each scene node. The default argument keeps the synthetic-seed tests (`graph-labels.test.ts`, `colour.test.ts`, `__framing-probe.test.ts`, `graph-view.test.tsx`) unedited. Layout, colour and radius are untouched. |
| `seed.ts` | Remove `assignee`/`status` from `RAG` and `status` from `Evals`, along with the two comments about them. Rewrite the header comment: the seed holds names and nesting only. Owner and status live in `content/`. |
| `tree.test.ts` | The defaulting cases (≈ lines 70–112) move to `content.test.ts`. The cases for an unknown `assignees`, a bad `status` and a padded `assignee` (≈ 114–135) are replaced by one: **`assignee` and `status` on a seed node are now unknown keys**, and the build fails naming the node. |
| `paths.test.ts` **(new)** | Address and href round-trip. Hub → empty address. Breadcrumb order. `keyTopics` follows seed order on a synthetic tree (**V-8**). |
| `content.test.ts` **(new)** | Uses `resolveNodeContent` with inline fixtures. One test for each of the five failures, each asserting the file path appears in the message (**V-13**). Also: defaults with no file, with a file carrying only `status`, and with one carrying only `assignee` (**V-12**). A frontmatter-only file resolves to the same `body: ""` as no file (**V-7**). Tag lower-casing and de-duplication. `title` changes only `title`. Plus one integration test: `loadNodeContent(seed)` against the **real** `content/` resolves RAG → `Nemanja Vasic`/`Done` and Evals → `Unassigned`/`In Progress`, and every other node gets the defaults. |

### Content (new)

| Path | Content |
| --- | --- |
| `content/n-node/rag/index.md` | `assignee: Nemanja Vasic`, `status: Done`. The body is the intent's worked-example paragraph, verbatim: *"Retrieval-Augmented Generation (RAG) is a pattern that enhances LLM responses by retrieving relevant information from external sources …"*. Nothing is invented beyond it. |
| `content/n-node/evals/index.md` | `status: In Progress` and no body. The page reads "No content yet" (spec D-4). |

Images are not added. The convention is documented in `CLAUDE.md`: `public/content/<address>/<file>`, referenced as `/content/<address>/<file>`. `public/graph/…` is deliberately **not** used, because it would collide with the `/graph/[...slug]` route.

### Rendering

| Path | Change |
| --- | --- |
| `src/components/common/markdown-body.tsx` **(new, Server Component, no `'use client'`)** | `<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={…}>` with **no `rehype-raw`**, so raw HTML stays inert. react-markdown's default `urlTransform` strips `javascript:` URLs, and nothing is overridden there. The `components` map applies Tailwind/token classes per element (the app has no typography plugin). Markdown `h1`–`h5` render as `h2`–`h6`, shifted one level, so the page's own `h1` stays the only one. `a` whose href starts with `/` → `next/link`; otherwise a plain `<a>`. `img` → plain `<img>` with a one-line eslint-disable naming spec §2.3 (no optimisation pipeline). `pre`: `rounded-lg`, hairline `border`, `bg-[var(--surface-1)]`. Tables get a hairline border. Every link gets the shared hover rule (ink + underline) and keeps the global `:focus-visible` ring. |
| `src/components/common/markdown-body.test.tsx` **(new)** | One fixture exercises a GFM table, strikethrough, a task list, an autolink, a fenced `ts` block (asserts `.hljs-keyword` exists), an image, an internal `/graph/…` link, `<script>alert(1)</script>` (asserts no `script` element and the text visible) and `[x](javascript:alert(1))` (asserts the href is not `javascript:`). Plus `# Heading` renders as an `h2`. **V-11.** |
| `src/app/globals.css` | Add a `.hljs-*` → role-token mapping for the classes rehype-highlight actually emits: keyword, string, comment, number, title/function, built_in, attr. Use **existing tokens only**, no new names. Every mapped colour must clear **4.5:1 against `--surface-1` in both themes**. `--accent-secondary` (`#ea592a`) is only ~3.3:1 on light `--surface-1`, so use `--accent-secondary-hover` there or pick another token. It sits under the same light/dark/`data-theme` scopes as everything else. |
| `src/components/common/code-highlight.contract.test.ts` **(new)** | Reads `globals.css` the way `palette.contract.test.ts` does (copy its small `resolve(theme, token)` helper) and asserts `contrast()` from `colour-metrics.ts` ≥ 4.5 for every mapped hljs class against `--surface-1`, in light and dark. This keeps the new code-block colours to the same standard as the rest of the palette: enforced by a test, not by someone remembering. |

### Routes

| Path | Change |
| --- | --- |
| `src/app/graph/[...slug]/page.tsx` **(new, Server Component)** | `export const dynamicParams = true` (planned as `false`; see Deviation 1). `generateStaticParams()` → `flatten(seed).nodes.filter(n => n.parentId !== null).map(n => ({ slug: nodeAddress(n.id).split("/") }))`. `generateMetadata({ params })` → `title: node.name` (spec Q6: the node's name, never frontmatter `title`). `Page({ params }: { params: Promise<{ slug: string[] }> })` awaits params, resolves the id with `nodeIdFromAddress`, and calls `notFound()` if the id is unknown. That guard is defensive only. It renders a `<main id="main-content">` inside a `max-w-3xl` column, containing, in this order: (1) a header row with `← Back to AI Learning Graph` (`/graph`), `View Graph` (`/graph?focus=<address>`) and `<ThemeToggle />`; (2) `<nav aria-label="Breadcrumb"><ol>`, where the hub crumb links to `/graph`, each ancestor links to `nodeHref`, and the current node is plain text with `aria-current="page"`; (3) `<h1>` = `content.title`, heading type per the design-system skill; (4) tags as `rounded-full` hairline pills (`text-xs text-muted-foreground`, omitted when empty); (5) `<dl>` with Assignee and Status; (6) `<MarkdownBody>`, or `<p>No content yet.</p>` when `body === ""`; (7) when the node has children, `<h2>Key Topics</h2>` and a `<ul>` of `<Link href={nodeHref(child.id)}>{child.name}</Link>`. A leaf has no Key Topics section, so there is never an empty heading. `loadNodeContent(seed)` and `flatten(seed)` run per page at build time, which spec §8 accepts as cheap. |
| `src/app/graph/[...slug]/loading.tsx` **(new)** | A content-page skeleton. Without it, the parent `src/app/graph/loading.tsx` wraps these pages too and would flash the *graph* skeleton ("Loading the AI knowledge graph") during navigation. |
| `src/app/graph/[...slug]/page.test.tsx` **(new)** | `generateStaticParams()` equals every non-hub `nodeAddress` from `flatten(seed)` and excludes the hub (**V-5, V-9**). Render `await Page({ params: Promise.resolve({ slug: ["n-node","rag"] }) })`: title, `Nemanja Vasic`, `Done`, the body sentence, Key Topics = [`Vector db`] linking to `/graph/n-node/rag/vector-db`, breadcrumb `PD AI › n Node`, and `View Graph` href `/graph?focus=n-node/rag`. Render Evals (a file with no body) and Techniques (no file): both show "No content yet" and both have Key Topics (**V-6, V-7**). Render a leaf: no Key Topics heading. |
| `src/app/graph/not-found.tsx` **(new)** | Copy of `src/app/not-found.tsx` with "Back to the graph" → `/graph` (spec D-2, C-5). The root `not-found.tsx` is unchanged. |
| `src/app/graph/page.tsx` | `buildScene(seed, loadNodeContent(seed))`. **Nothing else changes, and it does not read `searchParams`.** |
| `src/app/graph/_components/graph-view.tsx` | **Unchanged.** |

**Deviation from spec §7, stated deliberately.** The spec has `graph/page.tsx` read the
`focus` param and thread `focusId` through `GraphView`. In this Next version, reading
`searchParams` in a Server Component opts the page into dynamic rendering
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md:119`).
That would break the route's "prerenders, no dynamic API" posture (`graph/page.tsx`
comment, spec §8 "Stays fully static"). The spec itself asked for this to be checked
(§7, `page.tsx` row). So the scene reads `new URLSearchParams(window.location.search)`
inside its mount effect instead. The component is `ssr: false`, so that code only ever
runs in the browser, and `page.tsx` and `graph-view.tsx` need no prop. `useSearchParams`
was rejected because on a prerendered page it needs a Suspense boundary for no benefit.

### The card and the scene

| Path | Change |
| --- | --- |
| `src/app/graph/_components/node-hover-card.tsx` | `NodeCardContent` gains `href: string \| null`. `show()`'s equality check includes `href`. When `href === null` (the hub), the card renders the **name row only**, with no Assignee, Status or Open-page row (FR-8). Otherwise "Open page" becomes a `<Link href={href} tabIndex={-1} className="pointer-events-auto …">`, styled as a real link. The layer and the `Card` stay `pointer-events-none` and `aria-hidden` (spec §9.5). New props: `onLinkPointerEnter`, `onLinkPointerLeave` and `onLinkClick`, all optional. The first two are ignored when `event.pointerType === "touch"`. Rewrite the component comment: the "nothing on it is interactive" paragraph no longer holds. |
| `src/app/graph/_components/node-hover-card.test.tsx` | "never accepts pointer events" becomes: **the card is `pointer-events-none` and the only `pointer-events-auto` element inside it is the Open-page link**. New cases: the hub card (`href: null`) has one row and no link. The link has the right `href` and `tabIndex=-1`. The link callbacks fire, except for touch. The "four rows" case is updated to include a real link. |
| `src/stores/graph-view-store.ts` **(new)** | A Zustand store for client UI state (CLAUDE.md state table): `{ snapshot: { position: Vec3; target: Vec3; focusedId: string \| null } \| null; arrivedByHistory: boolean; save(s); take(): snapshot \| null }`. `take()` returns the snapshot **only if `arrivedByHistory`**, then clears both. At module scope, guarded by `typeof window !== "undefined"`, one `popstate` listener sets `arrivedByHistory = location.pathname === "/graph"`. It is registered once per page load. The module only ever evaluates in the browser, because it is imported from the `ssr: false` scene. The listener is deliberately never removed: it lives as long as the page, not the component. Say so in a comment. |
| `src/app/graph/_components/graph-scene.tsx` | See **Scene changes** below. |

### Scene changes (`graph-scene.tsx`)

1. **Card content.** `openCard(index)` passes
   `href: node.parentId === null ? null : nodeHref(node.id)` (from `@/lib/graph/paths`).
2. **Close grace period.** Add `const CARD_CLOSE_GRACE_MS = 200` beside `LONG_PRESS_MS`,
   plus `let cardCloseTimer`, `scheduleCloseCard()` (a no-op if a close is already
   pending) and `cancelScheduledClose()`. In `onPointerMove` (non-touch): over a node while
   idle → `cancelScheduledClose()`, then open or swap as today. Node-to-node therefore stays
   instant (FR-6's second half). Otherwise: if `pressedAt !== null` (a drag),
   `closeCard()` **immediately**, which keeps FR-11. If not dragging,
   `scheduleCloseCard()`. `onPointerLeave` → `scheduleCloseCard()` instead of `closeCard()`,
   because entering the link fires it. `onPointerDown` (non-touch) still closes
   immediately. `closeCard()` also calls `cancelScheduledClose()`. The **teardown clears
   `cardCloseTimer`** in the same edit (CLAUDE.md pitfall), next to `longPressTimer`.
3. **Link hold-open.** The effect publishes `{ hold: cancelScheduledClose, release: scheduleCloseCard, navigate: saveView }`
   into a `cardLinkRef`, the same pattern as `invalidateRef`/`applyTokensRef`, and nulls it
   in teardown. `<NodeHoverCard>` receives stable wrappers that call through the ref.
4. **Save on click.** `saveView()` →
   `useGraphViewStore.getState().save({ position, target, focusedId: focusedIdRef.current })`,
   copied from `camera.position`/`controls.target` into plain tuples. It runs from the
   link's `onClick`, before Next navigates.
5. **Arrival: one of three openings, in this order**, inside the existing mount block
   (≈ lines 1868–1894):
   - **Restore.** If `useGraphViewStore.getState().take()` returns a snapshot, set
     `controls.target` and `camera.position` from it, call `controls.update()`, and skip
     the intro. If `focusedId` resolves, apply focus *state* without flying. To do that,
     split `focusNode()` into `markFocused(index)` (the scale target, `setFocusedId`,
     `focusedIdRef`, `startEmphasis`) and `focusNode(index)` = `markFocused` + framing +
     `flyTo`. The click path is behaviourally identical.
   - **Focus param.** Else, if `?focus=<address>` resolves through `nodeIdFromAddress` +
     `indexById`, place the camera at the normal opening framing, **do not start the
     intro**, and call `focusNode(index)`. That is one continuous fly-in on the existing
     `flyTo` path, with no new timer and no new `invalidate()` source. An unknown or empty
     value falls through, silently (spec D-1).
   - **Default.** Otherwise the opening is exactly as today, intro sweep included.

   Restore outranks the focus param. If you went View Graph → orbit → Open page → Back,
   the URL still says `?focus=`, but the snapshot is the view you actually left.

Deliberately untouched: `layout.ts`, `colour.ts`, `palette.ts`, `graph-labels.tsx`,
`branch-key.tsx`, `palette.contract.test.ts`, `layout.test.ts`. Their suites must pass
**unmodified** (V-17).

### `CLAUDE.md`
- **Graph data.** Rewrite the bullet saying `status`/`assignee` "have now arrived" in the
  seed. They have left again: the seed is `name`/`children` only, and owner/status are
  content frontmatter defaulted in `content.ts`, not `flatten()`. Add a bullet covering
  `content/` matching (`<address>/index.md` or `<address>.md`, never both), the five
  build failures, the four frontmatter keys (only `status`/`assignee` reach the graph), the
  image convention `public/content/<address>/`, and cross-links being unchecked (C-4).
- **The card layer.** Rewrite "entirely `pointer-events: none` — nothing on it is
  interactive". Only the Open-page link takes pointer events, and it has `tabIndex={-1}`
  inside `aria-hidden`. Record the 200 ms close grace period and why it exists. The hub
  card is name-only.
- **New bullet: arriving at `/graph`.** `?focus=` is read client-side, deliberately, to
  keep the route prerendered. The Back/Forward restore goes through `graph-view-store`,
  and the precedence is restore > focus > intro. The `popstate` listener is module-scoped
  on purpose.
- **State table.** No change. The snapshot is client UI state in Zustand, which is
  exactly its row.

## Sequence of work

Each step ends green on its own check before the next one starts.

1. **Deps.** Install the four packages with exact pins. Check: `npm run typecheck` still
   passes and `git diff package.json` shows only the four exact versions.
2. **Data layer.** Change `types.ts`, `schema.ts` and `tree.ts`. Add `paths.ts` and
   `content.ts`. Change `scene.ts`. Move the two facts from `seed.ts` into the two
   `content/` files. Update `tree.test.ts`, and add `paths.test.ts` and `content.test.ts`.
   Update `page.tsx` to pass `loadNodeContent(seed)`. Check: `npm test` and
   `npm run typecheck`. The existing card still shows `RAG → Nemanja Vasic / Done` in dev,
   because the facts moved without changing value.
3. **Markdown.** Add `markdown-body.tsx`, the `.hljs-*` mapping in `globals.css`, and both
   tests. Check: `npx vitest run src/components/common`.
4. **Routes.** Add `[...slug]/page.tsx`, `loading.tsx`, `page.test.tsx` and
   `graph/not-found.tsx`. Check: `npm test`, then `npm run build`. The route table must show
   `/graph` as static and `/graph/[...slug]` as SSG listing the node pages. Then run the
   not-found curl in Proof step 3. **This is the riskiest step; see Risks R-1.**
5. **Card.** Make the `node-hover-card.tsx` changes and update its test. Check:
   `npx vitest run src/app/graph`.
6. **Scene.** Add `graph-view-store.ts`, then make the `graph-scene.tsx` changes 1–5.
   Check: `npm run typecheck`, then the manual pass in Proof step 5.
7. **Docs.** Update `CLAUDE.md`.
8. **Full proof.** Run every item in the Proof section, top to bottom.

## Risks

| # | Risk | What depends on it / what happens if wrong | Mitigation / rollback |
| --- | --- | --- | --- |
| R-1 | **Which "not found" renders for an unmatched `/graph/<x>` under `dynamicParams = false`.** The docs say unmatched params "will 404". They do not say whether the segment's `not-found.tsx` renders or the root one does. | FR-9 / V-10 wording ("back to the graph"). | Proof step 3 checks the real response body. If it turns out to be the root page, switch to `dynamicParams = true` plus the page's existing `notFound()` guard. Known pages stay prerendered, and only unknown addresses render on request. Record that as a deviation in this file. **Do not** use `global-not-found` (experimental). |
| R-2 | **Removing `assignee`/`status` from the seed schema is a breaking change** for any in-flight PR that edits them in `seed.ts`. | Such a PR fails the build with "unrecognized key", naming the node. That is the intended signal. | The `CLAUDE.md` bullet says where they went. Rollback is reverting the PR: seed fields, schema and content files return together. There is no persisted data and no migration. |
| R-3 | **FR-6 relaxes:** after leaving a node on desktop, the card lingers up to 200 ms instead of closing instantly. | Anyone who reads `node-hover-card` FR-6 literally. Node-to-node swap and drag suppression (FR-11) are unchanged. | This was a stated decision (see top). If 200 ms feels sluggish or too short, tune `CARD_CLOSE_GRACE_MS`. It is a tuning value, not an invariant. |
| R-4 | **The link's own hit area blocks an orbit drag started exactly on it.** | FR-4. This is the one exception the intent itself makes ("only the Open page link takes pointer events"). | The rest of the card stays see-through, and the test holds that. Accepted by the intent. |
| R-5 | **Back/Forward restore edge cases.** The snapshot lives in memory only: a full reload, or a Back that the browser serves from bfcache as a hard load, gets the overview. The `popstate` flag is set whenever history lands on `/graph`, so Forward onto `/graph` also restores a pending snapshot. That is the intended "same view". | FR-2. | `take()` clears the snapshot on every mount, so it can never restore twice or leak into a later link navigation. If it misbehaves, removing the restore branch falls back to today's behaviour without touching anything else. |
| R-6 | **The scene's mount block is the render-on-demand model's hot spot.** A new opening path that schedules frames itself would create an idle 60 fps loop. | CLAUDE.md pitfall. V-18. | Restore and focus only call the existing `flyTo`/`invalidate()`. V-18 is re-checked by counting frames in Proof step 5. |
| R-7 | **gray-matter's YAML coercion.** `assignee: Yes` parses as a boolean and `title: 2024` as a number. | These are authoring mistakes. | The strict zod schema rejects the non-string and names the file. That is the correct outcome, and a content test covers it. |
| R-8 | **A new markdown pipeline is this app's first HTML-shaped rendering surface** (spec §6, §10). | XSS if raw HTML or `javascript:` URLs rendered. | No `rehype-raw`, no `dangerouslySetInnerHTML`, and the default `urlTransform` is kept. `markdown-body.test.tsx` asserts both. Proof step 4 greps for `dangerouslySetInnerHTML`. |
| R-9 | **`src/app/graph/error.tsx` also wraps content pages** and says "The graph could not be drawn". | Only reached by a runtime client error on a static, JS-free page, which is practically unreachable. Build-time errors fail the build instead. | Accepted and not changed. Flag in the PR body as a known wording mismatch. |
| R-10 | **Renaming the root, or any ancestor, moves every page address and every `?focus=` link**, as well as ids. | Shared links go stale. | The intent accepts this: no redirects. A stale `?focus=` falls back to the overview (D-1), and a stale page address 404s (FR-9). |

**Rollback overall:** revert the single implementation PR. Nothing is stored server-side,
there is no migration, and the only client state is an in-memory store.

**Open questions from the intent, all closed:** Q1 (shareable focus link: yes, `?focus=`),
Q2 (only two content files), Q3 (names only), Q4 (WCAG AA on content pages; see the
contrast test and Proof step 5), Q5 (C-1, accepted), Q6 (tab title = node name). None
are left open.

## Proof

Run from the repo root, in order. Every command must pass. The manual items are part of
the proof and must not be skipped silently.

1. **Static checks**
   ```bash
   npm run typecheck && npm run lint && npm test
   rg -n 'process\.env\.' src --glob '!src/lib/env.ts'              # must print nothing
   rg -n 'dangerouslySetInnerHTML' src                              # only src/app/layout.tsx
   rg -n "use client" 'src/app/graph/[...slug]' src/components/common/markdown-body.tsx   # must print nothing
   rg -n "from ['\"]@/lib/graph/content['\"]|gray-matter|react-markdown" src/app/graph/_components src/stores   # must print nothing
   ```
   `npm test` covers V-5, V-6, V-7, V-8, V-9, V-11, V-12, V-13, the code-contrast contract,
   and V-17/V-19. `palette.contract.test.ts` and `layout.test.ts` must pass **unmodified**,
   which `git diff --stat` confirms.
2. **Build wiring**
   ```bash
   npm run build     # route table: "/graph" static (○), "/graph/[...slug]" SSG (●) with the node pages
   printf -- '---\nstatus: Done\n---\n' > content/does-not-exist.md && npm run build; echo "exit=$?"; rm content/does-not-exist.md
   ```
   The second build must fail with a message containing `content/does-not-exist.md`. That
   proves the checks run in `next build`, not only in unit tests.
3. **Served output** (`npm run start` in a second shell)
   ```bash
   curl -s  localhost:3000/graph/n-node/rag | grep -c 'Nemanja Vasic'      # ≥1
   curl -s  localhost:3000/graph/n-node/evals | grep -c 'No content yet'   # ≥1
   curl -so /dev/null -w '%{http_code}\n' localhost:3000/graph/nope        # 200 - not 404; see Deviation 1
   curl -s  localhost:3000/graph/nope | grep -c 'Back to the graph'        # ≥1  (R-1)
   curl -s  localhost:3000/graph/nope | grep -c 'content="noindex"'        # ≥1
   curl -so /dev/null -w '%{http_code}\n' 'localhost:3000/graph?focus=n-node/rag'   # 200
   ```
4. **Security spot-check.** Proof step 1's greps cover it, together with
   `markdown-body.test.tsx`'s `<script>` and `javascript:` cases.
5. **Manual, in `npm run dev`, desktop plus Chrome DevTools touch emulation.** Tick each one:
   - V-1: hover RAG, move onto "Open page", click. You land on `/graph/n-node/rag` in the same tab.
   - V-2: orbit and focus something, then open a page and press Back. You get the same camera and focus, with **no** intro sweep.
   - "Back to AI Learning Graph" from a page gives the overview plus the intro (not the restored view).
   - V-3: long-press RAG in touch emulation, tap "Open page". You land on the same page.
   - V-4: start a drag on the card's name or Assignee row. The scene orbits.
   - Hub card: name only.
   - V-10: `/graph/nope` shows "Page not found" with "Back to the graph".
   - V-14: "View Graph" on the RAG page flies straight to RAG with no sweep first.
   - V-15: paste `/graph?focus=n-node/rag` into a new tab, and it is the same. `/graph?focus=gone` gives the plain overview.
   - V-16: clicking a node only moves the camera.
   - V-18: DevTools › Rendering › frame rendering stats (or a Performance recording) on an idle `/graph` after each opening path. Zero frames while idle.
   - FR-6: node-to-node hover swaps instantly, and leaving to empty space closes within about 200 ms.
   - WCAG: Tab through a content page. Every link shows the focus ring. Headings are in order `h1 → h2`. Check both themes.
6. **Record** anything from Proof step 5 that could not be run (e.g. no real tablet) in the PR body.

## Deviations found while building

Each of these was measured, not assumed. The code comments point back here.

1. **R-1 materialised, and it brought a second finding.** Under `dynamicParams = false`,
   an unmatched `/graph/nope` does 404, but the router rejects it before the segment is
   reached, so the **sitewide** "Back to home" page renders. Following R-1's mitigation,
   `[...slug]/page.tsx` now sets `dynamicParams = true`, and its `notFound()` guard is the
   mechanism: `graph/not-found.tsx` renders with "Back to the graph". All 35 known pages
   are still SSG (●). The second finding: the response is **HTTP 200 with
   `<meta name="robots" content="noindex">`**, not 404. The root `src/app/loading.tsx`
   wraps every route in Suspense, so the body has already started streaming when
   `notFound()` throws, and Next can no longer change the status. This was measured by
   moving every `loading.tsx` aside: the same request is then a 404 with the graph-scoped
   page. Removing the root loading boundary is out of scope. The remaining alternative, a
   `proxy.ts` check, would add the first runtime server surface, which spec §10 rules out.
   **Decided 2026-09-23: the originator accepted the soft 404.** An unknown address gets
   the right page, marked `noindex`, with status 200.
2. **Code colours: the plan's `--accent-secondary-hover` fails.** It measures **4.46:1**
   on light `--surface-1`. No brand accent clears 4.5:1 in both themes (`--focus-ring` is
   4.20 / 3.68). The only tokens that do are the three text inks and `--graph-hub` (the
   brand blue already stepped darker and lighter for contrast), so the scheme is ink and
   blue, with weight and italics doing the rest. Every token used is theme-aware already,
   so no per-scope `.hljs` block was needed. `code-highlight.contract.test.ts` holds it.
3. **Code blocks are `rounded-xl`, not `rounded-lg`.** In this app `--radius-lg` is
   `9999px` (the pill) and `rounded-xl` is the 10px card radius (`globals.css`,
   design-system skill).
4. **Links are ink with a brand-blue underline, not the blue `text-primary`.** Blue
   `#027ac2` is **4.26:1** on the dark page, under AA for text. The underline also
   satisfies WCAG 1.4.1. The class is `PROSE_LINK` in a new, import-free
   `components/common/link-styles.ts`, so the hover card can share it without pulling
   `react-markdown` into the scene bundle.
5. **The link hold is a flag (`cardHeld`), not just a cancelled timer.** React derives
   `onPointerEnter` from the `pointerout` that fires **before** the canvas's native
   `pointerleave`, so the hold arrived first and the leave re-scheduled the close.
   Measured in the browser: the card closed 200 ms after the pointer came to rest on the
   link. `scheduleCloseCard()` now respects the flag, and `closeCard()` clears it.
6. **`take()` clears on the next task, not at once.** React Strict Mode (on by default in
   the App Router) mounts the scene's effect, unmounts it and mounts it again in
   development. A take that cleared immediately would restore into the mount that gets
   thrown away.
7. **`---js` frontmatter is refused.** gray-matter `eval`s it by default. `content.ts`
   replaces that engine with one that throws, which fails the build naming the file. This
   is covered by a test.
8. **V-18, read precisely.** A focused node's emphasis is the scene's one deliberately
   endless animation, paced at 30 fps (`EMPHASIS_FRAME_MS`, pre-existing). "Zero frames
   while idle" therefore holds for every **unfocused** idle state: after the intro, after
   hovers, and after a stale `?focus=`. The restore and `?focus=` openings, which both
   focus a node, measure **30 frames per 1.5 s**, which is exactly what a click-focus
   already did. They add no new frame source.
9. **How Proof step 5 was run.** It was a script (Playwright + system Chrome, headless,
   SwiftShader WebGL) against `npm run start`, with the touch check done by long-pressing
   through CDP touch events. All 32 checks passed, covering V-1–V-4, V-10, V-14–V-16,
   V-18, FR-6, FR-8, the hover gap, the Back-to-graph link and WCAG headings/focus rings
   in both themes. What it does **not** cover: a real GPU, a real tablet, and a human eye
   on the motion (for example, whether the `?focus=` fly-in reads as one continuous
   move).

## Handoff

> ### Handoff
>
> **For the Stage 4 session. Read this before writing code.**
>
> - **Build from this file, not from a conversation.** If the implementation deviates from
>   the plan, update this file in the same commit and say why. A stale plan is worse than
>   none — later review stages read it as the approved intent.
> - **Run the Proof section before claiming it works.** If something in it cannot be run,
>   say so explicitly rather than quietly substituting a weaker check.
> - **Do not open the pull request. Ask.** When the work is done and the proof is green,
>   report the state and *ask the human whether to open it*. Never open it, or a spec
>   amendment PR, on your own initiative — including when they approved one earlier in the
>   session. Approval of one PR is not approval of the next.
> - **When they say yes, title it `plan + <type>: <what it does>`** — `feat`, `fix`,
>   `refactor`, `perf`, `chore`, whichever fits the work. The PR carries both `plan.md` and
>   the implementation, which is what the `plan + ` prefix records. The rest of the title
>   is a plain-language description of **what was actually built**, not the slug and not a
>   restatement of the spec's title. `plan + feat: colour by branch, size by whether a node
>   carries anything` — not `plan + feat: graph-branch-colour-and-size`.
> - **Put `Closes #<n>` in the PR body, naming the `plan: <slug>` issue** — the task
>   `plan-ready` opened when the spec was approved. It must be the GitHub keyword, on its
>   own line, with the number: `Closes #31`. Prose like "closes the plan task" reads the
>   same to a person and does nothing at all to GitHub, which is how a task survives the
>   merge that completed it and sits open forever.
>
>   This is the one link that closes the loop the whole trail hangs on — approved,
>   planned, built, done, on one issue. `plan-ready.yml` already depends on it: it watches
>   for the implementation PR's `Closes #n` to distinguish that merge from a product owner
>   re-approving an amended spec, and skips the reopen it would otherwise do.
>
>   If you cannot find the issue number, ask rather than guessing or omitting it.
> - **Say what is not done.** Manual checks you could not run, steps you skipped, values
>   still to be tuned — in the PR body, not omitted because the tests are green.

For this plan the issue is **#53** (`Closes #53`).
