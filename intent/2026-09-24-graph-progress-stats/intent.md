# Intent: Show the team's progress on the graph

- **Originator:** Nemanja
- **Date:** 2026-09-24
- **Status:** approved

## Problem

Right now there is no way to see how far along the team is with the learning graph as
a whole. Each topic has a status (Todo, In Progress, Done), but you only find it by
hovering or long-pressing topics one at a time. Nobody can tell "how much have we done"
just by opening the graph.

What prompted this is a rough mockup of a small "Statistics" panel in the top right
corner of the graph:

```
Statistics
Nodes        41
Edges        40
Done   6/41 (15%)
[███░░░░░░░░░░░░]   ← progress bar
```

The mockup shows what goes in the panel and where it sits. It is not a finished visual
design, and some of its content has since been decided differently (see below).

## Proposed outcome

- Anyone who opens the graph sees a statistics panel in the **top right corner**
  showing how many topics are on the graph, how many are **Done** and how many are
  **In Progress**, and the share that is Done, with a progress bar.
- **Every topic except the central hub counts.** That includes the ring topics and
  group topics (ones with children); they can be marked Done like any other topic.
  Leaving out the hub means 100% can actually be reached.
- **No "Edges" row.** It was in the mockup, but it says nothing about progress.
- **In Progress gets its own row and its own segment in the bar**: a second, lighter
  segment next to Done. There is no separate Todo row.
- The numbers always describe **the whole graph**. They do not change when you click,
  focus or hover a topic.
- The panel **starts open** on every device and **can be collapsed** by the viewer so
  it gets out of the way of the 3D view. If someone collapses it, it **stays collapsed
  for them the next time they visit**.
- When someone's topic is marked Done and that change is merged, the panel's numbers
  go up to match `[assumed]`.

## Affected users and systems

- **Users / roles:** everyone who opens the graph, mostly the team following its own
  learning progress. Contributors see their finished topics show up in the total.
- **Systems / services:** the graph page and the topic status that is already recorded
  per topic. No new source of status is wanted `[assumed]`.
- **Data:** none sensitive. Topic names and statuses are already public on the graph.

## Constraints

- It must **not block orbiting or clicking the graph**. Dragging, clicking a topic and
  the hover card have to keep working the way they do now, including near the panel.
- It must **work on tablet** as well as desktop: it has to fit and read well there.
- How it looks follows the existing design system. The mockup's colours and styling are
  not a requirement.
- **Something else is already planned for the top right corner.** The stats panel has
  to **stack** with it in that corner, not take it over or move to another corner.
- **Screen reader and keyboard access is not required.** The panel is visual only and
  is treated like the 3D scene: known, recorded accessibility debt, not held to the
  WCAG 2.2 AA bar the rest of the page meets.

## Open questions

- [ ] What is the other thing planned for the top right corner? Its size and whether
      it collapses affect how the two stack. — *owner:* product owner
