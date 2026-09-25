# Intent: Dark theme as the default

- **Originator:** Nemanja
- **Date:** 2026-09-25
- **Status:** awaiting product owner review

## Problem

I want dark theme to be the default option. The graph looks better dark, and the graph is
the main thing people come to the app for.

Today a first-time visitor who has never touched the theme toggle gets whatever their
operating system is set to. Anyone on a light-mode laptop or tablet opens the graph in
light, and sees the dark version only if they happen to find and click the toggle
[assumed: few first-time visitors do].

## Proposed outcome

- A first-time visitor who has never used the toggle sees the dark theme on every page,
  whatever their operating system is set to.
- Someone who already picked light with the toggle still gets light. Their remembered
  choice is kept.
- The light theme and the toggle stay, fully supported. Anyone can switch to light, and
  that choice is remembered as it is today.
- Check: open the app in a fresh browser profile with the OS set to light mode, and it
  opens in dark.

## Affected users and systems

- **Users / roles:** first-time visitors, and anyone who has never used the toggle,
  including people who cleared their browser data or use a private window
  [assumed]. People who already chose a theme are unaffected.
- **Systems / services:** the site-wide theme setting and the header toggle. The graph
  scene and the Statistics panel follow the theme, so they change with it.
- **Data:** none. The theme choice stays in the visitor's own browser.

## Constraints

- Keep the light theme and the toggle. This is a change of default, not a removal.
- Do not override a choice someone already made with the toggle.
- No flash of the wrong theme while the page loads. [assumed: carried over from what the
  app already guarantees]

## Open questions

- [ ] Should a visitor whose OS is explicitly set to light still get dark on first visit?
  The answer so far is "yes, always dark". Confirm that ignoring the OS setting is
  acceptable. — *owner:* product owner
- [ ] Do the parts of the app beyond the graph (home page, topic pages) look and read as
  well in dark as the graph does? They would now be most visitors' first impression in
  dark. — *owner:* product owner / design
- [ ] Should the toggle offer a way back to "follow my OS" once someone has clicked it, or
  are two states (light, dark) enough? — *owner:* product owner
