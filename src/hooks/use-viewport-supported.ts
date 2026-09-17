import { useEffect, useState } from "react";

/**
 * The tablet threshold (spec §7.9). A media query, not user-agent sniffing - the
 * question is how much room there is, and a UA string lies about that and rots.
 */
export const VIEWPORT_QUERY = "(min-width: 768px)";

/** `null` until mounted; see `useWebglSupport` for why. */
export function useViewportSupported(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia(VIEWPORT_QUERY);
    const read = () => setSupported(query.matches);

    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  return supported;
}
