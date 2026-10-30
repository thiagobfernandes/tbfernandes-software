import type { Metadata } from "next";

import { ConnectionsPage } from "@/features/finance/components/connections-page";

export const metadata: Metadata = { title: "Contas conectadas" };

export default function Page() {
  return <ConnectionsPage />;
}
