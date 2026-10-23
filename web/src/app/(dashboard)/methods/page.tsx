import type { Metadata } from "next";

import { MethodsPage } from "@/features/methods/components/methods-page";

export const metadata: Metadata = { title: "Methods" };

export default function Page() {
  return <MethodsPage />;
}
