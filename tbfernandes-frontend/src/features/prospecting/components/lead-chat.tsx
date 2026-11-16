"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock3,
  PlugZap,
  Send,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  formatInstant,
  stageLabel,
} from "@/features/prospecting/lib/prospecting";
import type {
  ProspectLead,
  ProspectMessage,
  SendRequest,
} from "@/features/prospecting/types/prospecting";
import { dataActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

const dayFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});
const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

type Item =
  | { kind: "message"; at: string; message: ProspectMessage }
  | { kind: "request"; at: string; request: SendRequest };

const queuedLabel: Partial<Record<SendRequest["status"], string>> = {
  pending: "Aguardando sua decisão",
  approved: "Na fila: sai assim que o envio estiver ligado",
  sending: "Enviando pelo WhatsApp…",
  failed: "Não foi enviada",
};

/**
 * The conversation as WhatsApp shows it: yours on the right, the lead's on the left, with
 * what is still waiting to go out at the end. You can write too; the message goes out through
 * the sending script on your computer, as soon as it is running.
 */
export function LeadChat({
  lead,
  messages,
  requests,
  workerConnected,
}: {
  lead: ProspectLead;
  messages: ProspectMessage[];
  requests: SendRequest[];
  /** null when unknown (local mode). */
  workerConnected: boolean | null;
}) {
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLOListElement>(null);
  const optedOut = lead.status === "opted_out";

  const queued = requests.filter(
    (request) =>
      request.status === "approved" ||
      request.status === "sending" ||
      request.status === "failed" ||
      (request.status === "pending" && request.stage === "manual"),
  );
  const items: Item[] = [
    ...messages.map((message) => ({
      kind: "message" as const,
      at: message.sentAt,
      message,
    })),
    ...queued.map((request) => ({
      kind: "request" as const,
      at: request.requestedAt,
      request,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  useEffect(() => {
    const list = scroller.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [items.length]);

  function send(event?: React.FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || optedOut) return;
    const now = new Date().toISOString();
    dataActions.create("sendRequests", {
      leadId: lead.id,
      stage: "manual",
      body,
      status: "approved",
      requestedAt: now,
      autoSendAt: now,
    });
    setDraft("");
    toast.success(
      workerConnected === false
        ? "Na fila: sai quando o envio do seu PC ligar"
        : "Mensagem na fila de envio",
    );
  }

  return (
    <section
      aria-label={`Conversa com ${lead.name}`}
      className="flex min-h-[32rem] min-w-0 flex-col overflow-hidden rounded-xl border bg-card xl:h-full xl:min-h-0"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <div className="flex min-w-0 flex-col">
          <h3 className="text-sm font-medium">Conversa no WhatsApp</h3>
          <span className="truncate text-xs text-muted-foreground tabular-nums">
            {lead.whatsapp
              ? `+${lead.whatsapp.replace(/\D/g, "")}`
              : "sem número"}
          </span>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs",
            workerConnected ? "text-success" : "text-muted-foreground",
          )}
        >
          {workerConnected ? (
            <PlugZap className="size-3.5" aria-hidden />
          ) : (
            <Unplug className="size-3.5" aria-hidden />
          )}
          {workerConnected === null
            ? "Modo de exemplo"
            : workerConnected
              ? "Envio ligado"
              : "Envio desligado"}
        </span>
      </header>

      <ol
        ref={scroller}
        className="flex max-h-[32rem] min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-muted/30 px-5 py-4 xl:max-h-none"
      >
        {items.length === 0 && (
          <li className="m-auto max-w-xs text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. A primeira aparece aqui assim que for
            pedida, e você também pode escrever abaixo.
          </li>
        )}
        {items.map((item, index) => {
          const day = dayFormat.format(new Date(item.at));
          const previous = items[index - 1];
          const newDay =
            !previous || dayFormat.format(new Date(previous.at)) !== day;
          return (
            <li
              key={`${item.kind}-${item.kind === "message" ? item.message.id : item.request.id}`}
              className="flex flex-col gap-3"
            >
              {newDay && (
                <span className="self-center rounded-full bg-card px-3 py-0.5 text-xs text-muted-foreground first-letter:uppercase">
                  {day}
                </span>
              )}
              {item.kind === "message" ? (
                <MessageBubble message={item.message} leadName={lead.name} />
              ) : (
                <QueuedBubble request={item.request} />
              )}
            </li>
          );
        })}
      </ol>

      <form onSubmit={send} className="flex flex-col gap-2 border-t p-4">
        {optedOut ? (
          <p className="text-sm text-muted-foreground">
            Este lead pediu para não receber mensagens. O envio está bloqueado.
          </p>
        ) : (
          <>
            <label htmlFor={`chat-${lead.id}`} className="sr-only">
              Escrever mensagem para {lead.name}
            </label>
            <div className="flex items-end gap-2">
              <Textarea
                id={`chat-${lead.id}`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.ctrlKey || event.metaKey))
                    send();
                }}
                placeholder="Escreva uma mensagem"
                rows={2}
                maxLength={4000}
                className="min-h-11 resize-none max-sm:text-base"
              />
              <Button
                type="submit"
                size="icon"
                className="size-11 active:scale-[0.97] motion-reduce:active:scale-100"
                disabled={!draft.trim()}
                aria-label="Enviar mensagem"
              >
                <Send />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {workerConnected === false
                ? "O envio do seu PC está desligado: a mensagem fica na fila e sai quando ele ligar."
                : "Sai pelo WhatsApp do chip de prospecção, sem esperar aprovação. Ctrl+Enter envia."}
            </p>
          </>
        )}
      </form>
    </section>
  );
}

