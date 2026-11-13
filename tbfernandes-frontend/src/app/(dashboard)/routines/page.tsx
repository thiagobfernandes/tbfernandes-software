import type { Metadata } from "next";

import { RoutinesPage } from "@/features/routines/components/routines-page";

export const metadata: Metadata = { title: "Rotinas" };

export default function Page() {
  return <RoutinesPage />;
}
