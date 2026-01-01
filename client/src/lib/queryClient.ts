import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { logError, logWarning } from "@/lib/error-log";

const DEFAULT_TIMEOUT_MS = 8000;
const RETRY_DELAYS_MS = [300, 900];

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(
  input: RequestInfo,
  init: RequestInit & { timeoutMs?: number; retries?: number } = {}
) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = RETRY_DELAYS_MS.length, ...options } = init;
  let lastError: unknown;

  const setTimer = typeof window === "undefined" ? setTimeout : window.setTimeout;
  const clearTimer = typeof window === "undefined" ? clearTimeout : window.clearTimeout;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimer(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, { ...options, signal: controller.signal });
      clearTimer(timeout);
      return response;
    } catch (error) {
      clearTimer(timeout);
      lastError = error;
      if (attempt < retries) {
        await delay(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]);
        continue;
      }
    }
  }

  throw lastError ?? new Error("Request failed.");
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetchWithRetry(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    logError("Network request failed.", error, { method, url });
    throw new Error("Service unavailable. Please retry in a moment.");
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    let res: Response;
    try {
      res = await fetchWithRetry(url, {
        credentials: "include",
      });
    } catch (error) {
      logWarning("Query request failed, using fallback data.", error, { url });
      throw new Error("Network request failed.");
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
