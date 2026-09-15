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
- Must fit the app baseline already merged in `intent/nextjs-project-baseline` — the
  existing directory rules, state-management rules and environment-variable rules in
  `CLAUDE.md` apply.
- No deadline.

## Open questions

- [ ] Which AI topics does the seed tree contain on day one, and how deep does it go? —
      *owner: Nemanja*
- [ ] How big does this tree get? Tens of nodes and hundreds of nodes lead to different
      layout and performance answers. — *owner: Nemanja*
- [ ] How does a person move through the 3D space — orbit, zoom, fly, click-to-focus? Not
      decided; the reference gives no guidance because it is flat. — *owner: design stage*
- [ ] Node labels have to stay readable in a 3D scene where nodes sit at different depths
      and can occlude each other. How is that handled at the far end of the tree? —
      *owner: design stage*
- [ ] Does depth in the tree need to be visually encoded — size, colour, distance from the
      root — or is the edge structure enough? — *owner: Nemanja*
- [ ] What happens on a phone or a low-powered laptop, where a 3D scene may be unusable?
      Is there an acceptable fallback, and does the 3D constraint hold there too? —
      *owner: Nemanja*
- [ ] Accessibility: a 3D canvas is not reachable by keyboard or screen reader by default.
      What is the minimum we accept for this first slice? — *owner: design stage*
- [ ] Is there a route/URL convention this should live under, given the reference uses
      `/ai-learning-graph/graph`? — *owner: Nemanja*
- [ ] Does the seed file's shape need to anticipate the deferred fields (status, assignee,
      page link) so adding them later isn't a rewrite, or do we ignore them entirely for
      now? — *owner: Nemanja*