function MessageBubble({
  message,
  leadName,
}: {
  message: ProspectMessage;
  leadName: string;
}) {
  const outbound = message.direction === "outbound";
  return (
    <div
      className={cn(
        "flex max-w-[85%] flex-col gap-1",
        outbound ? "items-end self-end" : "self-start",
      )}
    >
      <span className="flex gap-2 px-1 text-xs text-muted-foreground">
        <span className="font-medium">{outbound ? "Você" : leadName}</span>
        {message.stage !== "reply" && message.stage !== "manual" && (
          <span>{stageLabel[message.stage]}</span>
        )}
        {message.stage === "auto_reply" && <span>não conta como resposta</span>}
      </span>
      <p
        className={cn(
          "animate-in rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line duration-200 fade-in-0 zoom-in-95 motion-reduce:animate-none",
          outbound
            ? "rounded-br-sm bg-primary/15"
            : "rounded-bl-sm border bg-card",
          message.stage === "opt_out" && "border-destructive/50",
          message.stage === "auto_reply" &&
            "border-dashed bg-transparent text-muted-foreground",
        )}
      >
        {message.body || "(mensagem sem texto)"}
      </p>
      <span className="flex items-center gap-1 px-1 text-xs text-muted-foreground tabular-nums">
        {timeFormat.format(new Date(message.sentAt))}
        {outbound && <Check className="size-3.5" aria-label="enviada" />}
      </span>
    </div>
  );
}

function QueuedBubble({ request }: { request: SendRequest }) {
  const failed = request.status === "failed";
  return (
    <div className="flex max-w-[85%] flex-col items-end gap-1 self-end">
      <span className="flex gap-2 px-1 text-xs text-muted-foreground">
        <span className="font-medium">Você</span>
        <span>{stageLabel[request.stage]}</span>
      </span>
      <p
        className={cn(
          "rounded-2xl rounded-br-sm border border-dashed px-4 py-2.5 text-sm whitespace-pre-line text-muted-foreground",
          failed && "border-destructive/60",
        )}
      >
        {request.body}
      </p>
      <span
        className={cn(
          "flex items-center gap-1 px-1 text-xs",
          failed ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {failed ? (
          <AlertCircle className="size-3.5" />
        ) : (
          <Clock3 className="size-3.5" />
        )}
        {queuedLabel[request.status]}
        {failed && request.error ? `: ${request.error}` : ""}
        {!failed && (
          <span className="tabular-nums">
            , pedida {formatInstant(request.requestedAt)}
          </span>
        )}
      </span>
    </div>
  );
}
