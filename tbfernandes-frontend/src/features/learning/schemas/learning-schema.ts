import { z } from "zod";

const optionalDate = z.union([z.iso.date(), z.literal("")]);
const optionalUrl = z.union([z.literal(""), z.url("Enter a full URL")]);

export const studySchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome").max(160),
    status: z.enum(["planned", "in_progress", "paused", "completed"]),
    goalId: z.string(),
    startDate: optionalDate,
    dueDate: optionalDate,
    nextActivity: z.string().trim().max(200),
    description: z.string().trim().max(1000),
    skillIds: z.array(z.string()),
  })
  .refine((v) => !v.startDate || !v.dueDate || v.dueDate >= v.startDate, {
    path: ["dueDate"],
    message: "O prazo deve ser igual ou posterior à data de início",
  });

export const materialSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(200),
  type: z.enum([
    "video",
    "article",
    "book",
    "docs",
    "course",
    "repository",
    "paper",
    "note",
  ]),
  status: z.enum(["to_consume", "in_progress", "consumed", "reviewed"]),
  studyId: z.string(),
  url: optionalUrl,
  notes: z.string().trim().max(1000),
});

export const skillSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(80),
  level: z.enum(["1", "2", "3", "4", "5"]),
  evidence: z.string().trim().max(500),
});

export const certificationSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome").max(160),
    issuer: z.string().trim().min(1, "Informe o emissor").max(120),
    status: z.enum(["planned", "studying", "obtained", "expired"]),
    obtainedAt: optionalDate,
    expiresAt: optionalDate,
    validationUrl: optionalUrl,
    studyIds: z.array(z.string()),
  })
  .refine((v) => v.status !== "obtained" || v.obtainedAt, {
    path: ["obtainedAt"],
    message: "Quando você obteve?",
  });

export const educationSchema = z.object({
  institution: z.string().trim().min(1, "Informe a instituição").max(160),
  course: z.string().trim().min(1, "Informe o curso").max(160),
  degree: z.string().trim().min(1, "Informe o grau").max(80),
  status: z.enum(["in_progress", "completed", "paused"]),
  startDate: z.iso.date("Escolha a data de início"),
  endDate: optionalDate,
});
