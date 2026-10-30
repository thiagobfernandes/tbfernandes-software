import type { Metadata } from "next";

import { GoalsPage } from "@/features/goals/components/goals-page";

export const metadata: Metadata = { title: "Metas" };

export default function Page() {
  return <GoalsPage />;
}
