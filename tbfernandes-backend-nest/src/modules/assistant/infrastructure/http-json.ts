/** A provider answered with an HTTP status that is not a success. */
export class ProviderHttpError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
  ) {
    super(`${provider} answered ${status}`);
  }
}

/** POST a JSON body and read a JSON answer, giving up after timeoutMs. */
export async function postJson<T>(
  http: typeof fetch,
  provider: string,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number,
): Promise<T> {
  const response = await http(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new ProviderHttpError(provider, response.status);
  return (await response.json()) as T;
}
