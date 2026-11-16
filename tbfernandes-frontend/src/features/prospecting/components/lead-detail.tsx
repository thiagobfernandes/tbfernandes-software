"use client";

import { useState } from "react";
import { ExternalLink, MapPin, MessageCircle } from "lucide-react";
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
import { StatusBadge } from "@/features/prospecting/components/status-badge";
import {
  classificationLabel,
  formatInstant,
  stageLabel,
  statusMeta,
  statusOrder,
  whatsappHref,
} from "@/features/prospecting/lib/prospecting";
import type {
  LeadStatus,
  ProspectLead,
} from "@/features/prospecting/types/prospecting";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

export function LeadDetail({
  lead,
  onDeleted,
}: {
  lead: ProspectLead;
  onDeleted: () => void;
}) {
  const data = useAppData();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const messages = data.prospectMessages
    .filter((message) => message.leadId === lead.id)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  const changed = status !== lead.status || notes !== (lead.notes ?? "");
  const whatsapp = whatsappHref(lead.whatsapp);

  function save(event: React.FormEvent) {
    event.preventDefault();
    dataActions.update("prospectLeads", lead.id, {
      status,
      notes: notes.trim() || undefined,
    });
    toast.success("Lead atualizado");
  }

  return (
    <section className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-medium">{lead.name}</h2>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {[
              lead.city,
              lead.classification &&
                `Lead ${classificationLabel[lead.classification].toLowerCase()}`,
              lead.firstContactAt &&
                `1º contato ${formatInstant(lead.firstContactAt)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
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
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
          <h3 className="text-sm font-medium">Conversa</h3>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem enviada ainda.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {messages.map((message) => {
                const outbound = message.direction === "outbound";
                return (
                  <li
                    key={message.id}
                    className={cn(
                      "flex max-w-[85%] flex-col gap-1",
                      outbound ? "items-end self-end" : "self-start",
                    )}
                  >
                    <p
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line",
                        outbound
                          ? "rounded-br-sm bg-primary/10"
                          : "rounded-bl-sm bg-muted",
                      )}
                    >
                      {message.body}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {stageLabel[message.stage]} ·{" "}
                      {formatInstant(message.sentAt)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <form
          onSubmit={save}
          className="flex h-fit flex-col gap-4 rounded-2xl border bg-card p-5"
        >
          <h3 className="text-sm font-medium">Acompanhamento</h3>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lead-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as LeadStatus)}
            >
              <SelectTrigger id="lead-status">
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
          <Button type="submit" disabled={!changed}>
            Salvar
          </Button>
          <ConfirmDelete
            noun="lead"
            name={lead.name}
            consequence="A conversa registrada vai junto. Se o envio automático sincronizar de novo, ele volta como novo."
            onConfirm={() => {
              dataActions.remove("prospectLeads", lead.id);
              onDeleted();
            }}
          />
        </form>
      </div>
    </section>
  );
}
