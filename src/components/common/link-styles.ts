/**
 * Ink text with a brand-blue underline, collapsing to an ink underline on hover (the
 * design-system skill's one shared link rule). Not the blue `text-primary`: that is
 * 4.26:1 on the dark page, and a link among other text has to clear 4.5:1 - the
 * underline is what tells it apart from the words around it (WCAG 1.4.1).
 *
 * Its own module, with no imports, so the hover card can use it without pulling
 * the markdown pipeline into the scene's client bundle.
 */
export const PROSE_LINK =
  "text-foreground underline decoration-[var(--focus-ring)] underline-offset-4 hover:text-foreground hover:decoration-current";
