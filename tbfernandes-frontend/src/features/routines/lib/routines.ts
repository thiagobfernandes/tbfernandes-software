import type { Routine, RoutineCheck } from "@/features/routines/types/routine";
import {
  entriesOnDay,
  fromLocal,
  shiftDay,
  totalSeconds,
} from "@/features/time-tracking/lib/time";
import type { TimeEntry } from "@/features/time-tracking/types/time-entry";

export const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

export const weekdayLabels: Record<number, string> = {
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
  7: "Dom",
};

export function weekdayOf(day: string) {
  const sundayFirst = fromLocal(day, "12:00").getDay();
  return sundayFirst === 0 ? 7 : sundayFirst;
}

/** RN-32: active, already started and scheduled for that weekday. */
export function isDueOn(routine: Routine, day: string) {
  return (
    routine.active &&
    day >= routine.startDate &&
    routine.weekdays.includes(weekdayOf(day))
  );
}

export function frequencyLabel(weekdays: number[]) {
  const sorted = [...weekdays].sort((first, second) => first - second);
  if (sorted.length === 7) return "Todo dia";
  if (sorted.join() === "1,2,3,4,5") return "Dias úteis";
  if (sorted.join() === "6,7") return "Fins de semana";
  return sorted.map((day) => weekdayLabels[day]).join(", ");
}

export function shortTime(time?: string) {
  return time ? time.slice(0, 5) : undefined;
}

export function checkOn(
  checks: RoutineCheck[],
  routineId: string,
  day: string,
) {
  return checks.find(
    (check) => check.routineId === routineId && check.date === day,
  );
}

/** Due routines of the day, by time (no time last) and title. */
export function routinesDueOn(routines: Routine[], day: string) {
  return routines
    .filter((routine) => isDueOn(routine, day))
    .sort(
      (first, second) =>
        (shortTime(first.startTime) ?? "99").localeCompare(
          shortTime(second.startTime) ?? "99",
        ) || first.title.localeCompare(second.title),
    );
}

/**
 * Due days in a row that were checked, counting back from today. Today only
 * breaks the streak once it is over, so an unchecked today does not reset it.
 */
export function streak(
  routine: Routine,
  checks: RoutineCheck[],
  today: string,
) {
  const checkedDays = new Set(
    checks
      .filter((check) => check.routineId === routine.id)
      .map((check) => check.date),
  );
  let count = 0;
  let day = checkedDays.has(today) ? today : shiftDay(today, -1);
  for (let guard = 0; guard < 366 && day >= routine.startDate; guard++) {
    if (isDueOn(routine, day)) {
      if (!checkedDays.has(day)) break;
      count++;
    }
    day = shiftDay(day, -1);
  }
  return count;
}

/** RN-34: time entries linked to the routine on that day. */
export function routineSeconds(
  routineId: string,
  entries: TimeEntry[],
  day: string,
  now: Date,
) {
  return totalSeconds(
    entriesOnDay(entries, day).filter((entry) => entry.routineId === routineId),
    now,
  );
}
