import { z } from "zod";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const routineSchema = z.object({
  title: z.string().trim().min(1, "Dê um nome para a rotina").max(200),
  description: z.string().trim().max(2000),
  weekdays: z.array(z.string()).min(1, "Escolha pelo menos um dia da semana"),
  startTime: z
    .string()
    .refine((value) => value === "" || TIME.test(value), "Use o formato HH:mm"),
  targetMinutes: z
    .number("Informe um número")
    .int("Use minutos inteiros")
    .min(1, "De 1 a 1440 minutos")
    .max(1440, "De 1 a 1440 minutos")
    .optional(),
  startDate: z.iso.date("Escolha uma data"),
  projectId: z.string(),
  taskId: z.string(),
  goalId: z.string(),
  active: z.boolean(),
});

export type RoutineFormValues = z.input<typeof routineSchema>;
