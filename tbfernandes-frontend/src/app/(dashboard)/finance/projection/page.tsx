import type { Metadata } from "next";

import { ProjectionPage } from "@/features/finance/components/planning/projection-page";

export const metadata: Metadata = { title: "Próximos meses" };

export default function Page() {
  return <ProjectionPage />;
}
