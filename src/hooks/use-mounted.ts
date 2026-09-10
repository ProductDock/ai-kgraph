import { useEffect, useState } from "react";

/**
 * True only after the client has mounted. Use to gate rendering that
 * depends on browser-only state (localStorage, window) and would
 * otherwise mismatch between server and client markup.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: this is the mount flag itself, not state synced from an external system.
    setMounted(true);
  }, []);
  return mounted;
}
