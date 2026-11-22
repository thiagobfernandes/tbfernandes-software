import type { Metadata } from "next";

import { CommitmentsPage } from "@/features/finance/components/planning/commitments-page";

export const metadata: Metadata = { title: "Compromissos" };

export default function Page() {
  return <CommitmentsPage />;
}
