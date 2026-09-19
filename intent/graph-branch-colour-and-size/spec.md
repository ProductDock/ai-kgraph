# Spec: colour by branch, size by whether a node carries anything

- **Intent:** [`intent.md`](./intent.md) — *colour by branch, size by whether a node carries
  anything*
- **Originator:** Nemanja (product owner)
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** awaiting product owner and engineering review

## Review guide

This spec has two audiences, and it's split so each can stop where their job ends.

- **Product owner:** read **Part A** only. It has everything you need to approve, redirect,
  or cut a decision — what changes on screen, what's still open, and what could go wrong. No
  file names, code, or rendering mechanics appear in Part A; where a technical choice has a
  consequence you'd care about, it's stated as that consequence, with a pointer into Part B
  for anyone who wants the mechanics.
- **Engineering:** read Part A for the same context the product owner has, then Part B, which
  is where the build actually lives.
- **Both:** read **Areas of concern** at the end. Every item there is written so the product
  owner can act on it without reading Part B.

Section numbers run continuously across both parts, so a cross-reference like "see §8.2"
always points at the same place no matter which part you're in.

---

## Part A - Product

### 1. Summary

`/graph` is currently all one blue: every node's colour is just a step on a five-step ramp
that says how deep it sits, and its size follows the same ramp. Neither says anything about
which topics belong together. A viewer has to trace edges back to the hub to work out what a
dot is part of, and at the rim — where branches fan into a dozen small dots — that's exactly
where tracing an edge back stops working.

This spec replaces both rules with two new ones. **Colour now means "which group,"** not
"how deep": every topic that has anything under it gets its own colour, and everything
directly under it that itself carries nothing is drawn in one lighter version of that same
colour — so a viewer can look at any dot on the rim and know which topic it belongs to
without following a single edge. **Size now means "does this carry anything,"** not "how
deep": anything with children is visibly bigger than a leaf, full stop, wherever in the tree
it sits, and every leaf is the same small size. Depth stops being shown at all — distance
from the centre already says it, so colour and size are now free to say something else.

Nothing about what's *in* the graph changes. The content, the shape of the tree, the camera,
and how you move around all stay exactly as they are today. This is a colour-and-size change
only, and everything it depends on can be looked at and re-checked without touching anything
else about the page.

### 2. Scope

#### 2.1 In scope

- Every node that has at least one thing under it gets its own colour, distinct from its own
  parent's colour and from every one of its siblings that also has its own colour.
- Everything directly under such a node that itself carries nothing is drawn in one single,
  lighter version of that node's colour — the same shade for every one of that node's
  "nothing-under-it" children.
- A node that has children of its own always gets a new colour of its own, never a shade of
  the colour above it — colour only ever shades downward as far as the nearest node that
  itself carries something.
- The centre of the graph keeps one colour, used nowhere else in the picture.
- Every topic on the ring around the centre — whether or not anything is under it — gets its
  own colour and a place in the on-screen key.
- Any two groups that sit next to each other, either in the tree or as drawn on screen, never
  share a colour.
- Anything with children is visibly bigger than a leaf, at any depth. Every leaf is the same
  small size, wherever it sits.
- The centre stays the single biggest thing on screen.
- Depth stops being shown by colour or by size.
- The key under the page header changes from listing five depth names to listing each ring
  topic's name next to its colour.

#### 2.2 Out of scope

Restated from the intent, so nothing below is quietly folded into this piece of work:

- The tree's content, shape, or depth limit. No topic is added, renamed, or moved, and the
  five-level limit on how deep the tree may go stays exactly where it is (§4, D-3).
- The camera, the layout, and how a click moves the view. None of that is touched here.
- The sidebar legend the original graph spec already put out of scope. This spec only changes
  the small inline key in the page header, not a full legend panel.
- Keyboard and screen-reader access to the graph. That's its own already-open, separately
  tracked piece of work; this change must not make it worse (§4, D-4; Risks, §6).
- Deciding what the still-unnamed topics are called. Unchanged, and still the originator's
  call (see Risks, §6).

#### 2.3 Deferred

- **Growing past eight top-level topics.** The colour scheme this spec uses has eight
  distinct colours, and every topic on the ring needs a colour different from every other
  ring topic, because they're always visible together. Today there are four; the key's design
  comfortably fits "around six," per the intent. What happens at topic number nine is a real
  future question, not answered here (§4, D-5; Areas of concern, C-2).
