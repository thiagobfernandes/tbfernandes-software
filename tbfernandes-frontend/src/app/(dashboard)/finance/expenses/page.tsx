import type { Metadata } from "next";

import { ExpensesPage } from "@/features/finance/components/expenses-page";

export const metadata: Metadata = { title: "Gastos" };

export default function Page() {
  return <ExpensesPage />;
}
