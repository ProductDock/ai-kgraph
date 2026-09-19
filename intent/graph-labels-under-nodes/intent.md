# Intent: node labels sit under the circle, never on it

- **Originator:** Nemanja (product owner)
- **Date:** 2026-09-19
- **Status:** awaiting product owner review

## Problem

In the `/graph` scene the text of a node's name collides with the shapes. A label is
drawn just above its own node, which puts it on whatever circle happens to be above it,
and the hub's name is drawn *inside* its circle. Either way you end up reading text over
a filled colour, and neither the word nor the shape is clear.

The originator brought a screenshot of another knowledge-graph tool (kept beside this
file as `reference.png`) where every name, including the central one, sits in clear air
*underneath* its circle. That is the look he wants: the name is under the circle, not
part of it.

Who hits it: anyone looking at the graph — it is the default view of the app, so it is
every visit, not an edge case. There is no workaround today; you move the camera until
the text happens to clear the shape. [assumed — not stated, but nothing else is
available.]

## Proposed outcome

Every label in the scene is drawn below its node's circle, with visible air between the
text and the shape, and no label is ever drawn on top of the circle it names. The hub is
no longer the exception — its name moves out from inside its circle and sits under it
like every other node's. One rule, visible at a glance, matching `reference.png`.

Checkable: open `/graph`, and at any camera angle no node name overlaps its own circle,
and the hub's name is outside its circle.

Decided with the originator:

- **The gap scales with the circle**, so the air under a name looks the same whether it
  hangs off the hub, a group or a leaf — a big circle pushes its name further down. Not
  one fixed offset for all three radii.
- **"Below" means below on screen**, not below in the scene: the text sits straight down
  in the viewport whatever the camera is doing, so it never swings round to the side of
  the circle as you orbit.
- **Nothing depends on the hub's name being inside its circle** — it follows the same
  rule as everything else.

## Affected users and systems

- **Users / roles:** everyone who opens `/graph`. No role distinction.
- **Systems / services:** the 3D scene's label layer only. No data, no API, no seed
  content change.
- **Data:** none. Node names are already public committed content.

## Constraints

- The fixed label pool and the decluttering stay: labels are still capped at a fixed
  number and still dropped when two would overlap each other. No DOM node per graph node.
  When moving labels down makes two collide, today's rule holds unchanged — the less
  important one disappears, root and focused node first, then nearest the camera. No new
  collision behaviour is wanted.
- Type size, colour and the ellipsis truncation width stay exactly as they are — this is
  a change of *where* the text sits, nothing else.
- No new dependency and no renderer change. It is a placement change inside the existing
  scene, not a reason to bring in a labelling library.
- The screenshot is a reference for label placement only, not for node shape, colour,
  edge styling or how many labels are on screen at once. Those were explicitly excluded.

## Open questions

All four questions raised in the first draft were put back to the originator on
2026-09-19 and answered; the answers are recorded under **Proposed outcome** and
**Constraints** above. Nothing is left undecided at the intent stage.

- [x] Does the gap scale with the node's radius, or is it one fixed distance?
      — *answered:* it scales with the circle.
- [x] Does moving labels down need new collision behaviour?
      — *answered:* no, today's declutter rule stands unchanged.
- [x] Is "below" measured on screen or in the scene? — *answered:* on screen.
- [x] Does anything rely on the hub's name being inside its circle?
      — *answered:* no, it moves out like every other node.
