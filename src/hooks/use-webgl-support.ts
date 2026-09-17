import { useEffect, useState } from "react";

/**
 * One probe per page load, cached at module scope: creating a WebGL context is not
 * free, and the answer cannot change between two components asking.
 */
let cached: boolean | undefined;

function probe(): boolean {
  if (cached !== undefined) return cached;

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    // Hand the context straight back. A probe that keeps one alive spends one of
    // the handful of contexts a browser will give a document.
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    cached = context !== null;
  } catch {
    cached = false;
  }
  return cached;
}

/**
 * `null` until mounted - whether this machine can draw the scene is not knowable
 * during server rendering, and guessing produces a hydration mismatch (spec §7.9).
 */
export function useWebglSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: the probe is a browser capability read, impossible before mount.
    setSupported(probe());
  }, []);

  return supported;
}
