import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginPage } from "@/features/auth/components/login-page";

export const metadata: Metadata = { title: "Entrar" };

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
