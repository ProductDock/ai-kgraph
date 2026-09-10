/**
 * Query keys are constructed only through this factory (spec §7.7.2).
 * Ad-hoc string arrays make cache invalidation unreliable in a way that
 * presents as a flaky UI, not as an error. Add a namespace here per
 * feature as consumers are built - none ship with this baseline.
 */
export const queryKeys = {
  all: ["ai-kgraph"] as const,
};
