# Intent: Make the 3D graph readable — a hub, a ring, and a camera that stays put

- **Originator:** Nemanja (nemanja.vasic@productdock.com)
- **Date:** 2026-09-17
- **Status:** awaiting product owner review

## Problem

The graph at `/graph` shipped and does everything the first intent asked for — it is 3D,
it is a tree, depth is coloured, labels fade, you can orbit and zoom and click to fly. I
opened it and it is simply not readable.

Concretely, what I saw. The whole thing read as a thin stringy web rather than as a hub
with clusters hanging off it — I could not see where one branch ended and the next began,
which is the one thing the picture is supposed to tell me. Labels sat on top of each
other and on top of the nodes. Long titles ran across the scene. And because the camera
could go anywhere, I could fly into the middle of it and lose track of where I was, with
no sense of which way was back.

That last part matters more than it sounds: the first version let the camera move freely
in three dimensions, and freedom turned out to be the problem, not the feature. There is
nothing to hold on to.

[assumed] Nobody else on the team has opened it yet — it only exists on `localhost`, so
"what people do today instead" is still: nothing.

**What prompted this intent is that we built it before writing it.** Rather than argue
about readability on paper, we built a working version on a branch and I looked at it in
the real UI. Everything under *Proposed outcome* is something I have now actually seen on
screen, not something I am imagining. That is a deliberate inversion of the usual order,
and it is recorded here so the spec does not have to guess what I meant.

## Proposed outcome

I open `/graph` and the picture explains itself.

Observably:

- **One circle in the middle saying `PD AI`.** Not a dot with a caption next to it — a
  circle with the name inside it. It is the thing everything else hangs off, and it
  should look like it.
- **A wider gap, then a ring around it**, holding the broad topics we already have. The
  gap is what makes the middle read as the middle.
- **Each topic's branches grow outward from the ring, away from the centre**, so a
  cluster is a shape with edges I can see. I can tell which areas are dense and which are
  thin without being told.
- **The camera only moves around that ring, not everywhere.** I can turn the whole thing
  and come in closer, but I cannot fly into it and get lost, and I cannot end up
  underneath it looking at the back of everything.
- **It opens on a view that already reads.** Not looking straight down an axis, where
  topics line up behind each other — slightly off to one side and tilted, so every
  cluster gets its own part of the screen.
- **Labels are small, and long ones are cut off with three dots.** A label tells me which
  node I am looking at; it is not where I read the whole title.
- **Clicking a node positions the camera so I can see all of that node's edges** — what
  it hangs off, and everything hanging off it.

## Affected users and systems

- **Users / roles:** me and my team at ProductDock. Same people as the first intent —
  this changes nothing about who it is for, only whether they can read it.
- **Systems / services:** the `/graph` route in the `ai-kgraph` app. The layout, the
  camera and the labels. The graph data is still a static seed file in the repo; nothing
  about the content model changes.
- **Data:** none sensitive. Topic names only, as before.

## Constraints

- **It stays 3D.** This is not a retreat to a flat diagram. The point of the change is
  that the 3D has structure, not that there is less of it.
- **It stays a strict tree**, one static seed file, no backend — everything the first
  intent fixed about the data still holds.
- **The camera is deliberately restricted.** Free movement is being given up on purpose,
  because it is what made the scene easy to get lost in. Recorded here as a decision, not
  as a limitation to be designed around.
- **Clicking is spent on the camera, again.** The first intent already noted that click
  is used for camera focus and the deferred node popup will need a different gesture.
  That is still true and this intent does not change it.
- **Reading a node's full title is a separate piece of work.** Labels truncate here on
  the understanding that clicking a node to see its full text comes later. Not designed
  or built now.
- The existing app baseline applies unchanged — `CLAUDE.md`'s directory, state and
  environment rules.
- No deadline.

## Open questions

- [ ] The root now reads `PD AI`. Is that its real name, or a placeholder like `n Node`?
      It is currently a content change in the seed file. — *owner: Nemanja*
- [ ] How wide should a label be allowed to get before it truncates? It is currently a
      fixed width that looked right on a desktop; nobody has checked it on a tablet. —
      *owner: Nemanja, at design*
- [ ] The topics are evenly spaced on the ring, so a branch holding half the content gets
      the same arc as one holding a single node. Is even spacing right, or should a
      bigger branch get more room? — *owner: Nemanja*
- [ ] One of the four ring topics has nothing hanging off it, which makes the ring look
      lopsided. Is that a content gap to fill or a layout case to handle? — *owner:
      Nemanja*
- [ ] What should happen on a tablet, where the ring is the same size but the screen is
      much smaller? Nobody has opened this on one yet. — *owner: unassigned*
- [ ] The two `n Node` placeholders and the four note-style labels from the first intent
      are still unnamed, and they are still what a newcomer would read first. — *owner:
      Nemanja*
