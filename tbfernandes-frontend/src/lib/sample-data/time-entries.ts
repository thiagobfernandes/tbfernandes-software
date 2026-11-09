import type { TimeEntry } from "@/features/time-tracking/types/time-entry";

function todayAt(hours: number, minutes = 0, daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export const sampleTimeEntries: TimeEntry[] = [
  {
    id: "te1",
    description: "Investigar alerta de ingestão",
    projectId: "p1",
    taskId: "t1",
    startedAt: todayAt(8, 30),
    endedAt: todayAt(10, 15),
  },
  {
    id: "te2",
    description: "Reunião de alinhamento",
    startedAt: todayAt(10, 30),
    endedAt: todayAt(11, 0),
    note: "Prazos de novembro.",
  },
  {
    id: "te3",
    description: "Modelagem das entidades",
    projectId: "p2",
    taskId: "t2",
    startedAt: todayAt(9, 0, 1),
    endedAt: todayAt(12, 0, 1),
  },
  {
    id: "te4",
    description: "Revisão do PR de sincronização",
    projectId: "p1",
    taskId: "t3",
    startedAt: todayAt(14, 0, 1),
    endedAt: todayAt(16, 30, 1),
  },
];
