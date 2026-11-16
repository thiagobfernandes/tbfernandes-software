"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Megaphone, Search } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { ProgressRing, TickBars } from "@/components/shared/metric-visuals";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadDetail } from "@/features/prospecting/components/lead-detail";
import { StatusBadge } from "@/features/prospecting/components/status-badge";
import {
  classificationLabel,
  formatInstant,
  funnelOf,
  statusMeta,
  statusOrder,
} from "@/features/prospecting/lib/prospecting";
import type { LeadStatus } from "@/features/prospecting/types/prospecting";
import { useAppData } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";
import { cn } from "@/lib/utils";

const ALL = "all";

export function ProspectingPage() {
  const data = useAppData();
  const today = useToday();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | typeof ALL>(ALL);

  const funnel = funnelOf(data.prospectLeads, data.prospectMessages, today);
  const needle = query.trim().toLowerCase();
  const visible = data.prospectLeads
    .filter((lead) => status === ALL || lead.status === status)
    .filter((lead) =>
      [lead.name, lead.city, lead.whatsapp].some((text) =>
        text?.toLowerCase().includes(needle),
      ),
    )
    .sort(
      (a, b) =>
        (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "") ||
        a.name.localeCompare(b.name),
    );
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
        description="Leads abordados pelo WhatsApp automático, com a conversa de cada um."
        actions={<SampleDataBadge />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Leads"
          value={funnel.leads}
          visual={<TickBars values={funnel.sentPerDay} />}
        />
        <MetricCard label="Contatados" value={funnel.contacted} />
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

      {data.prospectLeads.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhum lead ainda"
          description="Os leads aparecem aqui quando o envio automático do tb-site-factory sincronizar."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3">
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
                value={status}
                onValueChange={(value) =>
                  setStatus(value as LeadStatus | typeof ALL)
                }
              >
                <SelectTrigger className="w-36" aria-label="Filtrar por status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {statusOrder.map((value) => (
                    <SelectItem key={value} value={value}>
                      {statusMeta[value].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ul className="flex flex-col gap-2">
              {visible.map((lead) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    aria-current={lead.id === selected?.id ? "true" : undefined}
                    onClick={() => select(lead.id)}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-xl border bg-card p-3 text-left outline-none hover:border-input focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      lead.id === selected?.id &&
                        "border-primary/60 bg-primary/5",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {lead.name}
                      </span>
                      <StatusBadge status={lead.status} />
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[
                        lead.city,
                        lead.classification &&
                          classificationLabel[lead.classification],
                        lead.lastMessageAt &&
                          `última: ${formatInstant(lead.lastMessageAt)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </button>
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
