import type { Metadata } from "next";

import { PurchasesPage } from "@/features/finance/components/purchases-page";

export const metadata: Metadata = { title: "Planned purchases" };

export default function Page() {
  return <PurchasesPage />;
}
