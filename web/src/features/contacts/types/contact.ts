export type Contact = {
  id: string;
  name: string;
  companyId?: string;
  /** For organizations not registered as companies. */
  companyName?: string;
  role?: string;
  email?: string;
  phone?: string;
  profileUrl?: string;
  specialties: string[];
  /** How you met and why the relationship matters. */
  context?: string;
  nextContact?: string;
  notes?: string;
};

export type InteractionKind =
  "meeting" | "call" | "message" | "event" | "referral";

export type Interaction = {
  id: string;
  contactId: string;
  date: string;
  kind: InteractionKind;
  summary: string;
  followUpTaskId?: string;
};
