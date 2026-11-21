import type { Metadata } from "next";

import { ReservesPage } from "@/features/finance/components/planning/reserves-page";

export const metadata: Metadata = { title: "Reservas e metas" };

export default function Page() {
  return <ReservesPage />;
}
