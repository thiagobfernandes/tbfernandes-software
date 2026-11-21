export type JsonObject = Record<string, unknown>;

export type ResponseBody = JsonObject | string | null;

export async function readResponseBody(
  response: Response,
): Promise<ResponseBody> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as JsonObject;
  } catch {
    return text;
  }
}

export async function readJson<Value>(response: Response): Promise<Value> {
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as Value;
}
