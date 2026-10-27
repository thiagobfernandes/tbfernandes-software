import type { Metadata } from "next";

import { KnowledgeGraphPage } from "@/features/knowledge/components/knowledge-graph-page";

export const metadata: Metadata = { title: "Grafo" };

export default function Page() {
  return <KnowledgeGraphPage />;
}
