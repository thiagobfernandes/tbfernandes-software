const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatBRL(value: number) {
  return brl.format(value);
}

/** Compact form for axis labels: R$ 18k. */
export function formatBRLCompact(value: number) {
  return value >= 1000 ? `R$ ${Math.round(value / 100) / 10}k` : `R$ ${value}`;
}

const monthFormat = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10" → "out. de 2026". */
export function formatMonth(month: string) {
  return monthFormat.format(new Date(`${month}-01T00:00:00Z`));
}

/** Adds whole months to a "YYYY-MM" key. */
export function addMonths(month: string, amount: number) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}
