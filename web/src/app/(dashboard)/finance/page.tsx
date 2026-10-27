import type { Metadata } from "next";

import { CashFlowPage } from "@/features/finance/components/cash-flow-page";

export const metadata: Metadata = { title: "Fluxo de caixa" };

export default function Page() {
  return <CashFlowPage />;
}
