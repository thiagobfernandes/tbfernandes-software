import type { Metadata } from "next";

import { KnowledgePage } from "@/features/knowledge/components/knowledge-page";

export const metadata: Metadata = { title: "Notes" };

export default function Page() {
  return <KnowledgePage />;
}
