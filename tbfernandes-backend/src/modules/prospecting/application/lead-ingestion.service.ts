import { Injectable } from '@nestjs/common';
import { Clock, IdGenerator, UnitOfWork } from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  Lead,
  LeadMessage,
  LeadMessageRepository,
  LeadRepository,
  LeadSource,
  MessageDirection,
  MessageStage,
  ProspectingSummary,
} from '../domain';
import { summaryFor } from './lead.service';

export interface IncomingMessage {
  direction: MessageDirection;
  stage: MessageStage;
  body: string;
  sentAt: Date;
}

export interface RecordedMessage {
  message: LeadMessage;
  /** false when the same message had already been recorded (RN-36). */
  created: boolean;
}

/**
 * RF-PRS-03: what the prospecting worker sends. It has no session, so the owner comes from
 * the caller (the configured account) instead of the request.
 */
@Injectable()
export class LeadIngestionService {
  constructor(
    private readonly leads: LeadRepository,
    private readonly messages: LeadMessageRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  /** Creates the lead or updates it from the worker's data; safe to repeat. */
  upsert(ownerId: string, source: LeadSource): Promise<Lead> {
    return this.uow.run(async () => {
      const existing = await this.leads.findByExternalId(
        ownerId,
        source.externalId,
      );
      if (!existing)
        return this.leads.create(
          Lead.create(this.ids.forNewAggregate(), ownerId, source),
        );
      existing.syncFrom(source);
      return this.leads.save(existing);
    });
  }

  record(
    ownerId: string,
    externalId: string,
    incoming: IncomingMessage,
  ): Promise<RecordedMessage> {
    return this.uow.run(async () => {
      const lead = await this.leads.findByExternalId(ownerId, externalId);
      if (!lead) throw new NotFoundError('O lead', externalId);
      const same = await this.messages.findSame(
        ownerId,
        lead.id,
        incoming.direction,
        incoming.sentAt,
      );
      if (same) return { message: same, created: false };
      lead.messageRecorded(incoming.direction, incoming.stage, incoming.sentAt);
      await this.leads.save(lead);
      const message = await this.messages.create(
        LeadMessage.create(this.ids.newId(), ownerId, {
          leadId: lead.id,
          ...incoming,
        }),
      );
      return { message, created: true };
    });
  }

  summary(ownerId: string): Promise<ProspectingSummary> {
    return summaryFor(ownerId, this.leads, this.messages, this.clock);
  }
}