- **A colour-independent way to tell groups apart**, for anyone who can't rely on colour at
  all. That belongs to the already-open keyboard/screen-reader work, not this spec (§4, D-4).
- **Filling the ring topic that currently has nothing under it** stays a content decision for
  the originator, exactly as the previous graph spec left it.

### 3. Decisions that close the open questions

The intent left two questions open. Both are answered here.

| # | Open question | Decision |
| --- | --- | --- |
| Q1 | Do reused colours plus a neutral centre still pass contrast and colour-vision-deficiency checks in both light and dark mode, and does that force the colour count down? | **Answered provisionally: no, the colour count should not need to come down.** The eight colours picked (§8.1) already pass the same accessibility checks the current ramp was validated against, by a comfortable margin, on background colours very close to this app's own. The exact numbers **for this app's own background colours** are re-checked in the build stage before this ships (§10, V-8), the same way the current ramp's numbers were checked when it was built — this is a "measure it once it exists" confirmation, not a design change expected to follow. |
| Q2 | Does "never two same-coloured groups visible near each other" mean near in the tree, near on screen, or both? | **Answered: near in the tree is enough, and it already guarantees near on screen too.** Two groups are treated as "near" exactly when one is the other's immediate parent, or they share the same immediate parent (are siblings). The graph's existing shape rule — a branch's entire subtree always stays inside its own slice of the picture and can never spread into a neighbouring branch's slice, already checked automatically today — is what makes that tree-level rule also true on screen: two branches that aren't near each other in the tree physically cannot end up near each other on screen either. No separate on-screen check is needed on top of it (§8.3). |

### 4. Decisions added beyond the intent

The intent described the finished picture but didn't specify every case needed to build it.
Five calls made here go beyond what the intent asked for; none should be treated as settled
just because they're written down — confirm or cut each one.

1. **The eight colours are not ProductDock's own brand colours.** ProductDock's brand only
   defines two accent colours (a blue and an orange) — nowhere near the eight distinct,
   easily-told-apart colours this feature needs. Rather than inventing six more brand colours
   ourselves, this spec reuses a ready-made, already-accessibility-checked set of eight
   colours used elsewhere for exactly this job (telling series apart in a chart). One of the
   eight happens to be a close cousin of ProductDock's own blue; the other seven are not
   ProductDock colours at all. **This is a visible brand decision, not just an engineering
   one — see Areas of concern, C-1.**
2. **A ring topic with nothing under it still gets its own colour and its own key entry, but
   is still drawn at leaf size.** Colour and size follow two separate, independent rules
   (colour = "is this a group," size = "does this carry anything"), and this is the one node
   in today's tree where the two rules pull in different directions: it's treated as a group
   for colour purposes (because every ring topic is) but as a leaf for size purposes (because
   it has nothing under it). The result is a uniquely-coloured key entry pointing at the
   smallest dot on the ring. **See Areas of concern, C-3.**
3. **The centre's colour is chosen to be the highest-contrast mark on screen**, rather than
   an arbitrary "neutral grey" — the same reasoning the very first version of this page used
   to make the centre read as the centre. It is not one of the eight group colours and is not
   reused anywhere else in the picture.
4. **"Near," for the purpose of never repeating a colour, is defined using the tree alone**
   (§3, Q2) — not by measuring pixels on screen. This is what makes the rule checkable by a
   test rather than by eyeballing a screenshot, and Part B explains why it's still safe to do
   (§8.3).
5. **Eight is the ceiling on how many top-level topics the ring can ever hold** without two of
   them sharing a colour (§2.3; Areas of concern, C-2). This isn't a problem today — there are
   four — but it's a real limit worth knowing about before the tree grows.

### 5. Functional requirements

Each of these is something you can point at on screen; verification is §10.

- **FR-1.** Every node that has at least one thing under it is drawn in its own colour.
- **FR-2.** Every node that carries nothing itself is drawn in one single, lighter version of
  its immediate parent's colour, the same shade as every other "nothing under it" child of
  that same parent.
- **FR-3.** A node that has its own children never inherits a shade of an ancestor's colour —
  it always gets a new colour of its own, no matter how deep it sits.
- **FR-4.** The centre of the graph is always drawn in the same one colour, and that colour
  never appears anywhere else in the picture.
