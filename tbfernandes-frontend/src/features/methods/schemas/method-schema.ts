import { z } from "zod";

export const methodSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(120),
  summary: z.string().trim().min(1, "Resuma o método").max(300),
  category: z.enum(["development", "quality", "communication"]),
  tags: z.array(z.string()),
  steps: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Dê um nome ao passo").max(160),
        detail: z.string().trim().max(1000),
      }),
    )
    .min(1, "Adicione pelo menos um passo"),
  examples: z.array(
    z.object({
      title: z.string().trim().min(1, "Dê um nome ao exemplo").max(120),
      content: z.string().min(1, "Adicione o conteúdo").max(5000),
    }),
  ),
});

export type MethodFormValues = z.infer<typeof methodSchema>;
