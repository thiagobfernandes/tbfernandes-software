// Dates are plain ISO days ("2026-10-23") handled in UTC, so rendering
// does not shift by the viewer's time zone.

const DAY_MS = 86_400_000;

export function parseDay(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

export function toDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, amount: number) {
  return toDay(new Date(parseDay(day).getTime() + amount * DAY_MS));
}

export function daysBetween(from: string, to: string) {
  return Math.round(
    (parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS,
  );
}

const shortFormat = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatShort(day: string) {
  return shortFormat.format(parseDay(day));
}

export function weekdayInitial(day: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "narrow",
    timeZone: "UTC",
  }).format(parseDay(day));
}

export function isWeekend(day: string) {
  const weekday = parseDay(day).getUTCDay();
  return weekday === 0 || weekday === 6;
}

/** "Atrasada 2d", "Vence hoje", "Vence amanhã", "Vence em 4d" ou "Vence 30 de out.". */
export function describeDue(dueDate: string, today: string) {
  const diff = daysBetween(today, dueDate);
  if (diff < 0)
    return { label: `Atrasada ${-diff}d`, tone: "overdue" as const };
  if (diff === 0) return { label: "Vence hoje", tone: "soon" as const };
  if (diff === 1) return { label: "Vence amanhã", tone: "soon" as const };
  if (diff <= 7) return { label: `Vence em ${diff}d`, tone: "normal" as const };
  return { label: `Vence ${formatShort(dueDate)}`, tone: "normal" as const };
}
