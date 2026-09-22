# Intent: Show a node's title, assignee and status on hover

- **Originator:** Nemanja Vasic
- **Date:** 2026-09-22
- **Status:** awaiting product owner review

## Problem

Hovering a node in the graph tells you nothing you could not already read off the
label. The graph shows what the topics are and how they hang together, but not who is
working on a topic or whether it is finished — so the graph is a map of the subject and
not a picture of the work. To answer "who owns RAG, and is it done?" you have to ask
someone or look somewhere else entirely.

The concrete example that prompted this: hovering the `rag` node should pop a small
card reading

    RAG (Retrieval-Augmented Generation)
    Assignee: Nemanja Vasic
    Status: Done
    Open page

with the title being the node's own name, and "Open page" a link to the node's own page.

## Proposed outcome

Pointing at any node in the graph raises a card next to it showing, in this order:

- the node's title (its existing name);
- **Assignee** — a person's name, or "Unassigned";
- **Status** — exactly one of **Todo**, **In Progress**, **Done**, defaulting to Todo;
- **Open page** — a link, present on every card, that does nothing yet.

The card appears on hover on a pointer device and on long-press on a tablet, and goes
away when the pointer leaves. Every node has a card; a node with no assignee or status
recorded still shows all three rows, reading "Unassigned" and "Todo".

Assignee and status are authored by hand in the committed graph seed, alongside the
node's name, and changing them is an edit to that one file and a pull request — the same
way topics themselves are added today.

Nothing about the graph's own picture changes: no node changes colour, size or position
because of its status. You learn the status by pointing at the node.

## Affected users and systems

- **Users / roles:** anyone reading the graph — the originator and the team, on desktop
  and on tablet. Also whoever maintains the seed, who gains two new fields to fill in.
- **Systems / services:** the graph route and its 3D scene; the committed graph
  seed and its schema, which is currently `.strict()` and deliberately reserves no such
  fields. No external tracker (Jira, Linear, GitHub issues) is involved.
- **Data:** assignee is a named colleague — a person's name committed to a public-facing
  repository. Not regulated, but it is personal data and it is in git history for good.

## Constraints

- Assignee and status are hand-written in the graph seed. No integration with an external
  issue tracker — the originator ruled that out as far larger scope than this is worth.
- Status is a closed set of exactly three values: Todo, In Progress, Done.
- The card must not change how the graph itself is drawn. Colour means branch, its shade
  means where in that branch, and size means "is this a group" — status gets no third
  visual channel on the node.
- The hover trigger overrides an earlier recorded decision that this panel would open on
  **double-click** on desktop, since single click is already spent on camera focus
  (`CLAUDE.md`). Long-press on tablet is unchanged from that decision. The originator was
  shown the conflict and chose hover.
- "Open page" ships visible and inert. The page it links to is the next feature, not this
  one. [assumed] it should not look like a broken link while it does nothing.

## Open questions

- [ ] Is an inert "Open page" link acceptable to ship, or does it need a visible
      "coming soon" treatment so it does not read as a bug? — *owner:* product owner
- [ ] Should the assignee be a free-text name, or a value from a fixed list of team
      members so that typos fail the build the way duplicate node names do? — *owner:*
      originator
- [ ] Is it right that every node carries a status, including structural grouping nodes
      like the hub and the ring topics, which are categories rather than work? — *owner:*
      originator
- [ ] What dismisses the card on tablet after a long-press, and does it follow the node
      while the camera is moving? — *owner:* design stage
- [ ] Are there names on this that should not be committed to a public repo? — *owner:*
      product owner
