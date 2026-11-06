export function blankToNull(value: string | null | undefined): string | null {
  return value == null || value.trim() === '' ? null : value.trim();
}
