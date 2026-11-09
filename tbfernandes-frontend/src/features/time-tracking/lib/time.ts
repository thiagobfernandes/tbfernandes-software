import type { TimeEntry } from "@/features/time-tracking/types/time-entry";

const pad = (value: number) => String(value).padStart(2, "0");

export function localDay(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocal(day: string, time: string) {
  return new Date(`${day}T${time.length === 5 ? `${time}:00` : time}`);
}

export function shiftDay(day: string, days: number) {
  const date = fromLocal(day, "12:00");
  date.setDate(date.getDate() + days);
  return localDay(date);
}

export function entrySeconds(entry: TimeEntry, now: Date) {
  const end = entry.endedAt ? new Date(entry.endedAt) : now;
  return Math.max(
    0,
    Math.floor((end.getTime() - new Date(entry.startedAt).getTime()) / 1000),
  );
}

export function totalSeconds(entries: TimeEntry[], now: Date) {
  return entries.reduce((sum, entry) => sum + entrySeconds(entry, now), 0);
}

export function formatClock(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds % 60)}`;
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}min`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${pad(minutes)}min`;
}

export function hoursValue(seconds: number) {
  return (seconds / 3600).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function entriesOnDay(entries: TimeEntry[], day: string) {
  return entries
    .filter((entry) => localDay(new Date(entry.startedAt)) === day)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function startOfWeek(day: string) {
  const date = fromLocal(day, "12:00");
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return localDay(date);
}

export function entriesInWeek(entries: TimeEntry[], day: string) {
  const first = startOfWeek(day);
  const last = shiftDay(first, 6);
  return entries.filter((entry) => {
    const entryDay = localDay(new Date(entry.startedAt));
    return entryDay >= first && entryDay <= last;
  });
}

export function runningEntry(entries: TimeEntry[]) {
  return entries.find((entry) => !entry.endedAt);
}
