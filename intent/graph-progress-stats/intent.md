# Intent: Show the team's progress on the graph

- **Originator:** Nemanja
- **Date:** 2026-09-24
- **Status:** awaiting product owner review

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
design.

## Proposed outcome

- Anyone who opens the graph sees a statistics panel in the **top right corner**
  showing how many topics are on the graph, how many connections they have, how many
  are **Done** and how many are **In Progress**, and the share that is Done, with a
  progress bar.
- The numbers only count the **topics people actually work on**. The central hub is
  left out, so 100% can actually be reached. (What else counts as "workable" is below
  under Open questions.)
- The numbers always describe **the whole graph**. They do not change when you click,
  focus or hover a topic.
- The panel is visible by default and **can be collapsed** by the viewer so it gets
  out of the way of the 3D view.
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

## Open questions

- [ ] Beyond the hub, what counts as a "workable" topic? Should the four ring topics
      and other group topics (ones with children) count, or only the topics at the
      end of a branch? — *owner:* Nemanja / product owner
- [ ] With the hub left out, what should "Edges" count? All connections, or only
      connections between counted topics? Is Edges worth showing at all, or is it
      just filler from the mockup? — *owner:* Nemanja
- [ ] How should In Progress be shown: its own row, a second segment in the bar, or
      both? Should Todo be shown too? — *owner:* Nemanja / design
- [ ] Should the panel stay collapsed for someone who collapsed it the next time they
      come back? Should it start collapsed on tablet? — *owner:* Nemanja
- [ ] Does the panel need to be readable by screen readers and reachable by keyboard,
      like the rest of the page around the graph? — *owner:* product owner
- [ ] Is anything else already planned for the top right corner that this would
      fight with? — *owner:* product owner
