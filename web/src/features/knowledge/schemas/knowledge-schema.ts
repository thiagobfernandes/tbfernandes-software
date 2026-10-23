import { z } from "zod";

import { snippetLanguages } from "@/features/knowledge/types/knowledge";

const links = {
  tags: z.array(z.string()),
  projectIds: z.array(z.string()),
  taskIds: z.array(z.string()),
};

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  body: z.string().max(20000),
  ...links,
});

export const snippetSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  language: z.enum(snippetLanguages),
  code: z.string().min(1, "Paste the code").max(20000),
  explanation: z.string().trim().max(2000),
  sourceUrl: z.union([z.literal(""), z.url("Enter a full URL")]),
  ...links,
});

export type NoteFormValues = z.infer<typeof noteSchema>;
export type SnippetFormValues = z.infer<typeof snippetSchema>;
