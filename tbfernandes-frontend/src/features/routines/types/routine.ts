/** Something done again and again on chosen weekdays (every day by default). */
export type Routine = {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  /** The task this routine moves forward; checking a day does not complete it. */
  taskId?: string;
  /** ISO weekdays: 1 = Monday ... 7 = Sunday. */
  weekdays: number[];
  /** HH:mm (the API also sends seconds). */
  startTime?: string;
  targetMinutes?: number;
  startDate: string;
  active: boolean;
};

/** A routine done on one day; removing it unmarks the day. */
export type RoutineCheck = {
  id: string;
  routineId: string;
  date: string;
  note?: string;
};