- **FR-5.** Every topic on the ring around the centre has its own colour and its own entry in
  the on-screen key, whether or not it has anything under it.
- **FR-6.** No two groups that are immediate neighbours — a node and its own parent, or two
  nodes that share the same parent — are ever drawn in the same colour.
- **FR-7.** Every node with children is visibly bigger than every leaf, at any depth.
- **FR-8.** Every leaf is drawn at exactly the same size, wherever it sits in the tree.
- **FR-9.** The centre remains the single biggest thing on screen.
- **FR-10.** Depth no longer changes what colour or size a node is drawn at.
- **FR-11.** The key beneath the page header lists each ring topic's name next to its colour,
  and nothing else.

Checkable, in the intent's own words: pick any leaf on the rim and you can name the group it
belongs to from its colour alone. Pick any two clearly different-sized circles and the bigger
one always has something hanging off it. No two same-coloured groups are ever visible near
each other.

### 6. Risks

| Risk | Why it matters |
| --- | --- |
| **The eight colours carry no ProductDock brand approval (§4, D-1).** | This is the most visually prominent colour decision made on this page so far — six of eight colours on screen would be colours nobody at ProductDock chose. If that's not acceptable, this spec's whole colour approach needs to change, not just its palette. |
| **The ring can only ever hold eight top-level topics before two must share a colour (§2.3, §4, D-5).** | Not a problem today, but it's a ceiling nobody has agreed to yet, and it will arrive without warning the day a ninth top-level topic is added. |
| **Accessibility debt is explicitly not supposed to get worse, and the riskiest colours (the lightest, hardest-to-tell-apart ones) sit exactly at the rim** — the same place a colour-vision-deficient viewer, or the keyboard/screen-reader user from the already-open accessibility work, already struggles most. | The intent is explicit that this change must not make that debt worse. Part B's checks are designed to confirm that, but as of this spec they have not yet been run against this app's actual colours (§3, Q1; §10, V-8). |
| **The two still-unnamed ring topics and the note-style leaf labels are untouched.** | Once colour makes the groups obvious at a glance, a viewer's very next question is "what is 'n Node'?" — the same problem the previous reshape flagged, one layer further exposed rather than solved. |
| **The childless ring topic now looks doubly inconsistent** — its own colour and key entry, but leaf-sized (§4, D-2). | The previous spec already flagged this node as visibly lopsided; this spec adds a second, different kind of inconsistency on top of it rather than resolving either. |

---

## Part B - Technical design

### 7. How this fits the existing app

This changes how colour and size are derived, not the pipeline that derives them. It adds no
route, no dependency, no environment variable, no server surface. Every change is either a
rewrite of a small, already-isolated module, or a small edit to a file that already exists:

