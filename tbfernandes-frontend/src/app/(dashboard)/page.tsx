import { Suspense } from "react";

import { DashboardPage } from "@/features/dashboard/components/dashboard-page";

export default function Page() {
  // The overview reads `?create=` (global "Criar" from Ctrl K).
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  );
}
