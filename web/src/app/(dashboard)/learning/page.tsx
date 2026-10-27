import type { Metadata } from "next";

import { LearningPage } from "@/features/learning/components/learning-page";

export const metadata: Metadata = { title: "Aprendizado" };

export default function Page() {
  return <LearningPage />;
}
