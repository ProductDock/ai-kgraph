# Intent: Make the knowledge graph usable without a mouse or without sight

- **Originator:** Nemanja (nemanja.vasic@productdock.com)
- **Date:** 2026-09-17
- **Status:** draft
- **Opened by:** the `ai-knowledge-graph-3d` build, as required by its spec §14 **C-1**
  and plan **R-7**. It is opened in the same commit that ships the graph, not "later".

## Problem

`/graph` is the app's only product surface, and a keyboard user cannot use any of it. The
scene is a `<canvas>`: there is nothing to tab to, nothing to activate, and nothing for a
screen reader to read. A colleague who navigates by keyboard, or who uses a screen reader,
can open the page, read the heading and the depth key, and then stop.

This was an accepted trade, not an oversight. The `ai-knowledge-graph-3d` intent decided
it explicitly to keep the first slice small, its spec recorded exactly what was being
given up, and this intent is the debt coming due. Concretely, what ships today fails:

- **WCAG 2.1.1 (Keyboard)** — no node can be reached, focused or activated by keyboard.
- **WCAG 4.1.2 (Name, Role, Value)** — the canvas is one opaque element; no node has a
  name or a role.
- **WCAG 1.4.11 (Non-text Contrast)** — the deepest ramp steps sit close to the surface
  by design, so the outermost nodes do not clear 3:1 against the background.

The reason this matters more than a normal piece of debt: the stated success criterion for
the graph is that *someone on the team who has never seen it can open the page and tell
which areas of AI we have mapped out and which are thin*. For part of the team, that is
currently false for reasons that have nothing to do with the content.

## Proposed outcome

A colleague using only a keyboard, or a screen reader, can answer the same question the
graph exists to answer: which areas we have mapped out, and which are thin.

Observably:

- Every node is reachable and activatable from the keyboard, with a visible focus
  indicator, and activating one does what a click does — centres it and its children.
- A screen reader announces a node's title, its depth, and how many topics hang off it.
- The structure is conveyed, not just the nodes: a listener can tell what is a child of
  what without seeing the picture.
- Depth is distinguishable without relying on the colour ramp's contrast against the
  background.

## Affected users and systems

- **Users / roles:** anyone on the team using a keyboard, a screen reader, or both;
  anyone with a colour-vision deficiency, for whom five steps of one hue are five steps of
  one grey.
- **Systems / services:** `/graph` in the `ai-kgraph` app. Two seams were deliberately
  left open for this work: labels are real DOM text (spec D-6), and picking already
  resolves to a node id in one handler (spec §2.3), which is what a roving-tabindex
  implementation needs.
- **Data:** none. No new content, no new fields in the seed.

## Constraints

- The 3D scene stays. This is about reaching it, not replacing it.
- It must not require a second view kept in sync with the first — that was cut from the
  original intent on purpose and the reason has not changed.

## Open questions

- [ ] Is the answer a roving tabindex over the canvas, a parallel DOM tree, or an
      `aria-activedescendant` pattern? Each has a different cost. — *owner: whoever picks
      this up, at Stage 2*
- [ ] Does the non-text-contrast failure get fixed by changing the ramp, or by adding a
      per-node outline? Changing the ramp means re-running the `dataviz` validator in both
      modes. — *owner: Stage 2*
- [ ] Is there a keyboard path that is genuinely useful at 150 nodes, or does this need
      search or a tree view to be worth using? — *owner: Nemanja*
