import { clientEnv } from "@/lib/env";
import { ApiError } from "@/lib/api/errors";

const DEFAULT_TIMEOUT_MS = 10_000;

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

// Typed fetch wrapper: resolves against the app's base URL, applies a
// timeout, and normalises failures into ApiError. No consumer ships with
// this baseline - it establishes the seam client-side server-state fetches
// (React Query) will call into.
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;
  const url = new URL(path, clientEnv.NEXT_PUBLIC_APP_URL).toString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0,
      url,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      url,
    );
  }

  return (await response.json()) as T;
}
