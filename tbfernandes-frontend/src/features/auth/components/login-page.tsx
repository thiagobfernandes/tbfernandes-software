"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchSession } from "@/lib/api/remote-store";
import { env } from "@/lib/env";
import { safeNextPath } from "@/lib/routes";

import { LoginForm } from "./login-form";

export function LoginPage() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));

  useEffect(() => {
    if (env.dataSource !== "api") {
      router.replace(next);
      return;
    }
    fetchSession()
      .then((session) => {
        if (session.mode !== "session" || session.signedIn) router.replace(next);
      })
      .catch(() => undefined);
  }, [next, router]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-start gap-3">
          <BrandMark />
          <div className="flex flex-col gap-1">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Acesse sua conta do TBFernandes Software.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm onSignedIn={() => router.replace(next)} />
        </CardContent>
      </Card>
    </main>
  );
}
