"use client";

import { Clock3, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { decide } from "@/features/prospecting/components/decision-queue";
import {
  countdownLabel,
  stageLabel,
} from "@/features/prospecting/lib/prospecting";
import type { SendRequest } from "@/features/prospecting/types/prospecting";
import { useNow } from "@/features/time-tracking/hooks/use-now";

/** The lead's message about to go out: send now, or never (RN-37). */
export function PendingSend({ request }: { request: SendRequest }) {
  const now = useNow(true);
  const approved = request.status === "approved";

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-primary/50 bg-primary/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">
          {stageLabel[request.stage]} pronta para enviar
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <Clock3 className="size-3.5" />
          {approved
            ? "Liberada por você: sai no próximo envio"
            : countdownLabel(request.autoSendAt, now)}
        </span>
      </div>
      <p className="rounded-2xl rounded-br-sm bg-card px-4 py-2.5 text-sm whitespace-pre-line">
        {request.body}
      </p>
      {!approved && (
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
      )}
    </section>
  );
}
