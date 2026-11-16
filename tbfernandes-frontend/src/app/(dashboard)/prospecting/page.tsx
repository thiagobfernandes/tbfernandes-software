import { Suspense } from "react";
import type { Metadata } from "next";

import { ProspectingSkeleton } from "@/features/prospecting/components/prospecting-skeleton";
import { ProspectingPage } from "@/features/prospecting/components/prospecting-page";

export const metadata: Metadata = { title: "Prospecção" };

export default function Page() {
  return (
    // Reads the URL query, which is only known at request time.
    <Suspense fallback={<ProspectingSkeleton />}>
      <ProspectingPage />
    </Suspense>
  );
}
