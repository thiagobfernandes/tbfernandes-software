export type LeadStatus =
  | "new"
  | "active"
  | "replied"
  | "opted_out"
  | "no_whatsapp"
  | "done"
  | "error"
  | "converted";

export type LeadClassification = "hot" | "warm" | "cold" | "skip";

/** A business approached by the prospecting worker (tb-site-factory). */
export type ProspectLead = {
  id: string;
  externalId: string;
  name: string;
  city?: string;
  whatsapp?: string;
  instagram?: string;
  mapsUrl?: string;
  classification?: LeadClassification;
  status: LeadStatus;
  notes?: string;
  /** ISO instants. */
  firstContactAt?: string;
  lastMessageAt?: string;
  lastReplyAt?: string;
};

export type MessageDirection = "outbound" | "inbound";
export type MessageStage =
  "first" | "follow_up_1" | "follow_up_2" | "reply" | "opt_out";

export type ProspectMessage = {
  id: string;
  leadId: string;
  direction: MessageDirection;
  stage: MessageStage;
  body: string;
  sentAt: string;
};
