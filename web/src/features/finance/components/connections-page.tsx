"use client";

import { useCallback, useEffect, useState } from "react";
import { Landmark, Link2, Plus, RefreshCw, Unplug } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { connectionsApi } from "@/features/finance/lib/connections-api";
import type {
  BankConnection,
  ConnectionStatus,
  ConnectToken,
} from "@/features/finance/types/connections";
import type { EntryScope } from "@/features/finance/types/finance";
import { reload } from "@/lib/api/remote-store";
import { env } from "@/lib/env";

const statusLabels: Record<
  ConnectionStatus,
  { label: string; variant: "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Ativa", variant: "secondary" },
  needs_reconnect: { label: "Precisa entrar de novo", variant: "outline" },
  error: { label: "Com erro", variant: "destructive" },
};

const scopeLabels: Record<EntryScope, string> = {
  personal: "Pessoal",
  business: "Empresa",
};

/** Bank balances keep the cents, unlike the rounded amounts of the dashboards. */
const balance = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const syncedAt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Algo deu errado";
}

function importedMessage(imported: number) {
  if (imported === 0) return "Nenhum lançamento novo";
  return imported === 1
    ? "1 lançamento importado"
    : `${imported} lançamentos importados`;
}

export function ConnectionsPage() {
  if (env.dataSource !== "api") {
    return (
      <PageContainer>
        <PageHeading title="Contas conectadas" />
        <EmptyState
          icon={Landmark}
          title="Disponível com a API"
          description="Conectar bancos precisa do backend. Rode com NEXT_PUBLIC_DATA_SOURCE=api para usar esta tela."
        />
      </PageContainer>
    );
  }
  return <Connections />;
}

function Connections() {
  const { resolvedTheme } = useTheme();
  const [connections, setConnections] = useState<BankConnection[]>();
  const [enabled, setEnabled] = useState(true);
  const [scope, setScope] = useState<EntryScope>("personal");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [availability, list] = await Promise.all([
        connectionsApi.availability(),
        connectionsApi.list(),
      ]);
      setEnabled(availability.enabled);
      setConnections(list);
    } catch (error) {
      setConnections([]);
      toast.error(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load from the API
    void refresh();
  }, [refresh]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function syncAndReport(id: string) {
    const { imported, connection } = await connectionsApi.sync(id);
    if (connection.lastError) toast.error(connection.lastError);
    else toast.success(importedMessage(imported));
    await Promise.all([refresh(), reload()]);
  }

  /** The widget is heavy and needs the browser, so it loads only when opened. */
  async function openWidget(
    token: ConnectToken,
    onConnected: (itemId: string) => Promise<void>,
  ) {
    const { PluggyConnect } = await import("pluggy-connect-sdk");
    await new PluggyConnect({
      connectToken: token.accessToken,
      updateItem: token.itemId ?? undefined,
      includeSandbox: env.pluggySandbox,
      language: "pt",
      theme: resolvedTheme === "dark" ? "dark" : "light",
      onSuccess: ({ item }) => run(() => onConnected(item.id)),
      onError: ({ message }) => {
        toast.error(message);
      },
    }).init();
  }

  const connect = () =>
    run(async () => {
      const token = await connectionsApi.token(scope);
      await openWidget(token, async (itemId) => {
        const connection = await connectionsApi.register(itemId, scope);
        await syncAndReport(connection.id);
      });
    });

  const reconnect = (connection: BankConnection) =>
    run(async () => {
      const token = await connectionsApi.reconnectToken(connection.id);
      await openWidget(token, () => syncAndReport(connection.id));
    });

  const disconnect = (connection: BankConnection) =>
    run(async () => {
      await connectionsApi.disconnect(connection.id);
      toast.success("Conexão removida");
      await refresh();
    });

  if (!connections) return <PageSkeleton />;

  return (
    <PageContainer>
      <PageHeading
        title="Contas conectadas"
        description="Bancos ligados por Open Finance. As transações liquidadas viram lançamentos no fluxo de caixa."
        actions={
          enabled && (
            <>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as EntryScope)}
              >
                <SelectTrigger
                  className="w-32"
                  aria-label="Escopo dos lançamentos do novo banco"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="business">Empresa</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={connect} disabled={busy}>
                <Plus /> Conectar banco
              </Button>
            </>
          )
        }
      />

      {!enabled && (
        <EmptyState
          icon={Landmark}
          title="Open Finance desligado"
          description="Os lançamentos manuais continuam funcionando. Para ligar, configure PLUGGY_ENABLED e as credenciais da Pluggy na API."
        />
      )}

      {enabled && connections.length === 0 && (
        <EmptyState
          icon={Landmark}
          title="Nenhum banco conectado"
          description="Escolha se o banco é pessoal ou da empresa e conecte. Os últimos 90 dias entram no fluxo de caixa."
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            busy={busy}
            onSync={() => run(() => syncAndReport(connection.id))}
            onReconnect={() => reconnect(connection)}
            onDisconnect={() => disconnect(connection)}
          />
        ))}
      </div>
    </PageContainer>
  );
}

function ConnectionCard({
  connection,
  busy,
  onSync,
  onReconnect,
  onDisconnect,
}: {
  connection: BankConnection;
  busy: boolean;
  onSync: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
}) {
  const status = statusLabels[connection.status];
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{connection.institution}</CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">{scopeLabels[connection.scope]}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
        <CardDescription>
          {connection.lastSyncedAt
            ? `Sincronizada em ${syncedAt.format(new Date(connection.lastSyncedAt))}`
            : "Ainda não sincronizada"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {connection.lastError && (
          <p className="text-sm text-destructive">{connection.lastError}</p>
        )}
        {connection.accounts.length > 0 && (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {connection.accounts.map((account) => (
              <li
                key={account.externalId}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="min-w-0 truncate">
                  {account.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {account.type === "credit" ? "Cartão" : "Conta"}
                  </span>
                </span>
                {account.balance != null && (
                  <span className="shrink-0 tabular-nums">
                    {balance.format(account.balance)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onSync} disabled={busy}>
            <RefreshCw /> Sincronizar
          </Button>
          {connection.status !== "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReconnect}
              disabled={busy}
            >
              <Link2 /> Entrar de novo
            </Button>
          )}
          <ConfirmDelete
            noun="conexão"
            name={connection.institution}
            onConfirm={onDisconnect}
            consequence="Os lançamentos já importados continuam no fluxo de caixa. Se conectar este banco de novo depois, os últimos 90 dias podem entrar em duplicidade."
            trigger={
              <Button variant="ghost" size="sm" disabled={busy}>
                <Unplug /> Desconectar
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
