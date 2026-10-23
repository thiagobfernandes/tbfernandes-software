import { z } from "zod";

export const methodSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  summary: z.string().trim().min(1, "Summarize the method").max(300),
  category: z.enum(["development", "quality", "communication"]),
  tags: z.array(z.string()),
  steps: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Name the step").max(160),
        detail: z.string().trim().max(1000),
      }),
    )
    .min(1, "Add at least one step"),
  examples: z.array(
    z.object({
      title: z.string().trim().min(1, "Name the example").max(120),
      content: z.string().min(1, "Add the content").max(5000),
    }),
  ),
});

export type MethodFormValues = z.infer<typeof methodSchema>;
