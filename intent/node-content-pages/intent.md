# Intent: Give every node its own content page, written in markdown

- **Originator:** Nemanja Vasic
- **Date:** 2026-09-23
- **Status:** approved

## Problem

The hover card on a node shows its full title, assignee and status, and an "Open page"
link, but the link goes nowhere. The graph shows what the topics are and who is on
them, but there is nowhere to read what a topic actually *is*: no explanation, no notes,
no list of what hangs off it. Someone who wants to learn about RAG from the graph gets
a name and an owner, and then has to look somewhere else.

The concrete example that prompted this: hovering `RAG (Retrieval-Augmented Generation)`
and clicking "Open page" should land on a page reading

    ← Back to AI Learning Graph  |  View Graph

    RAG (Retrieval-Augmented Generation)
    Assignee: Nemanja Vasic
    Status: done

    Retrieval-Augmented Generation (RAG) is a pattern that enhances LLM responses by
    retrieving relevant information from external sources …

    Key Topics
    • what-is-rag — RAG fundamentals and how the pattern works
    • rag-reranking — Improving retrieval quality by reranking results
    • contextual-retrieval — …
    • agentic-rag — …

The text for these pages should live in the repository as markdown files in a
`content/` folder, laid out the same way the tree is nested:

    content/
      n-node/
        index.md          → the "n Node" page
        evals/
          index.md        → the "Evals" page
          deep-eval.md
          ragas.md

## Proposed outcome

- **"Open page" works.** Clicking it on any node's card, other than the hub's, goes to
  that node's page in the same tab. The browser's Back button returns to the graph.
  The link works on desktop hover and after a long-press on tablet.
- **Every node except the hub has a page**, at `/graph/<node>` or, when nested,
  `/graph/<node>/<child>/…`. The address is the node's slugged name path without the
  root, e.g. `/graph/n-node/rag/agentic-rag`. A node with no markdown file still has a
  page showing its title, assignee, status, a "no content yet" note and its children, so
  "Open page" never leads to a dead end.
- **A page shows**, in order:
  - "Back to AI Learning Graph", which goes to the graph overview, and "View Graph",
    which opens the graph with the camera already focused on this node
  - a breadcrumb for the node's parent chain
  - the title, its tags, the assignee and the status
  - the markdown body
  - a "Key Topics" list of its children, generated from the tree rather than written
    by hand, each linking to that child's page
- **The hub's card changes:** it shows only the hub's name, with no "Open page",
  assignee or status. The hub is the frame of the graph, not a piece of work, and
  `/graph` itself is its view.
- **An address that matches no node** (a typo, or an old link to a renamed topic) shows
  the site's normal "not found" page with a way back to the graph.
- **Markdown supports:** GitHub-flavoured markdown, highlighted code blocks, images
  stored in the repo next to the page, and links from one topic page to another. Raw
  HTML is not rendered.
- **Assignee and status move** out of the graph seed and into each page's markdown
  frontmatter. The hover card reads them from there. A node with no file, or with no
  such fields, shows "Unassigned" / "Todo" exactly as today. The values already in the
  seed are carried over into content files as part of this work, and once they are, the
  seed accepts only names and nesting again.

## Affected users and systems

- **Users / roles:** anyone reading the graph, who can now open and read a topic.
  Whoever writes content, who gains a `content/` folder and does it through pull
  requests. Whoever maintains the tree, who still edits the seed for names, nesting and
  order, but no longer for assignee and status.
- **Systems / services:** the graph route and its hover card, which gains its first
  clickable element. The committed graph seed and its schema, which lose `status` and
  `assignee`. A new `content/` folder and a new set of routes under `/graph/…`. The
  build, which gains the checks listed under Constraints.
- **Data:** assignee is still a named colleague committed to the repository, now in
  markdown files instead of the seed. Content files are published to every visitor at
  build time. Nothing regulated [assumed].

## Constraints

- **The seed stays the tree.** Which topics exist, how they nest and what order they
  come in are still defined in the seed file and nowhere else. Content files add to
  existing nodes and never create, rename or reorder them. The originator chose this
  over making the folder layout the tree, because a filesystem has no order and the
  graph's layout depends on it.
- **A content file is matched to its node by path.** Folder and file names are the
  node's slug (`n-node/`, not `n Node/`). A node is `<slug>/index.md`, or `<slug>.md`
  for a node with no children. Either form is allowed for a leaf, but not both at once.
- **The build fails, naming the file, when:**
  - a content file matches no node
  - the same node has two files
  - a frontmatter key is unknown
  - a status is not one of Todo / In Progress / Done
  - a content file exists for the hub (a root-level `content/index.md`)

  An unknown key fails the build for the same reason unknown seed keys do: a typo
  that is silently ignored just looks like missing content.
- **Renaming a topic in the seed orphans its content files**, and the build then fails
  until they are moved in the same pull request. This is accepted. No redirects are
  kept for old addresses.
- **Frontmatter holds exactly four optional fields:**
  - `title` changes the page heading only. The graph label, the hover card, the id and
    the address still come from the node's name in the seed.
  - `tags` are shown on the page as plain labels and do nothing else. They are free
    text, lower-cased, with no duplicates. Tag pages and filtering the graph by tag are
    separate features.
  - `status` is the same closed set of three words as today.
  - `assignee` is free text under the same rule as today, so a misspelled name still
    ships without warning (node-hover-card C-2, still accepted).
- **Frontmatter reaches the graph only through `status` and `assignee`.** Nothing else
  from a content file, not `title` and not `tags`, changes the hover card's size,
  layout or contents.
- **Content is published at build time only.** A merged pull request is the only way a
  page changes, the same model as the seed today.
- **Only the "Open page" link in the card takes pointer events.** The rest of the card
  must stay see-through to pointer events, so an orbit drag that starts over a card
  still turns the scene.
- **Single click on a node still focuses the camera**, unchanged.
- This overrides one decision from `intent/node-hover-card/`: the hub no longer shows
  assignee or status. The originator chose this knowingly.

## Open questions

- [ ] "View Graph" has to open the graph focused on one node, which means the graph
      needs a way to be told which node to focus on arrival. Should that also work as a
      shareable link to a focused node in the graph? — *owner:* design stage
- [ ] Moving assignee and status out of the seed means creating a content file, even
      one with an empty body, for every node that has them today. Is that acceptable,
      or does it make empty-looking files that confuse authors? — *owner:* originator
- [ ] Should "Key Topics" show a one-line description for each child, as in the
      screenshot? No field for that was chosen (`summary` was offered and declined),
      so as specified the list shows names only. — *owner:* originator
- [ ] Do content pages need the same brand and accessibility bar as the graph page's
      chrome (WCAG 2.2 AA)? [assumed] yes. — *owner:* product owner
- [ ] Is it acceptable that content pages are public to every visitor of the site,
      with no notion of draft or unpublished pages? — *owner:* product owner
- [ ] What should the page's own title in the browser tab and link previews be: the
      node name or the frontmatter `title`? — *owner:* design stage
