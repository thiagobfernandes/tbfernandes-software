import { z } from "zod";

export const projectSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    companyId: z.string(),
    goalId: z.string(),
    category: z.enum(["professional", "personal", "study", "research"]),
    status: z.enum(["planned", "active", "paused", "completed"]),
    color: z.enum(["teal", "violet", "amber", "rose", "sky"]),
    startDate: z.iso.date("Pick a start date"),
    dueDate: z.union([z.iso.date(), z.literal("")]),
    nextDelivery: z.string().trim().max(120),
    description: z.string().trim().max(1000),
  })
  .refine((value) => !value.dueDate || value.dueDate >= value.startDate, {
    path: ["dueDate"],
    message: "Due date must be on or after the start date",
  });

export type ProjectFormValues = z.infer<typeof projectSchema>;