| File | Change |
| --- | --- |
| `src/lib/graph/palette.ts` | The five-step depth ramp and `radiusForDepth` are removed. Radius becomes a three-way choice — hub, "has children," or leaf — as a function of a node's own shape rather than its depth (§8.4). `MAX_DEPTH` and the depth cap stay, with the docstring's rationale rewritten: the cap is now a readability/authoring limit on its own terms, not a side effect of a five-step colour ramp having five steps (per the intent's constraint). |
| `src/lib/graph/colour.ts` (new) | The colour-assignment algorithm (§8.2): a pure function from the flattened node list to a colour token per node. Framework-agnostic, like the rest of `lib/graph` — no `three`, no CSS, just token names as strings. |
| `src/lib/graph/types.ts` | `GraphNode` gains `hasChildren: boolean` (already known during `flatten`'s walk — `children.length > 0` — and needed to tell a leaf from a branch, which `leafCount` alone can't do: a node with exactly one leaf child and a childless leaf both have a `leafCount` of 1). `GraphSceneNode` gains `colourToken: string`, the resolved CSS custom property name for that node's fill. |
| `src/lib/graph/tree.ts` | The `walk` sets `hasChildren` on each node as it's built. The depth-cap error message's wording changes to match the new rationale in `palette.ts`; the check itself (`depth > MAX_DEPTH`) is unchanged. |
| `src/lib/graph/scene.ts` | `buildScene` calls the new colour assignment alongside `layout`, and reads each node's radius from the new three-way function instead of `radiusForDepth(node.depth)`. |
| `src/app/graph/_components/graph-scene.tsx` | `SCENE_TOKENS` becomes a fixed list (hub + 8 branch + 8 leaf-tint tokens, plus the existing edge/page tokens) instead of one built from `MAX_DEPTH`. `applyTokens` reads `node.colourToken` directly off each node instead of computing `depthToken(node.depth)` — simpler than what it replaces, since the token name is now decided once, at build time, rather than re-derived per frame. |
| `src/app/graph/_components/depth-key.tsx` → `branch-key.tsx` | Renamed and rewritten. Today's `DepthKey` needs no props — it reads a fixed, depth-only array straight from `palette.ts`. The new key's content depends on the actual seed (which ring topics exist and which colour each one was assigned), so it becomes a small presentational component that takes the ring-topic nodes as a prop instead of importing a static list. |
| `src/app/graph/page.tsx` | Passes the ring-topic subset of `scene.nodes` (`depth === 1`) to the renamed key component, in place of today's prop-less `<DepthKey />`. |
| `src/app/globals.css` | The `--graph-depth-0…4` tokens are replaced by `--graph-hub`, `--graph-branch-0…7`, and `--graph-branch-0…7-leaf` (§8.1), declared in all three existing scopes exactly as the depth ramp was. `--graph-edge` and `--graph-label-halo` are unchanged. |
| `src/lib/graph/layout.test.ts`, `tree.test.ts` | **Amended in.** Tests asserting depth-scaled radii or reading `radiusForDepth` move to the new three-way radius rule; a new `colour.test.ts` covers the assignment algorithm (§10). |
| `CLAUDE.md` | The `## Graph data` section's colour/size bullets are rewritten to describe group colour and has-children size in place of the depth ramp and depth-scaled radii; the depth-cap bullet's rationale is updated to match. |

`src/lib/graph/**` stays framework-agnostic and CSS-value-free: `colour.ts` and the rewritten
`palette.ts` hand back token *names*, never hex values — `globals.css` stays the one place a
colour is actually spelled out, exactly as the depth ramp already established. The seed
schema (`schema.ts`) is untouched: colour and size are still never author-supplied, only
derived, which is also what keeps a seed edit from ever being able to inject an arbitrary
colour (§9).

### 8. Design

#### 8.1 Colour: from a five-step ramp to an eight-hue group palette

The current ramp (`--graph-depth-0…4`) is an **ordinal** encoding — one hue, getting lighter
with depth — which is the right `dataviz` pattern for "how deep," but the wrong one for "which
group": ordinal ramps exist to show order, and group membership has none. What this feature
needs is `dataviz`'s **categorical** pattern instead — a fixed set of hues, assigned by
identity, never by rank.

**The eight hues are the `dataviz` skill's own documented default categorical palette**, used
as-is rather than derived from ProductDock's brand:

| Slot | Hue | Light | Dark |
| --- | --- | --- | --- |
| 0 | blue | `#2a78d6` | `#3987e5` |
| 1 | orange | `#eb6834` | `#d95926` |
| 2 | aqua | `#1baf7a` | `#199e70` |
| 3 | yellow | `#eda100` | `#c98500` |
| 4 | magenta | `#e87ba4` | `#d55181` |
| 5 | green | `#008300` | `#008300` |
| 6 | violet | `#4a3aa7` | `#9085e9` |
| 7 | red | `#e34948` | `#e66767` |

This ordering already clears every computable check the skill defines — lightness band,
saturation floor, colour-vision-deficiency separation, and a "tell them apart with full colour
vision too" floor — against background colours close to this app's own (`#fcfcfb`/`#1a1a19`
in the documented instance, versus this app's own `#ffffff`/`#0a0c0e`). **Re-running that
same check against this app's exact background colours, in both modes, is a required
pre-merge gate (V-8)** — the same gate the original ramp went through when it was built (see
`ai-knowledge-graph-3d`'s spec §7.4) — not assumed to still pass just because the generic
instance did. `design-system`'s own two brand accents (blue, orange) are not a substitute:
two hues cannot do an eight-hue identity job, which is exactly why this spec reaches outside
the brand palette at all (§4, D-1; Areas of concern, C-1).

**The leaf tint** is one lighter step of the same hue, not a colour of its own: each of the
eight hues gets one paired "leaf" token (`--graph-branch-N-leaf`), produced by holding that
hue's colour family constant and raising it to the lighter end of the same accessibility band
the base hue sits in — the same relationship the current ramp's own steps already have to
each other, just narrowed to two steps (a group's own colour, and its one shared "nothing
under it" shade) instead of five. Because a shared lightening rule doesn't guarantee the
*result* stays as easy to tell apart as the base hues do, **the eight leaf tints are validated
as their own categorical set, separately from the eight base hues** (V-8) — this is a case the
`dataviz` skill doesn't name directly (its categorical check assumes one flat set of colours
doing an identity job, not a base set and a second, derived set that has to remain legible
both against the page and against its own base colour), so this spec applies the skill's
existing computable checks to a case one level removed from what it documents, rather than
inventing a new check.

**The hub's colour** is not one of the eight, and is not a generic "neutral grey" either — it
reuses the exact principle the original ramp used to make the centre read as the centre: it's
the single **highest-contrast** mark on screen, which in practice means the same near-black /
near-white ink already used for page text (`--text-primary`). A new token, `--graph-hub`,
carries that value so the graph's own token family stays self-contained and auditable, the
same reasoning `--graph-label-halo` already applies by aliasing `--page`.

All new tokens are declared in the three existing scopes (`:root`, the
`prefers-color-scheme: dark` media block, `:root[data-theme="dark"]`), following the
`--graph-depth-*` precedent exactly: not bridged into `@theme inline`, because none of this is
a shadcn slot.

#### 8.2 Assigning a colour to each node

A pure function over the already-flattened, pre-order node list (parents before children,
same order `flatten` already produces):

1. The root gets `--graph-hub`. It plays no further part in hue bookkeeping.
2. Every node that either **has children of its own**, or **is a direct child of the root**
   (a ring topic, whether or not it has children — §4, D-2), gets its own hue: the next hue in
   the fixed eight-hue order that is not already used by its own immediate parent and not
   already used by an earlier sibling under the same parent. (Ring topics are all siblings of
   each other under the root, so this same one rule is what also keeps every ring topic
   mutually distinct — no separate ring-specific rule is needed.)
3. Every other node — one that has no children and whose parent is not the root — takes the
   **leaf-tint token that pairs with its immediate parent's hue.**

This is deterministic and order-stable: the same seed always produces the same assignment,
with no randomness and no dependency on how many nodes exist elsewhere in the tree — adding a
node to one branch cannot change the colour already assigned somewhere else, which is the
same stability property `dataviz`'s "colour follows the entity, never its rank" rule protects,
applied to a hierarchical, colour-*reusing* scheme the skill doesn't model directly (its
categorical pattern assumes a flat set of at most eight series, not eighty groups sharing
eight hues by tree position).

Worked example, from the current seed: `Evals` and `RAG` are siblings under `n Node`, so they
get two different hues, and so does `n Node` itself, distinct from both. `Ragas` and
`DeepEval`, `Evals`'s two "nothing under it" children, both take `Evals`'s leaf tint. `RAG`'s
one child, `Vector db`, itself has children (`pgvector`, `Qdrant`, `S3 vector`) — so it gets
its **own** hue rather than a shade of `RAG`'s, and those three leaves take *its* tint, not
`RAG`'s (FR-3). Under `Protocols`, `MCP` (which has children) gets its own hue distinct from
`Protocols`'s; `A2A` (which has none) takes `Protocols`'s own leaf tint directly, because its
nearest node-with-children is `Protocols` itself.

#### 8.3 Why tree-adjacency is enough to guarantee screen-adjacency

Closing intent open question 2 (§3): "near," for the purpose of §8.2's collision rule, is
defined purely on the tree — parent/child or shared parent — with no separate geometric check.
This is safe because of an invariant the layout already has and already tests for a different
reason: every branch's entire subtree is confined to its own slice of the picture and can
never spread into a sibling branch's slice (`layout.test.ts`, the containment check written
for the ring-readability spec's FR-4). Two nodes that are not tree-adjacent are, by that
invariant, never drawn near each other on screen either — so a purely tree-based rule already
gives the on-screen guarantee the intent asks for, for free, at every depth. The one thing
this argument leans on is that invariant continuing to hold; it is unchanged and untouched by
this spec (§7), so the inference stands, but it hasn't been independently re-confirmed by eye
on the built result (Areas of concern, C-4 — see also C-5's general caution about numbers not
yet looked at).

#### 8.4 Size: from five depth-scaled radii to three

`radiusForDepth(depth)` is replaced by a function of a node's own shape rather than its
position in the tree: the root gets the hub radius, any other node with children gets the one
"has children" radius, and every leaf gets the one leaf radius — three constants total, in
place of today's five-step, monotonically-decreasing array. The two call sites that read a
per-node radius (`scene.ts`'s node mapping, and `layout.ts`'s `sceneRadius`, which needs the
outermost node's radius to size the camera's far plane) are unaffected in shape, only in what
they call. Nothing about `layout.ts`'s geometry — shell distances, cone angles, the golden-
angle spiral — changes; a node's radius has never driven where it sits, only how big it's
drawn once it's there, so this is a like-for-like swap at both call sites.

#### 8.5 The key becomes data-dependent

Today's `DepthKey` is prop-less because a depth-to-colour mapping is a fixed, five-entry
constant, unrelated to any particular seed. Once colour depends on the tree's actual shape,
the key has to be given the seed's actual ring topics and their assigned colours rather than
importing a constant — a small, one-directional change (`page.tsx` already builds the full
`scene` today; it now also passes its ring-topic subset to the renamed key component) rather
than a new data flow.

#### 8.6 What does not change

The camera, `layout.ts`'s geometry, the seed schema, the node and edge counts, the label
layer, and the depth field itself (still computed, still used to find the ring for layout and
camera purposes) are all untouched. Depth stops being *read* for colour or size, but it isn't
removed from the data model — `layout.ts` and `graph-scene.tsx` still need it to find "the
ring" (`depth === 1`) for the layout and camera-fence logic the ring-readability spec built.

### 9. Security

This change touches colour tokens, one new pure algorithm module, and one component's props —
no data flow, no dependency, no environment variable, and no client/server boundary is
affected.

- **No new dependency.** The colour-assignment algorithm is plain TypeScript operating on
  data already produced by `flatten`; nothing new is installed.
- **Colour and size stay strictly derived, never authored.** `schema.ts`'s `.strict()`,
  name-and-children-only shape is unchanged, so a seed edit still cannot smuggle in a colour,
  a size, or any other presentational value — the class of "malformed content becomes an
  unexpected rendering" bug this line of the original spec's security design was written
  against stays closed, and this feature adds nothing to seed-side trust it depends on.
- **The key still renders plain text.** The renamed key component reads node names and colour
  token names, both already-validated, already-slugified-or-schema-bounded strings; nothing
  here introduces a new `innerHTML` path.
- **No CSP impact.** Nothing here adds a font, a worker, or an external fetch.

Everything else in the original spec's security design (§8 of `ai-knowledge-graph-3d`'s
spec.md) continues to apply unchanged.

