"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Megaphone, PlugZap, RefreshCw, Unplug } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DecisionQueue } from "@/features/prospecting/components/decision-queue";
import { FunnelStrip } from "@/features/prospecting/components/funnel-strip";
import { LeadDetail } from "@/features/prospecting/components/lead-detail";
import {
  ALL,
  LeadList,
  WAITING,
  type LeadFilter,
} from "@/features/prospecting/components/lead-list";
import { funnelOf, isWaiting } from "@/features/prospecting/lib/prospecting";
import { useProspectingLive } from "@/features/prospecting/lib/use-prospecting-live";
import { useWorkerPresence } from "@/features/prospecting/lib/worker-api";
import type { ProspectLead } from "@/features/prospecting/types/prospecting";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import { reload } from "@/lib/api/remote-store";
import { env } from "@/lib/env";
import { useAppData } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";
import { cn } from "@/lib/utils";

const classificationOrder: Record<string, number> = {
  hot: 0,
  warm: 1,
  cold: 2,
};

export function ProspectingPage() {
  const data = useAppData();
  useProspectingLive();
  const today = useToday();
  const now = useNow(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LeadFilter>(ALL);
  const worker = useWorkerPresence();
  const workerConnected = worker ? worker.connected : null;

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
    <PageContainer className="flex max-w-none flex-col gap-6">
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
                {worker.connected ? <PlugZap /> : <Unplug />}
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

      <FunnelStrip funnel={funnel} today={today} />

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
          description="Os leads aparecem aqui assim que a rotina de busca do tb-site-factory os verificar e sincronizar."
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] xl:h-[clamp(34rem,calc(100vh-9rem),46rem)] xl:items-stretch">
          <LeadList
            leads={visible}
            total={data.prospectLeads.length}
            waiting={waiting}
            selectedId={selected?.id}
            now={now}
            query={query}
            onQuery={setQuery}
            filter={filter}
            onFilter={setFilter}
            onSelect={select}
          />
          {selected ? (
            <LeadDetail
              key={selected.id}
              lead={selected}
              now={now}
              workerConnected={workerConnected}
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
