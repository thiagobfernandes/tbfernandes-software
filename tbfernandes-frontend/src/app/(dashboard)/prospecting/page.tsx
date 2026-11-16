import { Suspense } from "react";
import type { Metadata } from "next";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ProspectingPage } from "@/features/prospecting/components/prospecting-page";

export const metadata: Metadata = { title: "Prospecção" };

export default function Page() {
  return (
    // Reads the URL query, which is only known at request time.
    <Suspense fallback={<PageSkeleton />}>
      <ProspectingPage />
    </Suspense>
  );
}
