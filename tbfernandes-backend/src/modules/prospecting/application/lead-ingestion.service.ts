import { Injectable } from '@nestjs/common';
import {
  Clock,
  EventPublisher,
  IdGenerator,
  UnitOfWork,
} from '../../../common/application';
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
import {
  ProspectingEvents,
  type OptedOut,
  type ReplyReceived,
} from '../prospecting.events';
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
    private readonly events: EventPublisher,
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
      this.announce(ownerId, lead, incoming);
      return { message, created: true };
    });
  }

  /** RN-38: marks a received message as an automatic greeting (or back) and recounts the lead. */
  reclassify(
    ownerId: string,
    externalId: string,
    sentAt: Date,
    stage: 'REPLY' | 'AUTO_REPLY',
  ): Promise<LeadMessage> {
    return this.uow.run(async () => {
      const lead = await this.leads.findByExternalId(ownerId, externalId);
      if (!lead) throw new NotFoundError('O lead', externalId);
      const message = await this.messages.findSame(
        ownerId,
        lead.id,
        'INBOUND',
        sentAt,
      );
      if (!message) throw new NotFoundError('A mensagem', sentAt.toISOString());
      message.reclassify(stage);
      const saved = await this.messages.save(message);
      const replies = (await this.messages.findAll(ownerId, lead.id)).filter(
        (item) =>
          item.details.direction === 'INBOUND' &&
          (item.details.stage === 'REPLY' || item.details.stage === 'OPT_OUT'),
      );
      const last = replies.reduce<Date | null>(
        (latestSoFar, item) =>
          latestSoFar == null || item.details.sentAt > latestSoFar
            ? item.details.sentAt
            : latestSoFar,
        null,
      );
      lead.repliesRecounted(last);
      await this.leads.save(lead);
      return saved;
    });
  }

  /** Replies and opt-outs are worth a notification; automatic greetings are not (RN-38). */
  private announce(
    ownerId: string,
    lead: Lead,
    incoming: IncomingMessage,
  ): void {
    if (incoming.direction !== 'INBOUND') return;
    const base = { ownerId, leadId: lead.id, leadName: lead.details.name };
    if (incoming.stage === 'REPLY')
      this.events.publish<ReplyReceived>({
        ...base,
        type: ProspectingEvents.replyReceived,
        body: incoming.body,
      });
    else if (incoming.stage === 'OPT_OUT')
      this.events.publish<OptedOut>({
        ...base,
        type: ProspectingEvents.optedOut,
      });
  }

  summary(ownerId: string): Promise<ProspectingSummary> {
    return summaryFor(ownerId, this.leads, this.messages, this.clock);
  }
}
