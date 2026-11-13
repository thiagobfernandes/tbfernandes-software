import type { Routine } from "@/features/routines/types/routine";
import { timeActions } from "@/features/time-tracking/lib/time-actions";
import { dataActions, workActions } from "@/lib/sample-data/store";

import { checkOn } from "./routines";

export const routineActions = {
  save(routine: Omit<Routine, "id">, id?: string) {
    if (id) {
      dataActions.update("routines", id, routine);
      return;
    }
    dataActions.create("routines", routine);
  },
  /** Marks or unmarks the day; returns whether it ended up done. */
  toggle(routine: Routine, day: string) {
    const existing = checkOn(dataActions.all("routineChecks"), routine.id, day);
    if (existing) {
      dataActions.remove("routineChecks", existing.id);
      return false;
    }
    dataActions.create("routineChecks", { routineId: routine.id, date: day });
    return true;
  },
  setActive(routine: Routine, active: boolean) {
    dataActions.update("routines", routine.id, { active });
  },
  /** Starts the timer on the routine (RN-34: its task and project come along). */
  start(routine: Routine) {
    return timeActions.start({
      description: routine.title,
      projectId: routine.projectId,
      taskId: routine.taskId,
      routineId: routine.id,
    });
  },
  remove: (id: string) => workActions.deleteRoutine(id),
};