### 10. Verification

| # | Check | How | Pass |
| --- | --- | --- | --- |
| V-1 | Every node-with-children gets its own colour | Unit test on the colour-assignment function: every node where `hasChildren` is true (or whose parent is the root) is assigned a hue token, never a leaf-tint token | pass |
| V-2 | Every leaf takes its parent's tint | Unit test: every node where `hasChildren` is false and whose parent is not the root is assigned the leaf-tint token that pairs with its immediate parent's hue token | pass |
| V-3 | A node with its own children never inherits a shade | Unit test on the day-one seed: `Vector db`'s hue differs from `RAG`'s, and `pgvector`/`Qdrant`/`S3 vector` take `Vector db`'s tint, not `RAG`'s | pass |
| V-4 | No two tree-adjacent groups share a hue | Unit test, run against both the day-one seed and the wider synthetic seed already used in `layout.test.ts`: for every node with its own hue, that hue differs from its parent's hue (if any) and from every sibling's hue | pass |
| V-5 | Deterministic and stable | Unit test: running assignment twice on the same seed gives identical results; adding a node to one branch of a copy of the seed does not change any other branch's already-assigned hues | pass |
| V-6 | Has-children nodes are bigger than leaves, at every depth | Unit test on the day-one seed and the wider synthetic seed: every node with children has a strictly larger radius than every leaf, regardless of depth | pass |
| V-7 | Every leaf is the same size | Unit test: every leaf node's radius is identical | pass |
| V-8 | Accessibility checks pass against this app's own colours | `dataviz` validator run against the eight base hues (adjacent pairs), the eight leaf tints (adjacent pairs), and the hub colour, in both light (surface `#ffffff`) and dark (surface `#0a0c0e`) mode — the same command shape already used and recorded for the current ramp | no hard failure in either mode; any accepted warning is documented with the required secondary encoding (labels), not silently shipped |
| V-9 | No regression against the recorded accessibility debt | Manual comparison: the least-visible new colour (against the page, in either mode) is at least as visible as the least-visible step of the ramp it replaces | pass, or flagged before merge |
| V-10 | Manual, on the built page, both themes: pick any leaf on the rim and name its group from colour alone | Visual check | pass |
| V-11 | Manual, on the built page, both themes: pick any two differently-sized circles; confirm the bigger one always has children | Visual check | pass |
| V-12 | Manual, on the built page, both themes: confirm no two same-coloured groups are ever visible near each other | Visual check | pass |
| V-13 | No regression on the existing suites | Re-run the `ai-knowledge-graph-3d` and `graph-ring-readability` specs' verification items | all still pass — node/edge/draw-call counts, bundle size, CSP, camera behaviour, and resource disposal are unaffected by this change |

