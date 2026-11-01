import { Suspense } from "react";
import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { KnowledgeGraphPage } from "@/features/knowledge/components/knowledge-graph-page";

export const metadata: Metadata = { title: "Grafo" };

export default function Page() {
  return (
    // The graph reads ?focus= from the URL, which is only known at request time.
    <Suspense
      fallback={
        <PageContainer className="max-w-none">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-[34rem] w-full" />
        </PageContainer>
      }
    >
      <KnowledgeGraphPage />
    </Suspense>
  );
}
