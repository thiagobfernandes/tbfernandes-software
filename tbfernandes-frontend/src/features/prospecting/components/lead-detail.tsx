"use client";

import { useState } from "react";
import { ExternalLink, MapPin, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LeadChat } from "@/features/prospecting/components/lead-chat";
import { StatusBadge } from "@/features/prospecting/components/status-badge";
import {
  classificationLabel,
  formatInstant,
  isWaiting,
  relativeTime,
  statusMeta,
  statusOrder,
  whatsappHref,
} from "@/features/prospecting/lib/prospecting";
import type {
  LeadStatus,
  ProspectLead,
  SendRequest,
} from "@/features/prospecting/types/prospecting";
import { dataActions, useAppData } from "@/lib/sample-data/store";

/** What to do next with this lead, from its status and what is waiting to go out. */
function nextAction(
  lead: ProspectLead,
  request: SendRequest | undefined,
  now: Date,
): { title: string; detail: string } {
  if (request?.status === "pending")
    return {
      title: "Decidir a mensagem pronta",
      detail:
        "Ela está no topo da tela: envie agora ou cancele. Sem decisão, sai sozinha.",
    };
  if (request)
    return {
      title: "Mensagem na fila de envio",
      detail: "Sai pelo WhatsApp assim que o envio do seu PC estiver ligado.",
    };
  switch (lead.status) {
    case "replied":
      return {
        title: "Responder o lead",
        detail: `Respondeu ${relativeTime(lead.lastReplyAt, now) ?? "há pouco"}. Os follow-ups pararam; continue pelo chat.`,
      };
    case "active":
      return {
        title: "Aguardar a resposta",
        detail: "Os follow-ups automáticos seguem enquanto ele não responder.",
      };
    case "new":
      return {
        title: "Primeira mensagem a caminho",
        detail:
          "O envio automático vai pedir sua aprovação quando chegar a vez dele.",
      };
    case "done":
      return {
        title: "Sequência encerrada",
        detail:
          "Recebeu os dois follow-ups e não respondeu. Escreva se quiser tentar de novo.",
      };
    case "converted":
      return {
        title: "Cliente fechado",
        detail: "Registre aqui o que foi combinado.",
      };
    case "opted_out":
      return {
        title: "Não contatar",
        detail: "Pediu para não receber mais mensagens.",
      };
    default:
      return {
        title: "Revisar o contato",
        detail:
          "O último envio não chegou. Confira o número antes de tentar de novo.",
      };
  }
}

export function LeadDetail({
  lead,
  now,
  workerConnected,
  onDeleted,
}: {
  lead: ProspectLead;
  now: Date;
  workerConnected: boolean | null;
  onDeleted: () => void;
}) {
  const data = useAppData();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const messages = data.prospectMessages.filter(
    (message) => message.leadId === lead.id,
  );
  const requests = data.sendRequests.filter(
    (request) => request.leadId === lead.id,
  );
  const open = requests.find((request) => isWaiting(request.status));
  const action = nextAction(lead, open, now);
  const changed = status !== lead.status || notes !== (lead.notes ?? "");
  const whatsapp = whatsappHref(lead.whatsapp);

  function save(event: React.FormEvent) {
    event.preventDefault();
    dataActions.update("prospectLeads", lead.id, {
      status,
      notes: notes.trim() || undefined,
    });
    toast.success("Acompanhamento salvo");
  }

  const facts = [
    ["Cidade", lead.city],
    [
      "Prioridade",
      lead.classification && classificationLabel[lead.classification],
    ],
    ["1º contato", lead.firstContactAt && formatInstant(lead.firstContactAt)],
    ["Última resposta", lead.lastReplyAt && formatInstant(lead.lastReplyAt)],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));

  return (
    <div className="grid min-h-0 min-w-0 animate-in gap-4 duration-300 fade-in-0 motion-reduce:animate-none xl:h-full xl:grid-cols-[minmax(0,1fr)_18rem] xl:grid-rows-[minmax(0,1fr)]">
      <LeadChat
        lead={lead}
        messages={messages}
        requests={requests}
        workerConnected={workerConnected}
      />

      <aside
        aria-label={`Acompanhamento de ${lead.name}`}
        className="flex min-h-0 min-w-0 flex-col divide-y overflow-y-auto overscroll-contain rounded-xl border bg-card [&>div]:shrink-0 [&>form]:shrink-0"
      >
        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg leading-tight font-medium text-balance">
              {lead.name}
            </h2>
            <StatusBadge status={lead.status} />
          </div>
          {facts.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {facts.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {(whatsapp || lead.instagram || lead.mapsUrl) && (
            <div className="flex flex-wrap gap-2">
              {whatsapp && (
                <Button asChild variant="outline" size="sm">
                  <a href={whatsapp} target="_blank" rel="noreferrer">
                    <MessageCircle /> WhatsApp
                  </a>
                </Button>
              )}
              {lead.instagram && (
                <Button asChild variant="outline" size="sm">
                  <a href={lead.instagram} target="_blank" rel="noreferrer">
                    <ExternalLink /> Instagram
                  </a>
                </Button>
              )}
              {lead.mapsUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={lead.mapsUrl} target="_blank" rel="noreferrer">
                    <MapPin /> Maps
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 bg-accent/60 p-5">
          <span className="text-xs text-muted-foreground">Próxima ação</span>
          <p className="text-sm font-medium">{action.title}</p>
          <p className="text-sm text-muted-foreground">{action.detail}</p>
        </div>

        <form onSubmit={save} className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lead-status">Resultado</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as LeadStatus)}
            >
              <SelectTrigger id="lead-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOrder.map((value) => (
                  <SelectItem key={value} value={value}>
                    {statusMeta[value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lead-notes">Anotações</Label>
            <Textarea
              id="lead-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: pediu proposta, ligar sexta"
              rows={4}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <ConfirmDelete
              noun="lead"
              name={lead.name}
              consequence="A conversa registrada vai junto. Se o envio automático sincronizar de novo, ele volta como novo."
              onConfirm={() => {
                dataActions.remove("prospectLeads", lead.id);
                onDeleted();
              }}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 /> Excluir
                </Button>
              }
            />
            <Button type="submit" disabled={!changed}>
              Salvar
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}
