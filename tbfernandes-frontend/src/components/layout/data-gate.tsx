"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CloudOff, RotateCw } from "lucide-react";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { reload, useRemoteStatus } from "@/lib/api/remote-store";
import { env } from "@/lib/env";
import { loginHref } from "@/lib/routes";
import { useAppData } from "@/lib/sample-data/store";

/**
 * With the API as data source, shows the screens only once the data is
 * loaded, and the login when the API asks for one. Local mode renders the
 * screens directly. Signed out, it sends the visitor to /login.
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
  if (status.state === "signed-out") return <RedirectToLogin />;
  if (status.state === "unreachable") {
    return (
      <Centered>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CloudOff className="size-6 text-muted-foreground" aria-hidden />
            <CardTitle>A API não está respondendo</CardTitle>
            <CardDescription>
              {env.desktopBuild ? (
                "O serviço local do aplicativo não respondeu. Feche e abra o TBFernandes de novo."
              ) : (
                <>
                  Inicie-a com{" "}
                  <code>cd tbfernandes-backend && npm run dev</code>{" "}
                  e tente de novo.
                </>
              )}{" "}
              ({status.message})
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

function RedirectToLogin() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.replace(loginHref(`${pathname}${window.location.search}`));
  }, [router, pathname]);

  return <PageSkeleton />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-10">
      {children}
    </div>
  );
}
