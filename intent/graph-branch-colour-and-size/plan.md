# Plan: colour by branch, size by whether a node carries anything

- **Intent:** [`intent.md`](./intent.md) · **Spec:** [`spec.md`](./spec.md)
- **Stage:** 3 — plan & design review (AI-Native SDLC, lesson 4)
- **Issue:** [#31](https://github.com/ProductDock/ai-kgraph/issues/31)
- **Spec approved at:** `02c72e3`, amended at `9114ef5` (PR #32) — both merged to `main`

## What planning changed before any code was written

The spec's five **Areas of concern** were open when planning started. Four are settled by the
product owner; one was settled by measurement. Three of the five forced a spec amendment
(#32), which is why this plan builds against `9114ef5`, not `02c72e3`.

| | Outcome |
| --- | --- |
| **C-1** non-brand palette | Ship the `dataviz` eight-hue set as-is. No brand review gate. |
| **C-2** ring ceiling | Measured at **four, not eight** — and the seed already has four. Amended. |
| **C-3** childless ring topic | **Exception granted:** every ring topic is group-sized. Amended. |
| **C-4** accessibility gate | Run **before** any code. It changed the design twice. Amended. |
| **C-5** provisional values | Settled for colour by measurement; still open for the three radii. |

The C-3 exception is the one that shapes the build: colour and size now come from a single
predicate instead of two rules that disagreed on exactly one node.

```ts
isGroup(node) = node.depth === 1 || node.hasChildren   // the root is handled separately
```

## Files changed

### New

| Path | What happens |
| --- | --- |
| `src/lib/graph/colour.ts` | The §8.2 assignment algorithm: a pure function from the flattened node list to a colour token per node. Framework-agnostic — it hands back token *names*, never hex. Exports `isGroup`, `HUE_COUNT`, `hueToken`, `HUB_TOKEN`, `assignColours`. |
| `src/lib/graph/colour.test.ts` | V-1…V-5, against the day-one seed and the 148-node synthetic seed. |

### Rewritten

| Path | What happens |
| --- | --- |
| `src/lib/graph/palette.ts` | `DEPTH_LEVELS`, `depthToken`, `RADII`, `radiusForDepth` and `DEPTH_KEY` are removed. It gains `HUB_RADIUS`, `GROUP_RADIUS`, `LEAF_RADIUS` and `radiusForNode(node)`. `MAX_DEPTH = 4` stays; its docstring's rationale is rewritten, because the cap is now a readability and authoring limit on its own terms rather than a side effect of a five-step ramp having five steps. |
| `src/app/graph/_components/depth-key.tsx` → `branch-key.tsx` | Renamed and rewritten. `DepthKey` is prop-less today because a depth-to-colour map is a fixed constant; the new key's content depends on the actual seed, so it takes the ring-topic nodes as a prop and reads each one's `colourToken`. |

### Edited

| Path | What happens |
| --- | --- |
| `src/lib/graph/types.ts` | `GraphNode` gains `hasChildren: boolean`. `GraphSceneNode` gains `colourToken: string`. |
| `src/lib/graph/tree.ts` | `walk` sets `hasChildren` — it already has `children.length` in hand. The depth-cap error message loses "because the depth ramp has 5 colour steps" and states the readability rationale; the check itself is untouched. |
| `src/lib/graph/scene.ts` | `buildScene` calls `assignColours(nodes)` beside `layout(nodes)`, and maps `radius: radiusForNode(node)` and `colourToken`. |
| `src/lib/graph/layout.ts` | `sceneRadius` swaps `radiusForDepth(node.depth)` for `radiusForNode(node)`. Its signature does not change — it already takes `GraphNode[]`, which now carries `hasChildren`. |
| `src/app/graph/page.tsx` | `<DepthKey />` becomes `<BranchKey topics={…depth === 1} />`. |
| `src/app/graph/_components/graph-scene.tsx` | Three narrowing edits: the `palette` import; `SCENE_TOKENS` becomes a fixed module-scope list (hub + 8 hues + `--graph-edge` + `--page`) instead of one built from `MAX_DEPTH`; and `applyTokens` reads `node.colourToken` instead of computing `depthToken(node.depth)` per frame. |
| `src/app/globals.css` | `--graph-depth-0…4` and their rationale comment are replaced by `--graph-hub` and `--graph-branch-0…7`, declared in all three existing scopes exactly as the ramp was, and still not bridged into `@theme inline`. `--graph-edge` and `--graph-label-halo` are untouched. |
| `src/lib/graph/layout.test.ts` | Its two `radiusForDepth` call sites move to `radiusForNode`. No assertion changes meaning. |
| `src/lib/graph/tree.test.ts` | The depth-cap message assertion is amended; a `hasChildren` case is added. |
| `CLAUDE.md` | The `## Graph data` colour and size bullets, and the depth-cap bullet's rationale. |

Untouched, per §8.6: `layout.ts`'s geometry, the camera, `schema.ts`, `seed.ts`, the label
layer, `use-theme-tokens.ts`, and the node and edge counts. `depth` stays in the data model —
both `layout.ts` and `graph-scene.tsx` still need `depth === 1` to find the ring.

## Sequence of work

**1. Settle the palette before writing code. — done, and it changed the design.**

`dataviz`'s `validate_palette.js`, run against this app's own surfaces (`#ffffff`, `#0a0c0e`)
in both modes. Three results, all folded into the spec by #32 rather than worked around here:

- **The hue order had to change.** A chart reads its palette adjacently; this graph does not —
  the ring is a circle of topics on screen at once and listed together in the key, so every
  ring topic must separate from every other (`--pairs all`). The documented order fails at the
  fourth topic: yellow↔orange, normal-vision ΔE 10.6 dark, against a hard floor of 15.
  Re-ordering the same eight values clears every gate in both modes.

  | Slot | Hue | Light | Dark |
  | --- | --- | --- | --- |
  | 0 | blue | `#2a78d6` | `#3987e5` |
  | 1 | green | `#008300` | `#008300` |
  | 2 | magenta | `#e87ba4` | `#d55181` |
  | 3 | yellow | `#eda100` | `#c98500` |
  | 4 | aqua | `#1baf7a` | `#199e70` |
  | 5 | orange | `#eb6834` | `#d95926` |
  | 6 | violet | `#4a3aa7` | `#9085e9` |
  | 7 | red | `#e34948` | `#e66767` |

- **The ring ceiling is four, not eight,** and the seed already has four.
- **The leaf tint is not constructible, so it is gone.** The validated lightness band is
  L 0.43–0.77 light and only 0.48–0.67 dark, and the eight hues already span it: yellow has
  0.006 of headroom in light and 0.000 in dark, violet 0.000, red 0.001. A "lighter step"
  returns the base hue unchanged for those three; forcing it collapses the tints into each
  other (yellow tint vs green tint, CVD ΔE 0.8 dark). Leaves carry their group's own colour.

The hub is `--text-primary` (`#0a0c0e` / `#ffffff`) — the highest-contrast mark, used nowhere
else in the picture.

**Standing obligation:** three light-mode hues sit below 3:1 against the page (magenta 2.69,
yellow 2.17, aqua 2.82) and the fourth ring pair sits in the 6–8 CVD band. Both carry the
validator's documented relief requirement — **visible labels** — which the scene's label layer
and the header key supply. Neither is decorative; removing either re-opens this check.

**2. The data model.** `hasChildren` through `types.ts` and `tree.ts`; the three radii and
`radiusForNode` in `palette.ts`; the two call sites in `layout.ts` and `scene.ts`. Verifiable
on its own: `npm test` stays green, including `layout.test.ts`'s separation and hub-gap tests.

**3. `colour.ts`,** over the pre-order list `flatten` already produces:

1. The root takes `--graph-hub` and plays no further part in hue bookkeeping.
2. Any `isGroup` node takes the first hue in slot order 0…7 that is used by neither its
   immediate parent nor an earlier sibling under the same parent. Ring topics are all siblings
   under the root, so this one rule is also what keeps every ring topic mutually distinct — no
   ring-specific rule is needed.
3. Everything else takes its immediate parent's hue token, unchanged.

Deterministic, order-stable and local: adding a node to one branch cannot move a hue in
another. `colour.test.ts` lands in the same step.

**4. Tokens and the scene.** `globals.css` in all three scopes, then `graph-scene.tsx`'s three
edits. The first point at which anything looks different.

**5. The key.** `depth-key.tsx` → `branch-key.tsx`, wired from `page.tsx`.

**6. Docs and gates.** `CLAUDE.md`, then typecheck, lint, test, build, and the manual passes.

## Risks

**The layout's collision test is the one real risk, and it is measured.**
`layout.test.ts` floors every node pair's centre distance at `2.5 × max(radius)`. Deep parents
currently get the *smallest* radii (0.55, 0.42) and will now get `GROUP_RADIUS`, raising that
floor exactly where nodes sit closest.

| Seed | min distance, any pair involving a group | max group radius that clears the floor | min leaf–leaf | max leaf radius |
| --- | --- | --- | --- | --- |
| day-one | 12.00 | 4.80 | 4.53 | 1.81 |
| synthetic (148) | 5.98 | **2.39** | 2.75 | **1.10** |

`GROUP_RADIUS = 1.05` and `LEAF_RADIUS = 0.42` clear both by more than 2×. Headroom is finite:
push the group radius past about 2.3 in a later tuning pass and that test is what catches it.
The fix would be the constant, not the test — the layout is out of scope here.

- **`SCENE_TOKENS` identity.** `useThemeTokens(names)` keys a `useCallback` on `names`. The
  list must stay a module-scope `as const`; deriving it per render from the nodes would re-run
  the hook every frame.
- **Colour is now the only channel carrying group identity.** Depth used to be carried by
  colour *and* size, so colour was never load-bearing alone. Step 1's validation is the
  mitigation, and it passed — but conditionally, on the labels obligation above.
- **The four-topic ring ceiling is already reached.** The *fifth* top-level topic forces two
  ring topics to share a hue, and the assignment cycles silently — nothing in the build warns.
- **The two still-unnamed ring topics are untouched.** Once colour makes the groups obvious,
  "what is 'n Node'?" is the next question. Out of scope, still the originator's call.
- **Nothing outside the files listed above depends on the removed exports** — `depthToken` has
  three call sites, `radiusForDepth` four, `DEPTH_KEY` one.

**Rollback.** Every change is a swap inside `src/lib/graph/` plus one CSS block and one
component. Reverting the feature PR restores the ramp: no data migration, no stored state, no
URL or API surface, and `seed.ts` is untouched. The spec amendment is its own merged PR (#32)
and can be reverted independently of the code.

**Open questions from the intent:** both closed. Q1 by Step 1's measurements; Q2 by §8.3's
tree-adjacency argument, which leans on `layout.test.ts`'s existing containment invariant.

## Proof

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

| Ref | Assertion |
| --- | --- |
| V-1 | Every `isGroup` node gets a hue token distinct from its parent's and its siblings' |
| V-2 | Every non-group node gets its immediate parent's hue token, unchanged |
| V-3 | `Vector db`'s hue ≠ `RAG`'s, and `pgvector`/`Qdrant`/`S3 vector` carry `Vector db`'s hue |
| V-4 | No hue-bearing node shares a hue with its parent or a sibling — both seeds |
| V-5 | Assignment is identical run twice; adding a node to one branch moves no other branch's hue |
| V-6 | Every group's radius > every leaf's, at every depth — both seeds |
| V-7 | Every leaf below the ring has an identical radius; every ring topic is at `GROUP_RADIUS` |
| V-8 | Met in Step 1. Re-run only if a colour value or the slot order is edited |
| V-13 | `layout.test.ts` and `tree.test.ts` pass unamended in substance — only two call sites and one message string change |

Manual, `npm run dev` at `/graph`, **both themes** (V-9…V-12):

1. Pick three leaves on the rim and name each one's group from colour alone, without following
   an edge.
2. Pick any two clearly different-sized circles; the bigger one is always a group.
3. No two same-coloured groups are visible near each other.
4. The hub is the biggest and highest-contrast mark, and its colour appears nowhere else.
5. The key lists the four ring topics with the colours they were actually assigned.
6. The least-visible new colour is at least as visible as the least-visible old ramp step.
