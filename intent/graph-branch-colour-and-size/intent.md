# Intent: colour by branch, size by whether a node carries anything

- **Originator:** Nemanja (product owner)
- **Date:** 2026-09-19
- **Status:** approved

## Problem

The graph at `/graph` is all one blue. Every node is a step on the same five-step blue
ramp, and the step only says how deep the node sits — so on screen, "Qdrant" and
"DeepEval" and "n8n" are the same pale blue even though they belong to completely
different parts of the tree. Looking at the picture, you cannot tell which things
belong together. You have to trace the thin edges back to the hub to work out what a
dot is part of, and out on the rim — where the branches fan into a dozen small dots —
tracing edges is exactly what does not work.

The sizes have the same problem from the other direction. Size steps down with depth,
so a leaf that sits one level in is drawn bigger than a topic that sits three levels in
and carries four things under it. The eye reads the big circle as the important one,
and it is often a dead end.

The originator's words: *"I want different colours for every node, then leaves of a
node will have the node's colour but slightly changed"* and *"I want parent nodes
bigger circles"*.

## Proposed outcome

Looking at the graph without clicking anything, you can see the groups.

- **Every node that has children carries its own colour**, at any depth. Its leaves —
  the children that carry nothing themselves — are drawn in **one single lighter shade
  of that colour**, the same shade for all of them, so they read as belonging to it. A
  child that has children of its own takes a colour of its own instead of inheriting
  its parent's. So `Evals` has its own colour and `Ragas` and `DeepEval` are the one
  lighter shade of it, while `Vector db`, a sibling of `Evals`, carries a different
  colour again.
- **Colour is a local grouping cue, not a unique id.** There are roughly eight distinct
  hues and more parents than that, so hues repeat — but never between two parents that
  are near each other, in the tree or on screen. You should never be able to see two
  same-coloured parents at once and wonder whether they are related.
- **The hub stays neutral and apart**, outside the palette, so the centre reads as the
  centre rather than as one more branch.
- **A node with children is visibly bigger than a leaf**, wherever it sits in the tree.
  **Every leaf is the same small size** — the rim reads as uniform end points, nothing
  hanging off them. The hub stays the biggest thing on screen. Depth on its own no
  longer makes a circle bigger or smaller.
- **Depth is no longer encoded in the picture at all.** Distance from the hub already
  says it. Colour means group, size means has-children, and that is the whole legend.
- **The key under the header lists the ring topics and their colours** — around six
  entries, a short strip — replacing the depth names (Root / Area / Topic / Subtopic /
  Detail), which will no longer describe anything.

Checkable: pick any leaf on the rim and you can name the group it belongs to from its
colour alone, without following an edge. Pick any two circles of clearly different
size and the bigger one always has something hanging off it. No two same-coloured
parents are visible near each other.

## Affected users and systems

- **Users / roles:** anyone reading `/graph` — the whole audience for the page. No
  authoring workflow changes; `seed.ts` is not being asked to carry colours or sizes.
- **Systems touched, as far as the originator knows:** the `/graph` scene and its colour
  tokens. The depth-driven colour ramp and the depth-driven radii are both replaced as
  the rule that drives the picture. The depth key in the route header is replaced.
  [assumed] the layout — hub, ring, branch angles, camera fence — is not in scope and
  does not move.
- **Data:** none. Public, committed content.

## Constraints

- The seed stays the only place content lives, and it stays free of presentation. No
  colour or size is hand-assigned per node in `seed.ts` — both are derived from the
  tree's own shape.
- Whatever replaces the ramp has to work in light and dark mode, and has to be
  validated the same way the current one was (`dataviz`), not eyeballed.
- **The five-level depth cap stays**, with a new reason. It exists today because the
  ramp has five steps; after this it is a deliberate limit on how deep the content may
  go, for readability and authoring. A sixth level still fails the build.
- Accessibility of the scene itself is already recorded debt
  (`intent/graph-accessibility/`) and this change is not expected to pay it off — but
  it must not make things worse.

## Open questions

- [ ] Colour and size no longer back each other up. Today depth is carried by both, so
      colour is never the only cue; after this, group is carried by colour alone.
      Whether reused hues plus a neutral hub clear contrast and colour-vision-deficiency
      checks in both modes is for `dataviz` validation to answer, and it may force the
      hue count down. — *owner: design stage*
- [ ] "Never adjacent" needs a definition the spec can assert — adjacent in the tree,
      adjacent on screen after layout, or both. — *owner: design stage*
