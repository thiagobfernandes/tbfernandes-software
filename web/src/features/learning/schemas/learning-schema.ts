import { z } from "zod";

const optionalDate = z.union([z.iso.date(), z.literal("")]);
const optionalUrl = z.union([z.literal(""), z.url("Enter a full URL")]);

export const studySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
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
    message: "Due date must be on or after the start date",
  });

export const materialSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
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
  name: z.string().trim().min(1, "Name is required").max(80),
  level: z.enum(["1", "2", "3", "4", "5"]),
  evidence: z.string().trim().max(500),
});

export const certificationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    issuer: z.string().trim().min(1, "Issuer is required").max(120),
    status: z.enum(["planned", "studying", "obtained", "expired"]),
    obtainedAt: optionalDate,
    expiresAt: optionalDate,
    validationUrl: optionalUrl,
    studyIds: z.array(z.string()),
  })
  .refine((v) => v.status !== "obtained" || v.obtainedAt, {
    path: ["obtainedAt"],
    message: "When did you obtain it?",
  });

export const educationSchema = z.object({
  institution: z.string().trim().min(1, "Institution is required").max(160),
  course: z.string().trim().min(1, "Course is required").max(160),
  degree: z.string().trim().min(1, "Degree is required").max(80),
  status: z.enum(["in_progress", "completed", "paused"]),
  startDate: z.iso.date("Pick a start date"),
  endDate: optionalDate,
});
