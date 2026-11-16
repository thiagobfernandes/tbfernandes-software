export class SendRequestResponse {
  id: string;
  leadId: string;
  stage: string;
  body: string;
  status: string;
  requestedAt: string;
  autoSendAt: string;
  resolvedAt: string | null;
  error: string | null;
}

/** What the worker gets: the request with the lead's own id and number. */
export class WorkerSendRequestResponse extends SendRequestResponse {
  externalId: string;
  whatsapp: string | null;
}

export class WorkerPresenceResponse {
  connected: boolean;
  lastSeenAt: string | null;
}
