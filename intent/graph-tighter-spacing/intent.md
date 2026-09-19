# Intent: lower the gap between connected nodes

- **Originator:** Nemanja (product owner)
- **Date:** 2026-09-19
- **Status:** awaiting product owner review

## Problem

The `/graph` scene is too spread out. Connected nodes — a parent and its children — sit
too far apart, so the lines between them are long and there is a lot of empty space on
screen. The originator's words: *"lower the gap between nodes and edges."*

It shows up worst **on first load**, on the opening overview of the whole graph. That is
the view every visitor lands on, so it is not an edge case — it is the first impression
of the app. Today there is no workaround; you are looking at the framing the app chose
for you.

Note for the design stage: edges are currently drawn centre to centre, so there is no
drawn gap between a line and a circle. Asked which gap he meant, the originator confirmed
it is **the distance between connected nodes**, not a sliver between a line end and a
circle. The edges get shorter as a consequence; they are not themselves the subject.

## Proposed outcome

Opening `/graph` shows a graph that fills more of the viewport. Less empty space between
branches and around the outside, with the nodes correspondingly larger on screen at the
opening distance.

Checkable: on the same screen, the committed seed tree occupies visibly more of the
canvas on first load than it does today, and no node pair is closer than the layout's
existing separation floor.

## Affected users and systems

- **Users / roles:** everyone who opens `/graph`. No role distinction.
- **Systems / services:** the layout spacing and the opening camera framing of the 3D
  scene. No data, no API, no change to the seed content.
- **Data:** none. Node names are already public committed content.

## Constraints

Three things the originator explicitly said this must not break:

- **Nodes never overlap or touch.** The existing rule — no two nodes closer than 2.5× the
  larger of their two radii — stays as it is. Tighter spacing does not get to buy itself
  room by relaxing that floor.
- **Branches never interleave.** Each of the four top-level topics keeps its own wedge;
  you can still tell at a glance which branch a deep node belongs to.
- **The middle still reads as the middle.** The hub-to-ring gap stays deliberately wider
  than the gaps between later shells, so the centre of the graph remains obvious.

Not ruled out, and left to design: whether the tightening comes from the spacing itself,
from the opening camera distance, from node sizes, or from some combination. The
originator described the symptom, not the mechanism.

## Open questions

- [ ] How much tighter? The originator did not have a number in mind — he chose "less
      empty space on screen" over "a specific figure", so the design stage should propose
      one and show it. — *owner:* design stage, confirmed by the product owner
- [ ] May the hub-to-ring distance shrink at all, as long as it stays proportionally the
      widest gap in the scene? Or is that one distance fixed? — *owner:* product owner
- [ ] The camera is fenced to stay outside the ring. If the ring moves in, does the
      minimum camera distance move with it, or is the current closest-approach the thing
      to preserve? — *owner:* product owner
- [ ] Labels are dropped when two would collide. Nodes closer together on screen means
      more collisions, so more names may disappear at the overview. Is that an acceptable
      trade for the tighter framing, or a second thing to solve? — *owner:* product owner
- [ ] Is "first load" the only view that matters here, or should the framing after
      clicking a node tighten too? The originator picked first load only. — *owner:*
      product owner