---

## Areas of concern

**C-1 — The eight group colours carry no ProductDock brand approval.** ProductDock's brand
only defines two accent colours; this feature needs eight that can all be told apart, so this
spec borrows a ready-made, already-accessibility-checked set built for exactly this job rather
than inventing six new brand colours. **Resolved here by using that borrowed set as-is** (§4,
D-1; §8.1) — one of the eight is a close cousin of ProductDock's own blue, but the other seven
are not ProductDock colours at all, and they'll be the most visually prominent thing on the
page. **The decision needed from you:** is shipping a non-brand colour set on the flagship
graph page acceptable, or does this need a design/brand review before it ships?

**C-2 — The ring can only ever hold eight top-level topics before two are forced to share a
colour.** Every ring topic needs a colour distinct from every other ring topic, because
they're always visible together, and there are only eight colours in the set this spec uses.
Today there are four topics, comfortably inside that limit, and the key's own design already
anticipates growing to "around six" — still inside it. **Resolved here by shipping the
eight-colour set and not solving for a ninth topic now** (§2.3, §4, D-5). **The decision
needed from you:** accept that a future ninth top-level topic will force two ring topics to
share a colour (breaking the "always tell them apart" promise this whole feature exists to
deliver), or flag now that the colour set needs to be bigger before the tree grows that far.

