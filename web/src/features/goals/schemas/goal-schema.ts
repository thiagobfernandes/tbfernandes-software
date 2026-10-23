import { z } from "zod";

const optionalNumber = z.number().min(0, "Must be zero or more").optional();

export const goalSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
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
      .min(1, "Describe the result you want")
      .max(1000),
    doneCriteria: z.string().trim().max(1000),
    indicatorLabel: z.string().trim().max(80),
    indicatorCurrent: optionalNumber,
    indicatorTarget: optionalNumber,
    indicatorUnit: z.string().trim().max(20),
  })
  .refine((value) => !value.indicatorLabel || value.indicatorTarget, {
    path: ["indicatorTarget"],
    message: "Set a target for the indicator",
  });

export type GoalFormValues = z.infer<typeof goalSchema>;
