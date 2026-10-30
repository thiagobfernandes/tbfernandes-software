import type { Metadata } from "next";

import { MethodsPage } from "@/features/methods/components/methods-page";

export const metadata: Metadata = { title: "Métodos" };

export default function Page() {
  return <MethodsPage />;
}
