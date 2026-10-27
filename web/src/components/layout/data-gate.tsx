"use client";

import { useState } from "react";
import { CloudOff, LogIn, RotateCw } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { FormField } from "@/components/shared/form-field";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { reload, signIn, useRemoteStatus } from "@/lib/api/remote-store";
import { env } from "@/lib/env";
import { useAppData } from "@/lib/sample-data/store";

/**
 * With the API as data source, shows the screens only once the data is
 * loaded, and the login when the API asks for one. Local mode renders the
 * screens directly.
 */
export function DataGate({ children }: { children: React.ReactNode }) {
  if (env.dataSource !== "api") return children;
  return <ApiGate>{children}</ApiGate>;
}

function ApiGate({ children }: { children: React.ReactNode }) {
  // Reading the store is what starts loading from the API.
  useAppData();
  const status = useRemoteStatus();

  if (status.state === "ready") return children;
  if (status.state === "signed-out") return <SignIn />;
  if (status.state === "unreachable") {
    return (
      <Centered>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CloudOff className="size-6 text-muted-foreground" aria-hidden />
            <CardTitle>A API não está respondendo</CardTitle>
            <CardDescription>
              Inicie-a com <code>cd api && ./mvnw spring-boot:run</code> e tente
              de novo. ({status.message})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void reload()}>
              <RotateCw /> Tentar de novo
            </Button>
          </CardContent>
        </Card>
      </Centered>
    );
  }
  return <PageSkeleton />;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await signIn(email.trim(), password);
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : "Não foi possível acessar a API",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Centered>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-start gap-3">
          <BrandMark />
          <div className="flex flex-col gap-1">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Use a conta configurada para esta API.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <FormField id="email" label="E-mail" required>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </FormField>
            <FormField id="password" label="Senha" required error={error}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error)}
                required
              />
            </FormField>
            <Button type="submit" disabled={busy || !email || !password}>
              <LogIn /> {busy ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-10">
      {children}
    </div>
  );
}
