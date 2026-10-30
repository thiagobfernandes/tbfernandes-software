import type { Metadata } from "next";

import { SnippetsPage } from "@/features/knowledge/components/snippets-page";

export const metadata: Metadata = { title: "Snippets" };

export default function Page() {
  return <SnippetsPage />;
}
