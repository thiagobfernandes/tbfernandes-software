import { answer, type Answer } from "@/features/assistant/lib/answer";
import { apiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { env } from "@/lib/env";
import type { AppData } from "@/lib/sample-data/store";

/**
 * One question to the assistant: the API answers in API mode (and the AI
 * model once one is set); locally the same rules run over the browser data.
 */
export function askAssistant(question: string, data: AppData): Promise<Answer> {
  if (env.dataSource === "api") {
    const body: components["schemas"]["QuestionRequest"] = { question };
    return apiFetch<Answer>("/api/v1/assistant/questions", {
      method: "POST",
      body,
    }).catch(() => ({
      text: "Não foi possível falar com o assistente. Tente de novo em instantes.",
      references: [],
    }));
  }
  // A short pause so the exchange reads like the real assistant will.
  return new Promise((resolve) =>
    setTimeout(() => resolve(answer(question, data)), 450),
  );
}
