import type { Metadata } from "next";

import { PlanningPage } from "@/features/finance/components/planning/planning-page";

export const metadata: Metadata = { title: "Planejamento" };

export default function Page() {
  return <PlanningPage />;
}
