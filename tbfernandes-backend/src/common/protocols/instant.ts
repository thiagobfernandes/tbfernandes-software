/** ISO 8601 instant in UTC without empty milliseconds ("2026-10-22T18:00:00Z"), as before. */
export function toInstant(date: Date | null | undefined): string | null {
  return date ? date.toISOString().replace('.000Z', 'Z') : null;
}
