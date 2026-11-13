import type { Routine, RoutineCheck } from "@/features/routines/types/routine";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export const sampleRoutines: Routine[] = [
  {
    id: "rt1",
    title: "Revisar alertas da telemetria",
    projectId: "p1",
    taskId: "t1",
    weekdays: [1, 2, 3, 4, 5],
    startTime: "08:30",
    targetMinutes: 15,
    startDate: daysAgo(30),
    active: true,
  },
  {
    id: "rt2",
    title: "Estudar 30 minutos",
    description: "Um tópico por dia da trilha de certificação.",
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    startTime: "07:00",
    targetMinutes: 30,
    startDate: daysAgo(30),
    active: true,
  },
  {
    id: "rt3",
    title: "Planejar o dia seguinte",
    weekdays: [1, 2, 3, 4, 5],
    startTime: "18:00",
    startDate: daysAgo(30),
    active: true,
  },
];

export const sampleRoutineChecks: RoutineCheck[] = [1, 2, 3, 4, 5, 6]
  .map((days) => ({
    id: `rc2-${days}`,
    routineId: "rt2",
    date: daysAgo(days),
  }))
  .concat([{ id: "rc1-0", routineId: "rt1", date: daysAgo(0) }]);
