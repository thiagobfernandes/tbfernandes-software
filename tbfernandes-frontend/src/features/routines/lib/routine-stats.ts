import type { Routine, RoutineCheck } from "@/features/routines/types/routine";
import {
  localDay,
  shiftDay,
  startOfWeek,
} from "@/features/time-tracking/lib/time";
import type { TimeEntry } from "@/features/time-tracking/types/time-entry";

import { weekdayOf } from "./routines";

/**
 * Read-only numbers for the planning, history and analysis views. Everything
 * comes from routines, their day checks and time entries; nothing is invented.
 *
 * Rest days are never failures: a day only counts when the routine was
 * scheduled for it. A paused routine keeps no record of when it was paused,
 * so its schedule is taken to end on its last check: the days after that are
 * not counted against it.
 */

export type DayTally = { due: number; done: number };

/** Days of the routine, indexed for quick lookups. */
export function checkIndex(checks: RoutineCheck[]) {
  const index = new Map<string, Set<string>>();
  for (const check of checks) {
    let days = index.get(check.routineId);
    if (!days) {
      days = new Set();
      index.set(check.routineId, days);
    }
    days.add(check.date);
  }
  return index;
}

export type CheckIndex = ReturnType<typeof checkIndex>;

function lastCheck(routineId: string, index: CheckIndex) {
  let last: string | undefined;
  for (const day of index.get(routineId) ?? []) {
    if (!last || day > last) last = day;
  }
  return last;
}

/**
 * Whether the routine was (or will be) planned for that day. Unlike
 * `isDueOn`, it also answers for the past of a paused routine.
 */
export function scheduledOn(routine: Routine, day: string, index: CheckIndex) {
  if (day < routine.startDate) return false;
  if (!routine.weekdays.includes(weekdayOf(day))) return false;
  if (routine.active) return true;
  const last = lastCheck(routine.id, index);
  return last !== undefined && day <= last;
}

export function checkedOn(routineId: string, day: string, index: CheckIndex) {
  return index.get(routineId)?.has(day) ?? false;
}

/** Inclusive list of days. */
export function daysBetween(from: string, to: string) {
  const days: string[] = [];
  for (let day = from; day <= to && days.length < 800; day = shiftDay(day, 1)) {
    days.push(day);
  }
  return days;
}

/**
 * Scheduled vs done for one routine over [from, to]. Days after `today` are
 * left out and today counts only once checked, since it is not over yet.
 */
export function tally(
  routine: Routine,
  index: CheckIndex,
  from: string,
  to: string,
  today: string,
): DayTally {
  let due = 0;
  let done = 0;
  const end = to < today ? to : today;
  for (const day of daysBetween(from, end)) {
    if (!scheduledOn(routine, day, index)) continue;
    const checked = checkedOn(routine.id, day, index);
    if (day === today && !checked) continue;
    due++;
    if (checked) done++;
  }
  return { due, done };
}

/**
 * Planned vs done for all routines on one day. Rates over a period must
 * skip the unfinished today themselves (see `weekdayRates`).
 */
export function dayTally(
  routines: Routine[],
  index: CheckIndex,
  day: string,
): DayTally {
  let due = 0;
  let done = 0;
  for (const routine of routines) {
    if (!scheduledOn(routine, day, index)) continue;
    due++;
    if (checkedOn(routine.id, day, index)) done++;
  }
  return { due, done };
}

export function rate({ due, done }: DayTally) {
  return due === 0 ? undefined : done / due;
}

export function percent(value: number | undefined) {
  return value === undefined ? "—" : `${Math.round(value * 100)}%`;
}

/** Longest run of scheduled days that were all checked. */
export function bestStreak(routine: Routine, index: CheckIndex, today: string) {
  let best = 0;
  let current = 0;
  for (const day of daysBetween(routine.startDate, today)) {
    if (!scheduledOn(routine, day, index)) continue;
    if (checkedOn(routine.id, day, index)) {
      current++;
      if (current > best) best = current;
    } else if (day !== today) {
      current = 0;
    }
  }
  return best;
}

/** Completion rate by ISO weekday (1 = Monday) over [from, today]. */
export function weekdayRates(
  routines: Routine[],
  index: CheckIndex,
  from: string,
  today: string,
) {
  const tallies = new Map<number, DayTally>(
    [1, 2, 3, 4, 5, 6, 7].map((weekday) => [weekday, { due: 0, done: 0 }]),
  );
  for (const day of daysBetween(from, today)) {
    const result = dayTally(routines, index, day);
    if (day === today) {
      // Today is not over: count only what is already done.
      result.due = result.done;
    }
    const entry = tallies.get(weekdayOf(day))!;
    entry.due += result.due;
    entry.done += result.done;
  }
  return tallies;
}

/** Seconds logged on the routine over [from, to]. */
export function secondsBetween(
  routineId: string,
  entries: TimeEntry[],
  from: string,
  to: string,
  now: Date,
) {
  let seconds = 0;
  for (const entry of entries) {
    if (entry.routineId !== routineId) continue;
    const day = localDay(new Date(entry.startedAt));
    if (day < from || day > to) continue;
    const end = entry.endedAt ? new Date(entry.endedAt) : now;
    seconds += Math.max(
      0,
      Math.floor((end.getTime() - new Date(entry.startedAt).getTime()) / 1000),
    );
  }
  return seconds;
}

/** The 7 days of the week that contains `day` (Monday first). */
export function weekDays(day: string) {
  const first = startOfWeek(day);
  return Array.from({ length: 7 }, (_, offset) => shiftDay(first, offset));
}

/** `YYYY-MM` of a day, shifted by whole months. */
export function shiftMonth(day: string, months: number) {
  const [year, month] = day.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1, 12);
  return localDay(date);
}

/** Weeks (Monday first) covering the month of `day`; days outside are kept. */
export function monthWeeks(day: string) {
  const first = `${day.slice(0, 7)}-01`;
  const last = shiftDay(shiftMonth(first, 1), -1);
  const weeks: string[][] = [];
  for (
    let start = startOfWeek(first);
    start <= last;
    start = shiftDay(start, 7)
  ) {
    weeks.push(weekDays(start));
  }
  return weeks;
}

/** Columns of 7 days (Monday first) ending in the week of `today`. */
export function heatmapWeeks(today: string, weeks: number) {
  const lastStart = startOfWeek(today);
  return Array.from({ length: weeks }, (_, index) =>
    weekDays(shiftDay(lastStart, (index - weeks + 1) * 7)),
  );
}
