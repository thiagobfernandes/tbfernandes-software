import { Suspense } from "react";
import type { Metadata } from "next";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { KnowledgePage } from "@/features/knowledge/components/knowledge-page";

export const metadata: Metadata = { title: "Notas" };

export default function Page() {
  return (
    // The selected note comes from ?note=, known only at request time.
    <Suspense fallback={<PageSkeleton />}>
      <KnowledgePage />
    </Suspense>
  );
}
