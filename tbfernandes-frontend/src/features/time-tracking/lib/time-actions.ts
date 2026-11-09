import type { TimeEntry } from "@/features/time-tracking/types/time-entry";
import { dataActions } from "@/lib/sample-data/store";

import { runningEntry } from "./time";

type Activity = Pick<TimeEntry, "description" | "projectId" | "taskId">;

function currentRunning() {
  return runningEntry(dataActions.all("timeEntries"));
}

export const timeActions = {
  start(activity: Activity) {
    const now = new Date().toISOString();
    const running = currentRunning();
    if (running)
      dataActions.update("timeEntries", running.id, { endedAt: now });
    return dataActions.create("timeEntries", {
      description: activity.description.trim(),
      projectId: activity.projectId,
      taskId: activity.taskId,
      startedAt: now,
    });
  },
  stop() {
    const running = currentRunning();
    if (!running) return undefined;
    dataActions.update("timeEntries", running.id, {
      endedAt: new Date().toISOString(),
    });
    return running;
  },
  resume(entry: TimeEntry) {
    return timeActions.start(entry);
  },
  save(entry: Omit<TimeEntry, "id">, id?: string) {
    if (id) {
      dataActions.update("timeEntries", id, entry);
      return;
    }
    dataActions.create("timeEntries", entry);
  },
  remove: (id: string) => dataActions.remove("timeEntries", id),
};
