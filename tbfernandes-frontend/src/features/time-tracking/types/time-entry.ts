export type TimeEntry = {
  id: string;
  description: string;
  projectId?: string;
  taskId?: string;
  routineId?: string;
  startedAt: string;
  endedAt?: string;
  note?: string;
};
