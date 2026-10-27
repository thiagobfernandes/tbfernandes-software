import type { Metadata } from "next";

import { CompaniesPage } from "@/features/companies/components/companies-page";

export const metadata: Metadata = { title: "Empresas" };

export default function Page() {
  return <CompaniesPage />;
}
