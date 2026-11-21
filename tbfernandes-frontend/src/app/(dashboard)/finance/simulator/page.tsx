import type { Metadata } from "next";

import { SimulatorPage } from "@/features/finance/components/planning/simulator-page";

export const metadata: Metadata = { title: "Simulador" };

export default function Page() {
  return <SimulatorPage />;
}
