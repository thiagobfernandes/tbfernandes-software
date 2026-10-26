/**
 * Time-ordered UUID (version 7, RFC 9562), the same kind the API generates.
 * Used as the id of records created in the browser (ADR-007), so the id is
 * known before the API answers.
 */
export function uuidv7() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const millis = Date.now();
  for (let i = 0; i < 6; i++) {
    bytes[i] = Math.floor(millis / 2 ** (8 * (5 - i))) & 0xff;
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10).join(""),
  ].join("-");
}

/** Same namespace as api/scripts/dev-seed, so sample records map to the seeded ones. */
const LEGACY_NAMESPACE = "6f1c2b8e-0000-4000-8000-746266000000";

/** Name-based UUID (version 5, RFC 9562): the same input always gives the same id. */
export async function uuidv5(name: string, namespace = LEGACY_NAMESPACE) {
  const ns = namespace
    .replace(/-/g, "")
    .match(/../g)!
    .map((pair) => parseInt(pair, 16));
  const input = new Uint8Array([...ns, ...new TextEncoder().encode(name)]);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", input));
  const bytes = hash.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
