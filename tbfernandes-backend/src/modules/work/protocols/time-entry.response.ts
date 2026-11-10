export class TimeEntryResponse {
  id: string;
  description: string;
  projectId: string | null;
  taskId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  note: string | null;
}
