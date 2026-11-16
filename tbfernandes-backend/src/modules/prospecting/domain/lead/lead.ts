import { BusinessRuleViolationError, Require } from '../../../../common/domain';
import type { MessageDirection, MessageStage } from '../message/lead-message';

export const LEAD_STATUSES = [
  'NEW',
  'ACTIVE',
  'REPLIED',
  'OPTED_OUT',
  'NO_WHATSAPP',
  'DONE',
  'ERROR',
  'CONVERTED',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_CLASSIFICATIONS = ['HOT', 'WARM', 'COLD', 'SKIP'] as const;
export type LeadClassification = (typeof LEAD_CLASSIFICATIONS)[number];

/** What the prospecting worker (tb-site-factory) knows about a lead. */
export interface LeadSource {
  /** The worker's own id (city + name slug); unique per owner. */
  externalId: string;
  name: string;
  city: string | null;
  whatsapp: string | null;
  instagram: string | null;
  mapsUrl: string | null;
  classification: LeadClassification | null;
  status: LeadStatus;
}

export interface LeadDetails extends LeadSource {
  notes: string | null;
  firstContactAt: Date | null;
  lastMessageAt: Date | null;
  lastReplyAt: Date | null;
}

/** Statuses only the user changes; a later sync from the worker keeps them (RN-35). */
const STICKY: readonly LeadStatus[] = ['OPTED_OUT', 'CONVERTED'];

/**
 * A business approached through automated prospecting (RF-PRS-01). The worker owns the
 * contact data and the sending status; the user owns notes and the final outcome.
 */
export class Lead {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: LeadDetails,
  ) {}

  static create(id: string, ownerId: string, source: LeadSource): Lead {
    return new Lead(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      {
        ...Lead.validated(source),
        notes: null,
        firstContactAt: null,
        lastMessageAt: null,
        lastReplyAt: null,
      },
    );
  }

  static restore(id: string, ownerId: string, details: LeadDetails): Lead {
    return new Lead(id, ownerId, details);
  }

  get details(): LeadDetails {
    return { ...this._details };
  }

  get contacted(): boolean {
    return this._details.firstContactAt != null;
  }

  /** RN-35: an opt-out or a conversion is never undone by the worker. */
  syncFrom(source: LeadSource): void {
    const validated = Lead.validated(source);
    const status = STICKY.includes(this._details.status)
      ? this._details.status
      : validated.status;
    this._details = { ...this._details, ...validated, status };
  }

  /** The user's own follow-up: outcome and notes. */
  review(status: LeadStatus, notes: string | null): void {
    this._details = {
      ...this._details,
      status: Require.present(status, 'status'),
      notes: Require.optionalText(notes, 'notes', 5000),
    };
  }

  /** RF-PRS-02: keeps contact dates and status in step with the conversation. */
  messageRecorded(
    direction: MessageDirection,
    stage: MessageStage,
    at: Date,
  ): void {
    if (direction === 'OUTBOUND') this.sent(stage, at);
    else this.received(stage, at);
  }

  private sent(stage: MessageStage, at: Date): void {
    if (this._details.status === 'OPTED_OUT') {
      throw new BusinessRuleViolationError(
        'RN-35',
        'Este lead pediu para não receber mensagens',
      );
    }
    const details = this._details;
    let status = details.status;
    if (status === 'NEW') status = 'ACTIVE';
    if (stage === 'FOLLOW_UP_2' && status === 'ACTIVE') status = 'DONE';
    this._details = {
      ...details,
      status,
      firstContactAt: earliest(details.firstContactAt, at),
      lastMessageAt: latest(details.lastMessageAt, at),
    };
  }

  private received(stage: MessageStage, at: Date): void {
    const details = this._details;
    if (stage === 'AUTO_REPLY') {
      this._details = {
        ...details,
        lastMessageAt: latest(details.lastMessageAt, at),
      };
      return;
    }
    let status: LeadStatus = details.status;
    if (stage === 'OPT_OUT') status = 'OPTED_OUT';
    else if (!STICKY.includes(status)) status = 'REPLIED';
    this._details = {
      ...details,
      status,
      lastMessageAt: latest(details.lastMessageAt, at),
      lastReplyAt: latest(details.lastReplyAt, at),
    };
  }

  /**
   * RN-38: after a reply turned out to be an automatic greeting, the last real reply is the
   * one given; with none left, a lead marked as replied goes back to waiting for one.
   */
  repliesRecounted(lastRealReply: Date | null): void {
    const details = this._details;
    const status =
      lastRealReply == null && details.status === 'REPLIED'
        ? 'ACTIVE'
        : details.status;
    this._details = { ...details, lastReplyAt: lastRealReply, status };
  }

  private static validated(source: LeadSource): LeadSource {
    return {
      externalId: Require.text(source.externalId, 'externalId', 120),
      name: Require.text(source.name, 'name', 200),
      city: Require.optionalText(source.city, 'city', 120),
      whatsapp: Require.optionalText(source.whatsapp, 'whatsapp', 40),
      instagram: Require.optionalText(source.instagram, 'instagram', 2000),
      mapsUrl: Require.optionalText(source.mapsUrl, 'mapsUrl', 2000),
      classification: source.classification ?? null,
      status: Require.present(source.status, 'status'),
    };
  }
}

function earliest(current: Date | null, candidate: Date): Date {
  return current != null && current <= candidate ? current : candidate;
}

function latest(current: Date | null, candidate: Date): Date {
  return current != null && current >= candidate ? current : candidate;
}
