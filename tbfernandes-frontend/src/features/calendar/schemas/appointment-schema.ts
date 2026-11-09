import { z } from "zod";

import { timeToMinutes } from "@/features/calendar/lib/time";

const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const DURATION = /^\d{1,2}:[0-5]\d$/;

export const entryModes = ["range", "duration"] as const;
export type EntryMode = (typeof entryModes)[number];

export function durationToMinutes(duration: string) {
  const [hours = "0", minutes = "0"] = duration.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export const appointmentSchema = z
  .object({
    taskId: z.string(),
    title: z.string().trim().max(200),
    date: z.iso.date("Escolha uma data"),
    mode: z.enum(entryModes),
    startTime: z.string().regex(TIME, "Use o formato HH:mm:ss"),
    endTime: z.string(),
    duration: z.string(),
    note: z.string().trim().max(2000),
  })
  .superRefine((values, context) => {
    if (values.mode === "range") {
      if (!TIME.test(values.endTime)) {
        context.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "Use o formato HH:mm:ss",
        });
      } else if (
        TIME.test(values.startTime) &&
        timeToMinutes(values.endTime) <= timeToMinutes(values.startTime)
      ) {
        context.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "O fim precisa ser depois do início",
        });
      }
      return;
    }
    if (
      !DURATION.test(values.duration) ||
      durationToMinutes(values.duration) <= 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["duration"],
        message: "Informe a duração como H:mm, por exemplo 1:30",
      });
    } else if (
      TIME.test(values.startTime) &&
      timeToMinutes(values.startTime) + durationToMinutes(values.duration) >
        1439
    ) {
      context.addIssue({
        code: "custom",
        path: ["duration"],
        message: "O agendamento precisa terminar no mesmo dia",
      });
    }
  });

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
