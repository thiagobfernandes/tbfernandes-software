"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CalendarClock,
  Handshake,
  ExternalLink,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Share2,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ContactFormDialog } from "@/features/contacts/components/contact-form-dialog";
import { interactionSchema } from "@/features/contacts/schemas/contact-schema";
import type {
  Contact,
  InteractionKind,
} from "@/features/contacts/types/contact";
import { DueChip } from "@/features/tasks/components/due-chip";
import { formatShort } from "@/lib/dates";
import { dataActions, useAppData, workActions } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

const interactionMeta: Record<
  InteractionKind,
  { label: string; icon: LucideIcon }
> = {
  meeting: { label: "Reunião", icon: Video },
  call: { label: "Ligação", icon: PhoneCall },
  message: { label: "Mensagem", icon: MessageSquare },
  event: { label: "Evento", icon: Users },
  referral: { label: "Indicação", icon: Share2 },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ContactsPage() {
  const data = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);

  const needle = query.trim().toLowerCase();
  const visible = data.contacts
    .filter((contact) =>
      [
        contact.name,
        contact.role,
        contact.companyName,
        ...contact.specialties,
      ].some((text) => text?.toLowerCase().includes(needle)),
    )
    .sort((a, b) => (a.nextContact ?? "9").localeCompare(b.nextContact ?? "9"));
  const selectedId = searchParams.get("contact") ?? visible[0]?.id;
  const selected = data.contacts.find((contact) => contact.id === selectedId);
  const dueSoon = data.contacts.filter(
    (contact) => contact.nextContact && contact.nextContact <= currentDay(),
  ).length;

  function select(id?: string) {
    router.replace(id ? `/contacts?contact=${id}` : "/contacts", {
      scroll: false,
    });
  }

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Contatos"
        description={
          dueSoon
            ? `${dueSoon} contato${dueSoon === 1 ? "" : "s"} para fazer follow-up.`
            : "Pessoas que importam para o seu trabalho, com o histórico de cada relação."
        }
        actions={
          <>
            <SampleDataBadge />
            <ContactFormDialog
              onSaved={(contact) => select(contact.id)}
              trigger={
                <Button>
                  <Plus /> Novo contato
                </Button>
              }
            />
          </>
        }
      />

      {data.contacts.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum contato ainda" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3">
            <label className="relative">
              <span className="sr-only">Buscar contatos</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, cargo ou especialidade"
                className="pl-9"
              />
            </label>
            <ul className="flex flex-col gap-2">
              {visible.map((contact) => {
                const company = data.companies.find(
                  (c) => c.id === contact.companyId,
                );
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      aria-current={
                        contact.id === selected?.id ? "true" : undefined
                      }
                      onClick={() => select(contact.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left outline-none hover:border-input focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        contact.id === selected?.id &&
                          "border-primary/60 bg-primary/5",
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {initials(contact.name)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {contact.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {[contact.role, company?.name ?? contact.companyName]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      {contact.nextContact && (
                        <DueChip
                          dueDate={contact.nextContact}
                          today={currentDay()}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Nenhum contato encontrado.
                </li>
              )}
            </ul>
          </aside>

          {selected ? (
            <ContactDetail
              contact={selected}
              onEdit={() => setEditing(true)}
              onDeleted={() => select(undefined)}
            />
          ) : (
            <EmptyState icon={Users} title="Selecione um contato" />
          )}
        </div>
      )}
      {selected && (
        <ContactFormDialog
          item={selected}
          open={editing}
          onOpenChange={setEditing}
        />
      )}
    </PageContainer>
  );
}

function ContactDetail({
  contact,
  onEdit,
  onDeleted,
}: {
  contact: Contact;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const data = useAppData();
  const company = data.companies.find((c) => c.id === contact.companyId);
  const interactions = data.interactions
    .filter((interaction) => interaction.contactId === contact.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const [date, setDate] = useState(currentDay());
  const [kind, setKind] = useState<InteractionKind>("meeting");
  const [summary, setSummary] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [error, setError] = useState<string>();

  function addInteraction(event: React.FormEvent) {
    event.preventDefault();
    const parsed = interactionSchema.safeParse({
      date,
      kind,
      summary,
      followUp,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    const task = parsed.data.followUp
      ? workActions.addTask({
          title: parsed.data.followUp,
          status: "todo",
          priority: "normal",
          tag: "Follow-up",
          description: `Follow-up com ${contact.name}.`,
        })
      : undefined;
    dataActions.create("interactions", {
      contactId: contact.id,
      date: parsed.data.date,
      kind: parsed.data.kind,
      summary: parsed.data.summary,
      followUpTaskId: task?.id,
    });
    setSummary("");
    setFollowUp("");
    toast.success(
      task
        ? "Interação registrada e tarefa de follow-up criada"
        : "Interação registrada",
    );
  }

  return (
    <article className="flex min-w-0 flex-col gap-5 rounded-2xl border bg-card p-5 md:p-7">
      <header className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-medium text-primary">
          {initials(contact.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {contact.name}
          </h2>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            {contact.role}
            {(company || contact.companyName) && (
              <span className="flex items-center gap-1">
                <Building2 className="size-3.5" aria-hidden />
                {company ? (
                  <Link
                    href={`/companies/${company.id}`}
                    className="hover:text-primary"
                  >
                    {company.name}
                  </Link>
                ) : (
                  contact.companyName
                )}
              </span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {contact.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${contact.email}`}>
                  <Mail /> {contact.email}
                </a>
              </Button>
            )}
            {contact.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>
                  <Phone /> {contact.phone}
                </a>
              </Button>
            )}
            {contact.profileUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={contact.profileUrl} target="_blank" rel="noreferrer">
                  <ExternalLink /> Perfil
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="flex shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Editar contato"
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <ConfirmDelete
            noun="contato"
            name={contact.name}
            onConfirm={() => {
              interactions.forEach((item) =>
                dataActions.remove("interactions", item.id),
              );
              dataActions.remove("contacts", contact.id);
              toast.success("Contato excluído");
              onDeleted();
            }}
          />
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-xl border p-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Handshake className="size-3.5" aria-hidden /> Contexto
          </span>
          <p className="text-sm">
            {contact.context || (
              <span className="text-muted-foreground">Não registrado.</span>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border p-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden /> Próximo contato
          </span>
          {contact.nextContact ? (
            <DueChip
              className="w-fit"
              dueDate={contact.nextContact}
              today={currentDay()}
            />
          ) : (
            <span className="text-sm text-muted-foreground">Não agendado.</span>
          )}
          {contact.specialties.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {contact.specialties.map((specialty) => (
                <li
                  key={specialty}
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {specialty}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {contact.notes && (
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
          {contact.notes}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Histórico</h3>
        <form
          onSubmit={addInteraction}
          className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3"
          noValidate
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="interaction-kind">Tipo</Label>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as InteractionKind)}
              >
                <SelectTrigger id="interaction-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(interactionMeta).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="interaction-date">Data</Label>
              <Input
                id="interaction-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="interaction-summary">O que aconteceu</Label>
            <Textarea
              id="interaction-summary"
              rows={2}
              value={summary}
              aria-invalid={Boolean(error)}
              onChange={(event) => setSummary(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="interaction-follow-up">
              Tarefa de follow-up (opcional)
            </Label>
            <Input
              id="interaction-follow-up"
              value={followUp}
              placeholder="ex.: Enviar a proposta"
              onChange={(event) => setFollowUp(event.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" variant="outline" className="w-fit">
            <Plus /> Registrar interação
          </Button>
        </form>

        {interactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma interação ainda.
          </p>
        ) : (
          <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
            {interactions.map((interaction) => {
              const { label, icon: Icon } = interactionMeta[interaction.kind];
              const task = data.tasks.find(
                (t) => t.id === interaction.followUpTaskId,
              );
              return (
                <li
                  key={interaction.id}
                  className="group/i relative flex gap-3"
                >
                  <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="flex flex-1 flex-col gap-1 pt-1">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {label}
                      </span>
                      {formatShort(interaction.date)}{" "}
                      {interaction.date.slice(0, 4)}
                      <span className="ml-auto opacity-0 group-hover/i:opacity-100 focus-within:opacity-100">
                        <ConfirmDelete
                          noun="interação"
                          name={interaction.summary.slice(0, 40)}
                          onConfirm={() =>
                            dataActions.remove("interactions", interaction.id)
                          }
                        />
                      </span>
                    </span>
                    <p className="text-sm">{interaction.summary}</p>
                    {task && (
                      <Link
                        href={`/tasks?q=${encodeURIComponent(task.title)}`}
                        className="w-fit rounded-full border px-2.5 py-0.5 text-xs hover:border-primary hover:text-primary"
                      >
                        Follow-up: {task.title} ·{" "}
                        {task.status === "done" ? "concluída" : "aberta"}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </article>
  );
}