**C-3 — The one ring topic with nothing under it gets a colour and a key entry like every
other topic, but is still drawn at the small, leaf size.** Colour answers "which group" and
size answers "does it carry anything," and this is the one node in today's tree where those
two questions have different answers. **Resolved here by keeping the two rules strictly
independent, exactly as the intent describes them**, even though the result — a uniquely
coloured key entry pointing at the smallest dot on the ring — reads as inconsistent (§4, D-2).
**The decision needed from you:** accept that inconsistency as a fair reading of the intent's
own rules, or ask for a one-off exception that sizes a childless ring topic like its ring
siblings.

**C-4 — This change must not make the graph's already-recorded accessibility debt worse, and
that has not been independently confirmed against this app's own colours yet.** The riskiest
colours in this design — the eight leaf tints — sit at the rim, exactly where a colour-vision-
deficient viewer or a keyboard/screen-reader user (the subject of the separate, still-open
accessibility work) already struggles most. This spec requires the same computable checks the
current ramp passed to be re-run against this app's own colours before merge (§10, V-8, V-9),
the same gate the current ramp went through when it was built — but as of this document, that
run hasn't happened yet. **No decision needed from you today** — this is flagged so the gate
isn't quietly skipped between now and merge.

**C-5 — Several of this spec's numbers — the exact leaf-tint values, and whether all eight
hues survive validation against this app's own colours — are chosen the same "build it, look
at it, then confirm" way the rest of this graph's tuned values have been, not proven on paper
here.** This mirrors the previous graph spec's own admitted pattern (its Areas of concern,
C-5): a testable rule is specified now (§8.1, §8.2, §10), but the literal colour values behind
it are expected to move once someone has actually run the check and looked at the result.
**The decision needed from you:** treat this spec's colour values as a first attempt due for a
"build it, look at it" pass, not a final palette, the same way the ring layout's tuning
constants were treated.
