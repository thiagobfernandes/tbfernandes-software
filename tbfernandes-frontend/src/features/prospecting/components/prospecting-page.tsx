"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Megaphone, RefreshCw, Search } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { ProgressRing, TickBars } from "@/components/shared/metric-visuals";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DecisionQueue } from "@/features/prospecting/components/decision-queue";
import { LeadDetail } from "@/features/prospecting/components/lead-detail";
import { StatusBadge } from "@/features/prospecting/components/status-badge";
import {
  classificationLabel,
  funnelOf,
  isWaiting,
  relativeTime,
  statusMeta,
  statusOrder,
} from "@/features/prospecting/lib/prospecting";
import { useWorkerPresence } from "@/features/prospecting/lib/worker-api";
import type {
  LeadStatus,
  ProspectLead,
} from "@/features/prospecting/types/prospecting";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import { reload } from "@/lib/api/remote-store";
import { env } from "@/lib/env";
import { useAppData } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";
import { cn } from "@/lib/utils";

const ALL = "all";
const WAITING = "waiting";
type Filter = LeadStatus | typeof ALL | typeof WAITING;

const classificationOrder: Record<string, number> = {
  hot: 0,
  warm: 1,
  cold: 2,
};

export function ProspectingPage() {
  const data = useAppData();
  const today = useToday();
  const now = useNow(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(ALL);
  const worker = useWorkerPresence();

  const funnel = funnelOf(data.prospectLeads, data.prospectMessages, today);
  const waiting = new Set(
    data.sendRequests
      .filter((request) => isWaiting(request.status))
      .map((request) => request.leadId),
  );
  const pendingCount = data.sendRequests.filter(
    (request) => request.status === "pending",
  ).length;
  const needle = query.trim().toLowerCase();
  const visible = data.prospectLeads
    .filter((lead) => {
      if (filter === WAITING) return waiting.has(lead.id);
      return filter === ALL || lead.status === filter;
    })
    .filter((lead) =>
      [lead.name, lead.city, lead.whatsapp].some((text) =>
        text?.toLowerCase().includes(needle),
      ),
    )
    .sort(compareLeads(waiting));
  const selectedId = searchParams.get("lead") ?? visible[0]?.id;
  const selected = data.prospectLeads.find((lead) => lead.id === selectedId);

  function select(id?: string) {
    router.replace(id ? `/prospecting?lead=${id}` : "/prospecting", {
      scroll: false,
    });
  }

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Prospecção"
        description={headline(pendingCount, funnel.contacted, funnel.queued)}
        actions={
          <>
            <SampleDataBadge />
            {worker && (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5",
                  worker.connected
                    ? "border-success/50 text-success"
                    : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    worker.connected ? "bg-success" : "bg-muted-foreground",
                  )}
                />
                {worker.connected ? "Envio ligado" : "Envio desligado"}
              </Badge>
            )}
            {env.dataSource === "api" && (
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                <RefreshCw /> Atualizar
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Na fila" value={funnel.queued} unit="sem contato" />
        <MetricCard
          label="Contatados"
          value={funnel.contacted}
          unit={`de ${funnel.leads}`}
          visual={<TickBars values={funnel.sentPerDay} />}
        />
        <MetricCard
          label="Responderam"
          value={Math.round(funnel.replyRate * 100)}
          unit="%"
          visual={
            <ProgressRing value={funnel.replied} total={funnel.contacted} />
          }
        />
        <MetricCard
          label="Fecharam"
          value={funnel.converted}
          unit={funnel.optedOut ? `· ${funnel.optedOut} saíram` : undefined}
        />
      </div>

      <DecisionQueue
        requests={data.sendRequests}
        leads={data.prospectLeads}
        selectedId={selected?.id}
        onSelect={select}
      />

      {data.prospectLeads.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhum lead ainda"
          description="Os leads aparecem aqui quando o envio automático do tb-site-factory sincronizar."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start">
            <div className="flex gap-2">
              <label className="relative flex-1">
                <span className="sr-only">Buscar leads</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nome, cidade ou número"
                  className="pl-9"
                />
              </label>
              <Select
                value={filter}
                onValueChange={(value) => setFilter(value as Filter)}
              >
                <SelectTrigger className="w-36" aria-label="Filtrar por status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value={WAITING}>Aguardando você</SelectItem>
                  {statusOrder.map((value) => (
                    <SelectItem key={value} value={value}>
                      {statusMeta[value].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {visible.length} de {data.prospectLeads.length} leads
            </p>
            <ul className="flex flex-col gap-2 lg:overflow-y-auto lg:pr-1">
              {visible.map((lead) => (
                <li key={lead.id}>
                  <LeadRow
                    lead={lead}
                    now={now}
                    waiting={waiting.has(lead.id)}
                    selected={lead.id === selected?.id}
                    onSelect={() => select(lead.id)}
                  />
                </li>
              ))}
              {visible.length === 0 && (
                <li className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Nenhum lead encontrado.
                </li>
              )}
            </ul>
          </aside>

          {selected ? (
            <LeadDetail
              key={selected.id}
              lead={selected}
              onDeleted={() => select(undefined)}
            />
          ) : (
            <EmptyState icon={Megaphone} title="Selecione um lead" />
          )}
        </div>
      )}
    </PageContainer>
  );
}

function headline(pending: number, contacted: number, queued: number) {
  if (pending)
    return `${pending} mensage${pending === 1 ? "m aguarda" : "ns aguardam"} sua decisão.`;
  if (contacted === 0 && queued > 0)
    return `${queued} leads sem site prontos para a primeira mensagem.`;
  return "Leads abordados pelo WhatsApp, com a conversa e o resultado de cada um.";
}

/** Waiting for you first, then the latest conversation, then hot before warm. */
function compareLeads(waiting: Set<string>) {
  return (a: ProspectLead, b: ProspectLead) =>
    Number(waiting.has(b.id)) - Number(waiting.has(a.id)) ||
    (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "") ||
    (classificationOrder[a.classification ?? ""] ?? 9) -
      (classificationOrder[b.classification ?? ""] ?? 9) ||
    a.name.localeCompare(b.name);
}

function LeadRow({
  lead,
  now,
  waiting,
  selected,
  onSelect,
}: {
  lead: ProspectLead;
  now: Date;
  waiting: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const last = relativeTime(lead.lastMessageAt, now);
  return (
    <button
      type="button"
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-xl border bg-card p-3 text-left outline-none hover:border-input focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected && "border-primary/60 bg-primary/5",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{lead.name}</span>
        {waiting ? (
          <Badge
            variant="outline"
            className="shrink-0 border-primary/60 bg-primary/10 text-primary"
          >
            Aguardando você
          </Badge>
        ) : (
          <StatusBadge status={lead.status} />
        )}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {[
          lead.city,
          lead.classification && classificationLabel[lead.classification],
          last && `última mensagem ${last}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </button>
  );
}
