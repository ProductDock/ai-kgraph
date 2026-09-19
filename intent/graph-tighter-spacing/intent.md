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

Decided with the originator on 2026-09-19, answering the first draft's open questions:

- **The hub-to-ring distance may shrink proportionally with everything else**, as long as
  it stays visibly the widest gap in the scene. It is not a fixed number — the
  relationship is what matters.
- **The camera's closest approach stays at today's absolute distance.** The fence does not
  scale down with the ring. The consequence was put to the originator explicitly — with a
  smaller graph and the same minimum distance you can zoom in *relatively* less than
  today, so the tightest reachable view will show the graph smaller than it does now —
  and he accepted it. It does not affect the first-load view, only how far you can push in
  afterwards.
- **More labels disappearing at the overview is an acceptable trade.** Closer nodes mean
  more collisions and today's declutter rule drops more names. That is the price of the
  tighter framing, and the rule stays unchanged. Not a second problem to solve here.
- **First load only.** The framing after clicking a node already feels right and is not in
  scope. If it improves as a side effect, fine; it is not to be tuned separately.
- **The amount is the design stage's to propose.** The originator has no figure in mind.
  The spec proposes one with reasoning, he judges it in the running app and says tighter
  or looser. It is deliberately not a constraint here.

Still left to design: whether the tightening comes from the spacing itself, from the
opening camera distance, from node sizes, or from some combination. The originator
described the symptom, not the mechanism.

## Open questions

All five questions raised in the first draft were put back to the originator on
2026-09-19 and answered; the answers are recorded under **Constraints** above. Nothing is
left undecided at the intent stage.

- [x] How much tighter? — *answered:* no figure from the originator; the design stage
      proposes one and he judges it in the app.
- [x] May the hub-to-ring distance shrink? — *answered:* yes, proportionally, as long as
      it stays the widest gap.
- [x] Does the camera's minimum distance move with the ring? — *answered:* no, today's
      absolute closest approach is kept, with the zoom-in consequence accepted.
- [x] Are more dropped labels at the overview acceptable? — *answered:* yes, acceptable
      trade; the declutter rule is unchanged.
- [x] Does the focus framing tighten too? — *answered:* no, first load only.
