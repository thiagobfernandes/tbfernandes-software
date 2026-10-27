import { z } from "zod";

const amount = z.number("Informe um valor").positive("Deve ser maior que zero");

export const entrySchema = z.object({
  kind: z.enum(["income", "expense"]),
  scope: z.enum(["personal", "business"]),
  description: z.string().trim().min(1, "Descreva o lançamento").max(160),
  category: z.string().trim().min(1, "Escolha uma categoria").max(60),
  amount,
  date: z.iso.date("Escolha uma data"),
  recurring: z.boolean(),
});

export const purchaseSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome").max(120),
    description: z.string().trim().max(500),
    estimated: amount,
    reserved: z.number().min(0, "Deve ser zero ou mais"),
    monthlySaving: z.number().min(0, "Deve ser zero ou mais").optional(),
    priority: z.enum(["low", "normal", "high"]),
    desiredDate: z.union([z.iso.date(), z.literal("")]),
    goalId: z.string(),
    status: z.enum(["planned", "saving", "bought"]),
    paid: z.number().min(0).optional(),
  })
  .refine((v) => v.status !== "bought" || v.paid !== undefined, {
    path: ["paid"],
    message: "Quanto você pagou?",
  });
