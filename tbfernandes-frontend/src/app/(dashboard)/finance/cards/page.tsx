import type { Metadata } from "next";

import { CardsPage } from "@/features/finance/components/planning/cards-page";

export const metadata: Metadata = { title: "Cartões" };

export default function Page() {
  return <CardsPage />;
}
