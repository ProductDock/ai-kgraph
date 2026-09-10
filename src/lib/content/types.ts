/**
 * The three SDLC trees this baseline is allowed to read (spec §7.8). All
 * coupling to their on-disk layout lives in this directory.
 */
export type ContentSource = "docs" | "intent" | "skills";

export interface ContentDoc {
  source: ContentSource;
  slug: string;
  /** Path relative to the repository root. */
  path: string;
  content: string;
}
