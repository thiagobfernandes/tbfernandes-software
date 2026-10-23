import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  role: z.string().trim().max(120),
  companyId: z.string(),
  companyName: z.string().trim().max(120),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  phone: z.string().trim().max(40),
  profileUrl: z.union([z.literal(""), z.url("Enter a full URL")]),
  nextContact: z.union([z.iso.date(), z.literal("")]),
  specialties: z.array(z.string()),
  context: z.string().trim().max(1000),
  notes: z.string().trim().max(2000),
});

export const interactionSchema = z.object({
  date: z.iso.date("Pick a date"),
  kind: z.enum(["meeting", "call", "message", "event", "referral"]),
  summary: z.string().trim().min(1, "Summarize what happened").max(1000),
  followUp: z.string().trim().max(160),
});
