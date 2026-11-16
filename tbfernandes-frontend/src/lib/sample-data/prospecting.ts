// Illustrative prospecting data for the simulated mode. In API mode the
// leads come from the prospecting worker (tb-site-factory).

import type {
  ProspectLead,
  ProspectMessage,
} from "@/features/prospecting/types/prospecting";

export const sampleProspectLeads: ProspectLead[] = [
  {
    id: "pl-1",
    externalId: "maringa--clinica-exemplo",
    name: "Clínica Exemplo Odontologia",
    city: "Maringá",
    whatsapp: "5544900000001",
    instagram: "https://www.instagram.com/exemplo",
    classification: "hot",
    status: "replied",
    firstContactAt: "2026-10-20T12:05:00Z",
    lastMessageAt: "2026-10-21T14:10:00Z",
    lastReplyAt: "2026-10-21T14:10:00Z",
  },
  {
    id: "pl-2",
    externalId: "sarandi--sorriso-modelo",
    name: "Sorriso Modelo",
    city: "Sarandi",
    whatsapp: "5544900000002",
    classification: "warm",
    status: "active",
    firstContactAt: "2026-10-22T13:00:00Z",
    lastMessageAt: "2026-10-22T13:00:00Z",
  },
  {
    id: "pl-3",
    externalId: "maringa--odonto-demo",
    name: "Odonto Demo",
    city: "Maringá",
    whatsapp: "5544900000003",
    classification: "hot",
    status: "new",
  },
];

export const sampleProspectMessages: ProspectMessage[] = [
  {
    id: "pm-1",
    leadId: "pl-1",
    direction: "outbound",
    stage: "first",
    body: "Oi! Tudo bem? Sou o Thiago, da TB Fernandes Softwares. Vi o perfil de vocês e reparei que ainda não têm um site próprio. Posso te mostrar uma ideia em 2 minutos?",
    sentAt: "2026-10-20T12:05:00Z",
  },
  {
    id: "pm-2",
    leadId: "pl-1",
    direction: "inbound",
    stage: "reply",
    body: "Oi Thiago, pode mandar sim!",
    sentAt: "2026-10-21T14:10:00Z",
  },
  {
    id: "pm-3",
    leadId: "pl-2",
    direction: "outbound",
    stage: "first",
    body: "Olá, tudo bem? Aqui é o Thiago, da TB Fernandes Softwares. Montei algumas ideias de página para clínicas de Sarandi. Quer ver como ficaria a de vocês?",
    sentAt: "2026-10-22T13:00:00Z",
  },
];
