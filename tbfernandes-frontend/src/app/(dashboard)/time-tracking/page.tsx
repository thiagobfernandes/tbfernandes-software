import type { Metadata } from "next";

import { TimeTrackingPage } from "@/features/time-tracking/components/time-tracking-page";

export const metadata: Metadata = { title: "Apontamentos" };

export default function Page() {
  return <TimeTrackingPage />;
}
