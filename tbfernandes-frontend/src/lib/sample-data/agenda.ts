import type { Appointment } from "@/features/calendar/types/appointment";

export const sampleAppointments: Appointment[] = [
  {
    id: "ap1",
    title: "Investigar alerta de ingestão",
    date: "2026-10-21",
    startTime: "08:00:00",
    endTime: "12:00:00",
    taskId: "t1",
  },
  {
    id: "ap2",
    title: "Modelagem das entidades",
    date: "2026-10-22",
    startTime: "08:00:00",
    endTime: "10:00:00",
    taskId: "t2",
  },
  {
    id: "ap3",
    title: "Revisão do PR de sincronização",
    date: "2026-10-22",
    startTime: "14:00:00",
    endTime: "16:00:00",
    taskId: "t3",
  },
  {
    id: "ap4",
    title: "Reunião de alinhamento",
    date: "2026-10-23",
    startTime: "09:30:00",
    endTime: "10:30:00",
    note: "Pauta: prazos de novembro.",
  },
];
