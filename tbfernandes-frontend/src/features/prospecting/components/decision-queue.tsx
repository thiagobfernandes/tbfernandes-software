"use client";

import { Clock3, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  countdownLabel,
  countdownProgress,
  stageLabel,
} from "@/features/prospecting/lib/prospecting";
import type {
  ProspectLead,
  SendRequest,
} from "@/features/prospecting/types/prospecting";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import { dataActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

export function decide(
  request: SendRequest,
  status: "approved" | "cancelled",
  quiet = false,
) {
  dataActions.update("sendRequests", request.id, { status });
  if (quiet) return;
  toast.success(
    status === "approved"
      ? "Liberada: sai no próximo envio"
      : "Essa mensagem não será enviada",
  );
}

/** Messages waiting for the user, soonest to go out first (RN-37). */
export function DecisionQueue({
  requests,
  leads,
  selectedId,
  onSelect,
}: {
  requests: SendRequest[];
  leads: ProspectLead[];
  selectedId?: string;
  onSelect: (leadId: string) => void;
}) {
  const now = useNow(requests.length > 0);
  const pending = requests
    .filter((request) => request.status === "pending")
    .sort((a, b) => a.autoSendAt.localeCompare(b.autoSendAt));
  if (pending.length === 0) return null;

  function approveAll() {
    pending.forEach((request) => decide(request, "approved", true));
    toast.success(
      `${pending.length} mensage${pending.length === 1 ? "m liberada" : "ns liberadas"}`,
    );
  }

  return (
    <section
      aria-labelledby="decision-queue-title"
      className="flex flex-col gap-3"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="decision-queue-title" className="text-base font-medium">
            Aguardando sua decisão
          </h2>
          <p className="text-sm text-muted-foreground">
            Sem resposta em 1 hora, cada mensagem sai sozinha, dentro do horário
            e do limite do dia.
          </p>
        </div>
        {pending.length > 1 && (
          <Button size="sm" onClick={approveAll}>
            <Send /> Enviar todas ({pending.length})
          </Button>
        )}
      </header>
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {pending.map((request) => {
          const lead = leads.find((item) => item.id === request.leadId);
          const progress = countdownProgress(
            request.requestedAt,
            request.autoSendAt,
            now,
          );
          return (
            <li
              key={request.id}
              className={cn(
                "flex min-w-0 animate-in flex-col gap-3 rounded-xl border border-primary/40 bg-card p-4 duration-300 fade-in-0 motion-reduce:animate-none",
                request.leadId === selectedId && "border-primary",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(request.leadId)}
                  className="min-w-0 text-left outline-none focus-visible:underline"
                >
                  <span className="block truncate text-sm font-medium hover:underline">
                    {lead?.name ?? "Lead"}
                  </span>
                  {lead?.city && (
                    <span className="text-xs text-muted-foreground">
                      {lead.city}
                    </span>
                  )}
                </button>
                <Badge variant="outline" className="shrink-0">
                  {stageLabel[request.stage]}
                </Badge>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {request.body}
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                  <Clock3 className="size-3.5" />
                  {countdownLabel(request.autoSendAt, now)}
                </div>
                <div
                  className="h-1 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="Tempo até sair sozinha"
                  aria-valuenow={Math.round(progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full w-full origin-left rounded-full bg-primary transition-transform duration-1000"
                    style={{ transform: `scaleX(${progress})` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => decide(request, "approved")}>
                  <Send /> Enviar agora
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide(request, "cancelled")}
                >
                  <X /> Não enviar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
