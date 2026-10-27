import { z } from "zod";

export const taskSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título").max(160),
    description: z.string().trim().max(2000),
    doneCriteria: z.string().trim().max(500),
    projectId: z.string(),
    goalId: z.string(),
    status: z.enum([
      "backlog",
      "todo",
      "in_progress",
      "blocked",
      "done",
      "canceled",
    ]),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    tag: z.string().trim().max(40),
    startDate: z.union([z.iso.date(), z.literal("")]),
    dueDate: z.union([z.iso.date(), z.literal("")]),
  })
  .refine(
    (value) =>
      !value.startDate || !value.dueDate || value.dueDate >= value.startDate,
    {
      path: ["dueDate"],
      message: "O prazo deve ser igual ou posterior à data de início",
    },
  );

export type TaskFormValues = z.infer<typeof taskSchema>;
