import { z } from "zod";

const amount = z.number("Enter an amount").positive("Must be more than zero");

export const entrySchema = z.object({
  kind: z.enum(["income", "expense"]),
  scope: z.enum(["personal", "business"]),
  description: z.string().trim().min(1, "Describe the entry").max(160),
  category: z.string().trim().min(1, "Pick a category").max(60),
  amount,
  date: z.iso.date("Pick a date"),
  recurring: z.boolean(),
});

export const purchaseSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    description: z.string().trim().max(500),
    estimated: amount,
    reserved: z.number().min(0, "Must be zero or more"),
    monthlySaving: z.number().min(0, "Must be zero or more").optional(),
    priority: z.enum(["low", "normal", "high"]),
    desiredDate: z.union([z.iso.date(), z.literal("")]),
    goalId: z.string(),
    status: z.enum(["planned", "saving", "bought"]),
    paid: z.number().min(0).optional(),
  })
  .refine((v) => v.status !== "bought" || v.paid !== undefined, {
    path: ["paid"],
    message: "How much did you pay?",
  });
