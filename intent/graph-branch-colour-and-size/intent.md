# Intent: colour by branch, size by whether a node carries anything

- **Originator:** Nemanja (product owner)
- **Date:** 2026-09-19
- **Status:** awaiting product owner review

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

- **Every node that has children gets its own distinct colour**, at any depth. Its
  leaves — the children that carry nothing themselves — are drawn in that same colour,
  slightly varied, so they read as belonging to it. A child that has children of its
  own takes a distinct colour instead of inheriting its parent's. So `Evals` is its own
  colour and `Ragas` and `DeepEval` are shades of `Evals`, while `Vector db`, a sibling
  of `Evals`, is a different colour again.
- **A node with children is visibly bigger than a leaf**, wherever it sits in the tree.
  Leaves are all one small size. The hub stays the biggest thing on screen. Depth on
  its own no longer makes a circle bigger or smaller.
- **The key under the header lists the branches and their colours**, not the depth
  names (Root / Area / Topic / Subtopic / Detail), because those words will no longer
  describe what the colours mean.

Checkable: pick any leaf on the rim and you can name the group it belongs to from its
colour alone, without following an edge. Pick any two circles of clearly different
size and the bigger one always has something hanging off it.

## Affected users and systems

- **Users / roles:** anyone reading `/graph` — the whole audience for the page. No
  authoring workflow changes; `seed.ts` is not being asked to carry colours or sizes.
- **Systems / systems touched, as far as the originator knows:** the `/graph` scene and
  its colour tokens. The depth-driven colour ramp and the depth-driven radii are both
  being replaced as the rule that drives the picture. The depth key in the route header
  is replaced. [assumed] the layout — hub, ring, branch angles, camera fence — is not
  in scope and does not move.
- **Data:** none. Public, committed content.

## Constraints

- The seed stays the only place content lives, and it stays free of presentation. No
  colour or size is hand-assigned per node in `seed.ts` — both are derived from the
  tree's own shape.
- Whatever replaces the ramp has to work in light and dark mode, and has to be
  validated the same way the current one was (`dataviz`), not eyeballed.
- The current tree has **eleven non-root nodes with children**, and the seed is meant
  to grow. Eleven is already more than a categorical palette can keep reliably
  distinct, so "a distinct colour per parent" has a ceiling that this change has to
  say something about rather than discover later.
- Accessibility of the scene itself is already recorded debt
  (`intent/graph-accessibility/`) and this change is not expected to pay it off — but
  it must not make things worse. Today depth is carried by colour *and* size together
  precisely so colour is never the only cue; after this change colour carries group and
  size carries has-children, and neither backs the other up.

## Open questions

- [ ] What happens past the palette's ceiling — do colours repeat once the parents
      outnumber the hues, and if so, repeat in a way that never puts two of the same
      colour side by side? Or is the distinct-colour rule capped at some depth and
      deeper parents keep inheriting? — *owner: product owner + design stage*
- [ ] "Slightly changed" for leaves — how far apart do two leaves of the same parent
      sit, and do they differ from each other at all, or are they all the identical
      shade? — *owner: product owner*
- [ ] Should a parent still be able to tell you its depth at a glance, or is depth
      simply no longer something the picture shows? The key is becoming a branch key,
      so the depth story would be gone entirely. — *owner: product owner*
- [ ] Does the hub keep a colour of its own (neutral / dark, as today), or does it join
      the palette? — *owner: product owner*
- [ ] Does the branch key list all eleven-plus parents, or only the ring topics? A key
      with a dozen entries is a different component from one with six. — *owner:
      product owner + design stage*
- [ ] With colour no longer a five-step ordinal ramp, does the hard five-level depth
      cap still have a reason to exist? It exists today *because* the ramp has five
      steps. — *owner: product owner*
- [ ] Is one small size for every leaf right, or should a leaf still shrink a little
      with depth so the rim does not flatten? — *owner: product owner*
