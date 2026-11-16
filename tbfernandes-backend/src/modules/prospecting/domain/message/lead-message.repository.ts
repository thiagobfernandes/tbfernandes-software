import { LeadMessage, MessageDirection } from './lead-message';

export abstract class LeadMessageRepository {
  abstract create(message: LeadMessage): Promise<LeadMessage>;
  abstract save(message: LeadMessage): Promise<LeadMessage>;
  /** Newest first; all of the owner's when leadId is null. */
  abstract findAll(
    ownerId: string,
    leadId: string | null,
  ): Promise<LeadMessage[]>;
  /** RN-36: the same message sent again by the worker. */
  abstract findSame(
    ownerId: string,
    leadId: string,
    direction: MessageDirection,
    sentAt: Date,
  ): Promise<LeadMessage | null>;
}
