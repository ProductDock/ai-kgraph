import { create } from "zustand";

const STORAGE_KEY = "graph-stats-collapsed";

// Client UI state only - whether the stats panel is folded away, never the numbers
// it shows (those arrive with the scene, at build time).
interface GraphStatsStore {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

/**
 * Read once, when the module loads. Only `"true"` counts as collapsed, so a missing,
 * cleared or garbled key opens the panel - the default the spec asks for. The module
 * is imported only from the `ssr: false` scene, and the `typeof window` guard keeps a
 * stray server import harmless.
 */
function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // Storage may be unavailable (private browsing) - start open.
    return false;
  }
}

export const useGraphStatsStore = create<GraphStatsStore>((set) => ({
  collapsed: readCollapsed(),
  setCollapsed: (collapsed) => {
    set({ collapsed });
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Storage may be unavailable - the choice still holds for this load.
    }
  },
}));
