import { useCallback, useEffect, useState } from "react";

/**
 * Reads role tokens off `<html>` (spec §7.5). three.js cannot read CSS custom
 * properties, and duplicating the hexes into TypeScript is exactly the "hardcoded
 * colour bypassing the token bridge" the `design-system` skill says to flag - so
 * `globals.css` stays the single source of truth and the scene reads from it.
 *
 * Deliberately not `useUiStore`: that store initialises `theme` to "light"
 * unconditionally and is never hydrated from localStorage or the OS, so it does not
 * describe the DOM (spec C-12). The DOM is the truth; read the DOM.
 */
export function useThemeTokens(
  names: readonly string[],
): Record<string, string> {
  const read = useCallback(() => {
    const styles = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      names.map((name) => [name, styles.getPropertyValue(name).trim()]),
    );
  }, [names]);

  const [tokens, setTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: syncing from an external system (computed CSS), unavailable on the server.
    setTokens(read());

    // Both ways the theme can change: the in-app toggle writes data-theme, and the
    // OS setting moves the media query. Watching only one leaves the scene on the
    // wrong ramp for the rest of the session.
    const observer = new MutationObserver(() => setTokens(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = () => setTokens(read());
    query.addEventListener("change", onSchemeChange);

    return () => {
      observer.disconnect();
      query.removeEventListener("change", onSchemeChange);
    };
  }, [read]);

  return tokens;
}
