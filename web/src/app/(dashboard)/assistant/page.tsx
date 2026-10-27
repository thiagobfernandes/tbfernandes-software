import type { Metadata } from "next";

import { AssistantPage } from "@/features/assistant/components/assistant-page";

export const metadata: Metadata = { title: "Assistente" };

export default function Page() {
  return <AssistantPage />;
}
