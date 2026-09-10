import { create } from "zustand";

type Theme = "light" | "dark";

// Client UI state only (spec §7.7.2) - never a copy of server data.
interface UiStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  theme: "light",
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Storage may be unavailable (private browsing) - theme still applies for this load.
    }
  },
}));
