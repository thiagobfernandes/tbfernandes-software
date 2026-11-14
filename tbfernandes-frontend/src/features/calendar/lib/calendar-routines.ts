import { MINUTES_PER_DAY, timeToMinutes } from "@/features/calendar/lib/time";
import { routinesDueOn } from "@/features/routines/lib/routines";
import type { Routine, RoutineCheck } from "@/features/routines/types/routine";

/** Block length for a routine with a start time but no time target. */
export const DEFAULT_ROUTINE_MINUTES = 30;

/** One occurrence of a routine on a calendar day. */
export type RoutineSlot = {
  key: string;
  routine: Routine;
  day: string;
  /** Null when the routine has no start time (shown above the grid). */
  startMinutes: number | null;
  endMinutes: number | null;
  done: boolean;
};

/**
 * Occurrences of the routines on the given days (RN-32: active, started, on one
 * of its weekdays). With a start time, the block ends after the time target
 * (targetMinutes), or DEFAULT_ROUTINE_MINUTES without one, never past midnight.
 */
export function routineSlots(
  routines: Routine[],
  checks: RoutineCheck[],
  days: string[],
): RoutineSlot[] {
  const checked = new Set(
    checks.map((check) => `${check.routineId}:${check.date}`),
  );
  return days.flatMap((day) =>
    routinesDueOn(routines, day).map((routine) => {
      const startMinutes = routine.startTime
        ? timeToMinutes(routine.startTime)
        : null;
      const endMinutes =
        startMinutes === null
          ? null
          : Math.min(
              startMinutes + (routine.targetMinutes ?? DEFAULT_ROUTINE_MINUTES),
              MINUTES_PER_DAY,
            );
      return {
        key: `${routine.id}:${day}`,
        routine,
        day,
        startMinutes,
        endMinutes,
        done: checked.has(`${routine.id}:${day}`),
      };
    }),
  );
}

export type Lane = { lane: number; lanes: number };

/**
 * Side-by-side columns for overlapping blocks of one day: each block gets the
 * first free lane, and every block of an overlapping cluster shares its width.
 */
export function layoutLanes<T extends { start: number; end: number }>(
  items: T[],
): Map<T, Lane> {
  const result = new Map<T, Lane>();
  const sorted = [...items].sort(
    (first, second) => first.start - second.start || second.end - first.end,
  );
  let cluster: T[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    for (const item of cluster)
      result.set(item, { ...result.get(item)!, lanes: laneEnds.length });
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd) closeCluster();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.end;
    result.set(item, { lane, lanes: 1 });
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  closeCluster();
  return result;
}
