import type { Metadata } from "next";

import { SettingsPage } from "@/features/settings/components/settings-page";

export const metadata: Metadata = { title: "Configurações" };

export default function Page() {
  return <SettingsPage />;
}
