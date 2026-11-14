export class RoutineResponse {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  taskId: string | null;
  goalId: string | null;
  weekdays: number[];
  startTime: string | null;
  targetMinutes: number | null;
  startDate: string;
  active: boolean;
}

export class RoutineCheckResponse {
  id: string;
  routineId: string;
  date: string;
  note: string | null;
}
