import type { Metadata } from "next";

import { CashFlowPage } from "@/features/finance/components/cash-flow-page";

export const metadata: Metadata = { title: "Cash flow" };

export default function Page() {
  return <CashFlowPage />;
}
