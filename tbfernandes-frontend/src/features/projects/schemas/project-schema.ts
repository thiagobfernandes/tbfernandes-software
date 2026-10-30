import { z } from "zod";

export const projectSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome").max(120),
    companyId: z.string(),
    goalId: z.string(),
    category: z.enum(["professional", "personal", "study", "research"]),
    status: z.enum(["planned", "active", "paused", "completed"]),
    color: z.enum(["teal", "violet", "amber", "rose", "sky"]),
    startDate: z.iso.date("Escolha a data de início"),
    dueDate: z.union([z.iso.date(), z.literal("")]),
    nextDelivery: z.string().trim().max(120),
    description: z.string().trim().max(1000),
  })
  .refine((value) => !value.dueDate || value.dueDate >= value.startDate, {
    path: ["dueDate"],
    message: "O prazo deve ser igual ou posterior à data de início",
  });

export type ProjectFormValues = z.infer<typeof projectSchema>;
