# Intent: See our AI learning as a 3D knowledge graph

- **Originator:** Nemanja (nemanja.vasic@productdock.com)
- **Date:** 2026-09-15
- **Status:** awaiting product owner review

## Problem

The Next.js app is set up but it has no product in it yet. The thing I actually want to
build is an AI knowledge graph: a map of what we are learning about AI, where the big
topics sit, and what hangs off them.

Today that knowledge has no shape at all. It is scattered across notes, docs and people's
heads. Nobody on the team can look at one picture and answer "what does AI mean for us,
which parts do we understand, and where are the holes" — and that is exactly the question
that keeps coming up.

The concrete thing that prompted this: I found PathForge's AI Learning Graph
(`https://pathforge.goodbyeplanet.dev/ai-learning-graph/graph`) and the shape of it is
what I want — a hub in the middle, coloured clusters radiating out, each cluster a broad
topic with more specific topics attached.

My problem with it is that it is flat. A 2D layout of this graph is already crowded at
around 40 nodes, clusters overlap, and it reads as a diagram rather than as a space you
can move around in. I want the same graph in 3D.

The reference does a lot more than that — per-node status and assignee, a popup with a
link through to a written page for each topic, a sidebar with statistics and contributor
tallies, status filtering. I want all of that eventually, but if I chase it now this
becomes a huge feature and nothing ships. **So this intent is deliberately only the
graph itself.** Everything else is a later intent.

[assumed] Nothing has been built for this yet, so "what people do today instead" is:
nothing — the graph doesn't exist in any form in this app.

## Proposed outcome

A page in the app that renders our AI knowledge topics as a graph in 3D space, which my
team and I can open and move around in.

Observably:

- There is one root node: **AI**.
- The root's children are broad topics.
- Each broad topic's children are more specific topics to be learned, and those can have
  children of their own — the structure nests as deep as the content needs.
- It is a tree. Every node has exactly one parent, and there are no connections between
  nodes in different branches. A leaf never links sideways to another leaf.
- Nodes and the edges between them are laid out in three dimensions — you can move around
  the graph, not just look at a flat picture of it.
- Every node shows a readable title.
- A node's colour tells you how deep in the tree it sits — the root is one colour, the
  broad topics another, the level below that another, and so on, the way the originator's
  whiteboard is colour-coded.
- On a phone, or a machine that cannot render the scene, the page says so plainly rather
  than showing something broken.
- Someone on the team who has never seen it can open the page and tell, without being
  told, which areas of AI we have mapped out and which are thin.

That is the whole of it. Nodes, edges, labels, 3D.

## Affected users and systems

- **Users / roles:** me and my team at ProductDock. We look at this to see the shape of
  what we are learning about AI.
- **Systems / services:** the `ai-kgraph` Next.js app itself. The graph data is a static
  seed file committed in the repo. There is no backend.
- **Data:** none sensitive or regulated. No customer data. No personal data either, now
  that assignees and contributors are out of scope.

## Constraints

- **The graph must be rendered in 3D, not 2D.** This is not negotiable and is the whole
  point of the change — a flat layout is what I am deliberately moving away from.
- **The graph is a strict tree.** No interconnections between leaf nodes, no cross-branch
  edges, no cycles.
- Graph data is a static seed file in the repo. No database, no in-app editing, no
  persistence layer. Adding or changing a topic is a file edit and a commit through the
  normal PR flow.
- **Explicitly out of scope for this intent**, and not to be designed or built now, even
  though the reference app has them and I want them later:
  - node status (Done / In Progress / Todo)
  - assignees and contributors
  - the node popup
  - the "Open page" link and the per-topic explanation pages behind it
  - the right-hand sidebar (statistics, legend, contributor tallies)
  - status filtering
