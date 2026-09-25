import { beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_SCRIPT } from "@/lib/theme-script";

// Executes the exact string layout.tsx inlines into <head>, not a re-implementation
// of it — a syntax error or a throw outside the `try` would otherwise pass here and
// silently fall back to OS-driven theming in the browser.
const run = () => new Function(THEME_SCRIPT)();
const theme = () => document.documentElement.getAttribute("data-theme");

describe("THEME_SCRIPT", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("defaults to dark when nothing is stored, without consulting the OS", () => {
    const matchMedia = vi.fn(() => ({ matches: false }) as MediaQueryList);
    vi.stubGlobal("matchMedia", matchMedia);
    try {
      run();
    } finally {
      vi.unstubAllGlobals();
    }
    expect(theme()).toBe("dark");
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it("keeps a stored light choice", () => {
    localStorage.setItem("theme", "light");
    run();
    expect(theme()).toBe("light");
  });

  it("keeps a stored dark choice", () => {
    localStorage.setItem("theme", "dark");
    run();
    expect(theme()).toBe("dark");
  });

  it.each(["blue", "", '"dark"', "Light"])(
    "treats a stored %j as no choice and defaults to dark",
    (junk) => {
      localStorage.setItem("theme", junk);
      run();
      expect(theme()).toBe("dark");
    },
  );

  it("never records the default as a choice", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    run();
    expect(localStorage.getItem("theme")).toBeNull();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("still sets dark when reading storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(run).not.toThrow();
    expect(theme()).toBe("dark");
  });
});
