"use client";

import { Clock3, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  formatInstant,
  stageLabel,
} from "@/features/prospecting/lib/prospecting";
import type { SendRequest } from "@/features/prospecting/types/prospecting";
import { dataActions } from "@/lib/sample-data/store";

/** A message the worker is about to send: send now, or never (RN-37). */
export function PendingSend({ request }: { request: SendRequest }) {
  const approved = request.status === "approved";

  function decide(status: "approved" | "cancelled") {
    dataActions.update("sendRequests", request.id, { status });
    toast.success(
      status === "approved"
        ? "Liberada: sai assim que o envio estiver ligado"
        : "Essa mensagem não será enviada",
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-primary/50 bg-primary/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">
          {stageLabel[request.stage]} pronta para enviar
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" />
          {approved
            ? "Liberada por você"
            : `Sai sozinha ${formatInstant(request.autoSendAt)} se você não decidir`}
        </span>
      </div>
      <p className="rounded-2xl rounded-br-sm bg-card px-4 py-2.5 text-sm whitespace-pre-line">
        {request.body}
      </p>
      {!approved && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => decide("approved")}>
            <Send /> Enviar agora
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => decide("cancelled")}
          >
            <X /> Não enviar
          </Button>
        </div>
      )}
    </section>
  );
}
