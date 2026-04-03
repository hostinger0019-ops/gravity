/**
 * Shared helper for all GPU backend API calls.
 * Automatically includes X-API-Key header for authentication.
 */

const GPU_URL =
  process.env.GPU_BACKEND_URL ||
  process.env.NEXT_PUBLIC_GPU_BACKEND_URL ||
  "http://localhost:8000";

const GPU_API_KEY = process.env.GPU_API_KEY || "";

/**
 * Fetch wrapper that auto-adds GPU API key and base URL.
 * Usage: gpuFetch("/api/chat/stream", { method: "POST", body: ... })
 */
export async function gpuFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${GPU_URL}${path}`;

  const headers = new Headers(init?.headers);
  if (GPU_API_KEY) {
    headers.set("X-API-Key", GPU_API_KEY);
  }
  if (!headers.has("Content-Type") && init?.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers });
}

/** Get the GPU backend base URL */
export function getGpuUrl(): string {
  return GPU_URL;
}

/** Get headers with API key included */
export function gpuHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(GPU_API_KEY ? { "X-API-Key": GPU_API_KEY } : {}),
    ...extra,
  };
}
