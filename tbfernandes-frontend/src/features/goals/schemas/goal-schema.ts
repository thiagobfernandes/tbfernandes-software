import { z } from "zod";

const optionalNumber = z.number().min(0, "Deve ser zero ou mais").optional();

export const goalSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome").max(160),
    area: z.enum(["career", "finance", "learning", "health", "personal"]),
    status: z.enum(["planned", "active", "paused", "completed"]),
    priority: z.enum(["low", "normal", "high"]),
    dueDate: z.union([z.iso.date(), z.literal("")]),
    parentId: z.string(),
    description: z.string().trim().max(1000),
    currentState: z.string().trim().max(1000),
    desiredResult: z
      .string()
      .trim()
      .min(1, "Descreva o resultado que você quer")
      .max(1000),
    doneCriteria: z.string().trim().max(1000),
    indicatorLabel: z.string().trim().max(80),
    indicatorCurrent: optionalNumber,
    indicatorTarget: optionalNumber,
    indicatorUnit: z.string().trim().max(20),
  })
  .refine((value) => !value.indicatorLabel || value.indicatorTarget, {
    path: ["indicatorTarget"],
    message: "Defina um alvo para o indicador",
  });

export type GoalFormValues = z.infer<typeof goalSchema>;
