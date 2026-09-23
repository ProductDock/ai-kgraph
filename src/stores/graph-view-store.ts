import { create } from "zustand";
import type { Vec3 } from "@/lib/graph/types";

/**
 * The camera the viewer left `/graph` with, so Back returns to the same view
 * (node-content-pages FR-2). Client UI state (CLAUDE.md's state table): it describes
 * what the viewer was looking at, never a copy of server data.
 *
 * Leaving `/graph` unmounts the scene, so without this Back would replay the intro
 * into the overview. The view is saved when "Open page" is clicked and restored
 * **only** when `/graph` is re-entered by history traversal - "Back to AI Learning
 * Graph" is a link, not history, and it still opens the overview.
 *
 * In memory only: a full reload, or a Back the browser serves as a hard load, gets
 * the overview (plan R-5).
 */
export interface GraphViewSnapshot {
  position: Vec3;
  target: Vec3;
  focusedId: string | null;
}

interface GraphViewStore {
  snapshot: GraphViewSnapshot | null;
  /** The last navigation onto `/graph` was Back/Forward, not a link. */
  arrivedByHistory: boolean;
  save: (snapshot: GraphViewSnapshot) => void;
  /**
   * The snapshot to restore on this mount, or `null`. Clears both fields, so a
   * view is restored at most once and never leaks into a later link navigation.
   */
  take: () => GraphViewSnapshot | null;
}

export const useGraphViewStore = create<GraphViewStore>((set, get) => ({
  snapshot: null,
  arrivedByHistory: false,
  save: (snapshot) => set({ snapshot }),
  take: () => {
    const { snapshot, arrivedByHistory } = get();
    // Cleared after this task rather than now. In development React's Strict Mode
    // mounts, unmounts and re-mounts the scene's effect synchronously, and a take
    // that cleared at once would restore the view into the mount that is thrown
    // away and hand the one that stays nothing.
    setTimeout(() => set({ snapshot: null, arrivedByHistory: false }), 0);
    return arrivedByHistory ? snapshot : null;
  },
}));

/*
 * One listener per page load, registered when this module first evaluates and never
 * removed: it has to have seen the `popstate` that brings the viewer back *before*
 * the scene mounts to ask, so it lives as long as the page, not as long as any
 * component. The module is only imported by the `ssr: false` scene, so it only ever
 * evaluates in the browser; the guard keeps a server import harmless regardless.
 */
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    useGraphViewStore.setState({
      arrivedByHistory: window.location.pathname === "/graph",
    });
  });
}
