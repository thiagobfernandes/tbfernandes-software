import { Suspense } from "react";
import type { Metadata } from "next";

import { Skeleton } from "@/components/ui/skeleton";
import { KnowledgeGraphPage } from "@/features/knowledge/components/knowledge-graph-page";

export const metadata: Metadata = { title: "Grafo" };

export default function Page() {
  return (
    // The graph reads ?focus= from the URL, which is only known at request time.
    <Suspense
      fallback={
        <div className="flex h-[calc(100svh-var(--header-h))] flex-col">
          <Skeleton className="h-11 w-full rounded-none" />
          <Skeleton className="flex-1 rounded-none opacity-40" />
        </div>
      }
    >
      <KnowledgeGraphPage />
    </Suspense>
  );
}