- **The day-one seed tree is decided** and comes from the originator's whiteboard. Four
  labels below are transcribed verbatim and read as notes-to-self rather than topic
  titles; they need real names before content work starts, but they are recorded as they
  were written rather than invented. `n Node` is the originator's own placeholder — the
  real name is not known yet and the label stays as `n Node` until it is.

  ```
  AI
  ├── AI Agents
  │   ├── Find agent example max 5-10        [verbatim — reads as a note, needs a title]
  │   │   ├── Claude Agent SDK
  │   │   ├── Google ADK
  │   │   ├── Langchain
  │   │   ├── Langgraph
  │   │   ├── Strands
  │   │   ├── OpenAI API compatible
  │   │   └── Bring your own but check with us   [verbatim — reads as a note]
  │   ├── How coding agents are built
  │   │   ├── pi
  │   │   ├── opencode
  │   │   ├── tau
  │   │   └── what else is hyped now or active   [verbatim — reads as a note]
  │   └── Workflows
  │       ├── n8n
  │       └── something else                     [verbatim — reads as a note]
  ├── n Node                                     [placeholder name, not yet decided]
  │   ├── RAG
  │   │   └── Vector db
  │   │       ├── pgvector
  │   │       ├── Qdrant
  │   │       └── S3 vector
  │   ├── Evals
  │   │   ├── Ragas
  │   │   └── DeepEval
  │   └── Techniques
  │       ├── Spec driven development
  │       └── AI TDD
  ├── Protocols
  │   ├── MCP
  │   │   ├── Web browser MCP
  │   │   └── Oauth with Keycloak
  │   └── A2A
  └── n Node for non technical person (product and designers)   [no children yet]
  ```

  That is roughly 30 nodes and four levels deep. The tree is expected to stay in the tens
  of nodes — under about 100 — so layout and performance are not expected to be a
  constraint on the design.
- **The seed file holds names and children only.** Status, assignee and page-link fields
  are not reserved or stubbed in it now; they get added when those features are actually
  built. Reason: it is a static file we control, so adding fields later is cheap, and
  empty slots would pull the deferred features back into this design.
- **Depth is encoded by colour, one colour per level of the tree**, as on the originator's
  whiteboard: root, broad topics, the level below, and so on. The colours themselves must
  come from the ProductDock palette in `design-system/` — the whiteboard's blue/red/gold
  are the *scheme*, not the hues to ship.
- **This is a desktop view.** On a phone, or where the 3D scene cannot render, the page
  states plainly that the view needs a desktop browser. No 2D or text fallback is built —
  that would be a second view to keep in sync, which is scope deliberately cut.
- **The page lives at `/graph`.** The home page is left free for an introduction or
  landing page later.
- Must fit the app baseline already merged in `intent/nextjs-project-baseline` — the
  existing directory rules, state-management rules and environment-variable rules in
  `CLAUDE.md` apply.
- No deadline.

## Open questions

- [x] Which AI topics does the seed tree contain on day one, and how deep does it go? —
      **Answered:** taken from the originator's whiteboard; the tree is recorded under
      Constraints. Four labels are notes-to-self and still need real titles, and the
      `n Node` branches are unnamed placeholders.
- [x] How big does this tree get? — **Answered:** tens of nodes, under about 100.
- [x] Does the seed file anticipate the deferred fields (status, assignee, page link)? —
      **Answered:** no. Names and children only; see Constraints.
- [ ] What should `n Node` actually be called? It appears twice as a branch name and is
      a placeholder the originator has not named yet. — *owner: Nemanja*
- [ ] The four verbatim note-style labels need real topic titles before content work
      starts. — *owner: Nemanja*
- [ ] How does a person move through the 3D space — orbit, zoom, fly, click-to-focus? Not
      decided; the reference gives no guidance because it is flat. — *owner: design stage*
- [ ] Node labels have to stay readable in a 3D scene where nodes sit at different depths
      and can occlude each other. How is that handled at the far end of the tree? —
      *owner: design stage*
- [x] Does depth in the tree need to be visually encoded? — **Answered:** yes, one colour
      per level, as on the whiteboard. Hues come from the ProductDock palette.
- [x] What happens on a phone or a low-powered laptop? — **Answered:** desktop-only, with
      a plain message where the scene cannot render. No fallback view.
- [ ] Accessibility: a 3D canvas is not reachable by keyboard or screen reader by default.
      What is the minimum we accept for this first slice? — *owner: design stage*
- [x] Which route does this live under? — **Answered:** `/graph`.
- [ ] Desktop-only removes the phone case but not the accessibility one — a keyboard user
      on a desktop still cannot reach a 3D canvas. That stays open below. — *note*
