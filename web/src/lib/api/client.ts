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

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiFetch<T>(
  path: string,
  { body, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
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
