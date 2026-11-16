import type {
  LeadClassification,
  LeadStatus,
  MessageStage,
  ProspectLead,
  ProspectMessage,
} from "@/features/prospecting/types/prospecting";
import { addDays, toDay } from "@/lib/dates";

export const statusMeta: Record<
  LeadStatus,
  { label: string; tone: "muted" | "primary" | "success" | "danger" }
> = {
  new: { label: "Na fila", tone: "muted" },
  active: { label: "Em contato", tone: "primary" },
  replied: { label: "Respondeu", tone: "success" },
  converted: { label: "Fechou", tone: "success" },
  done: { label: "Sem resposta", tone: "muted" },
  opted_out: { label: "Pediu para sair", tone: "danger" },
  no_whatsapp: { label: "Sem WhatsApp", tone: "muted" },
  error: { label: "Erro no envio", tone: "danger" },
};

/** Order of the status filter and of the review select. */
export const statusOrder: LeadStatus[] = [
  "new",
  "active",
  "replied",
  "converted",
  "done",
  "opted_out",
  "no_whatsapp",
  "error",
];

export const isWaiting = (status: string) =>
  status === "pending" || status === "approved";

export const classificationLabel: Record<LeadClassification, string> = {
  hot: "Quente",
  warm: "Morno",
  cold: "Frio",
  skip: "Fora",
};

export const stageLabel: Record<MessageStage, string> = {
  first: "1ª mensagem",
  follow_up_1: "Follow-up 1",
  follow_up_2: "Follow-up 2",
  reply: "Resposta",
  opt_out: "Pediu para sair",
};

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatInstant(instant?: string) {
  return instant ? dateTime.format(new Date(instant)) : "—";
}

/** wa.me link from the number the worker stored (digits, with or without 55). */
export function whatsappHref(whatsapp?: string) {
  const digits = whatsapp?.replace(/\D/g, "");
  if (!digits) return undefined;
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

export type Funnel = {
  leads: number;
  /** Not contacted yet. */
  queued: number;
  sentRecently: number;
  contacted: number;
  replied: number;
  optedOut: number;
  converted: number;
  replyRate: number;
  /** Messages sent in each of the last `days` days, oldest first. */
  sentPerDay: number[];
};

export function funnelOf(
  leads: ProspectLead[],
  messages: ProspectMessage[],
  today: string,
  days = 14,
): Funnel {
  const contacted = leads.filter((lead) => lead.firstContactAt).length;
  const replied = leads.filter((lead) => lead.lastReplyAt).length;
  const perDay = new Map<string, number>();
  for (const message of messages) {
    if (message.direction !== "outbound") continue;
    const day = toDay(new Date(message.sentAt));
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const sentPerDay = Array.from({ length: days }, (_, index) => {
    const day = addDays(today, index - (days - 1));
    return perDay.get(day) ?? 0;
  });
  return {
    leads: leads.length,
    queued: leads.filter((lead) => lead.status === "new").length,
    sentRecently: sentPerDay.reduce((sum, value) => sum + value, 0),
    contacted,
    replied,
    optedOut: leads.filter((lead) => lead.status === "opted_out").length,
    converted: leads.filter((lead) => lead.status === "converted").length,
    replyRate: contacted ? replied / contacted : 0,
    sentPerDay,
  };
}

const MINUTE = 60_000;

/** "sai sozinha em 37 min", or released when the hour is over (RN-37). */
export function countdownLabel(autoSendAt: string, now: Date) {
  const left = new Date(autoSendAt).getTime() - now.getTime();
  if (left <= 0) return "liberada: sai no próximo envio";
  const minutes = Math.ceil(left / MINUTE);
  if (minutes < 60) return `sai sozinha em ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `sai sozinha em ${hours} h ${String(minutes % 60).padStart(2, "0")}`;
}

/** Share of the hour already gone, 0..1, for the countdown bar. */
export function countdownProgress(
  requestedAt: string,
  autoSendAt: string,
  now: Date,
) {
  const start = new Date(requestedAt).getTime();
  const end = new Date(autoSendAt).getTime();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
}

const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function relativeTime(instant: string | undefined, now: Date) {
  if (!instant) return undefined;
  const minutes = Math.round(
    (new Date(instant).getTime() - now.getTime()) / MINUTE,
  );
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}
