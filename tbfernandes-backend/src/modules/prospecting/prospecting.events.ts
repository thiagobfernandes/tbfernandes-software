import { DomainEvent } from '../../common/domain';

/** What happened in prospecting that the user should hear about (notifications listen). */
export const ProspectingEvents = {
  sendRequested: 'prospecting.send-requested',
  replyReceived: 'prospecting.reply-received',
  optedOut: 'prospecting.opted-out',
  sendFailed: 'prospecting.send-failed',
} as const;

interface LeadEvent extends DomainEvent {
  leadId: string;
  leadName: string;
}

/** A message waits for approval; untouched, it goes out at autoSendAt (RN-37). */
export interface SendRequested extends LeadEvent {
  type: typeof ProspectingEvents.sendRequested;
  requestId: string;
  stage: string;
  autoSendAt: string;
}

export interface ReplyReceived extends LeadEvent {
  type: typeof ProspectingEvents.replyReceived;
  body: string;
}

export interface OptedOut extends LeadEvent {
  type: typeof ProspectingEvents.optedOut;
}

export interface SendFailed extends LeadEvent {
  type: typeof ProspectingEvents.sendFailed;
  error: string | null;
}
