import { env } from "@/lib/env";

/** Error body returned by the Spring Boot API (RFC 9457 Problem Details). */
export type ProblemDetail = {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetail) {
    super(
      problem.detail ?? problem.title ?? `Request failed (${problem.status})`,
    );
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Id for the record a POST creates (ADR-007). */
  clientId?: string;
};

/** CSRF token the API sets in a cookie when login is on (session mode). */
function csrfToken() {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function apiFetch<T>(
  path: string,
  { body, headers, clientId, ...init }: RequestOptions = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const token = method === "GET" ? undefined : csrfToken();
  const desktopToken = env.desktopToken;
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { "X-XSRF-TOKEN": token }),
      ...(clientId && { "X-Client-Id": clientId }),
      ...(desktopToken && { "X-TBF-Desktop-Token": desktopToken }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const problem: ProblemDetail = await response
      .json()
      .catch(() => ({ status: response.status, title: response.statusText }));
    throw new ApiError({ ...problem, status: response.status });
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
