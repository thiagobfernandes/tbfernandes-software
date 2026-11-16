export class LeadResponse {
  id: string;
  externalId: string;
  name: string;
  city: string | null;
  whatsapp: string | null;
  instagram: string | null;
  mapsUrl: string | null;
  classification: string | null;
  status: string;
  notes: string | null;
  firstContactAt: string | null;
  lastMessageAt: string | null;
  lastReplyAt: string | null;
}

export class LeadMessageResponse {
  id: string;
  leadId: string;
  direction: string;
  stage: string;
  body: string;
  sentAt: string;
}

export class ProspectingSummaryResponse {
  leads: number;
  contacted: number;
  replied: number;
  optedOut: number;
  converted: number;
  replyRate: number;
  messagesSent: number;
  byStatus: Record<string, number>;
  byClassification: Record<string, number>;
  byCity: { city: string; leads: number; contacted: number; replied: number }[];
  daily: { date: string; sent: number; replies: number }[];
}
