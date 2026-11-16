import { BusinessRuleViolationError, Require } from '../../../../common/domain';
import type { MessageStage } from '../message/lead-message';

export const SEND_REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'SENDING',
  'SENT',
  'FAILED',
  'CANCELLED',
] as const;
export type SendRequestStatus = (typeof SEND_REQUEST_STATUSES)[number];

/** Stages the worker asks to send; replies are never requested. */
export const SENDABLE_STAGES = ['FIRST', 'FOLLOW_UP_1', 'FOLLOW_UP_2'] as const;
export type SendableStage = (typeof SENDABLE_STAGES)[number] & MessageStage;

/** RN-37: without the user's answer, a request goes out on its own after this long. */
export const AUTO_SEND_AFTER_MS = 60 * 60 * 1000;

export interface SendRequestDetails {
  leadId: string;
  stage: SendableStage;
  body: string;
  status: SendRequestStatus;
  requestedAt: Date;
  autoSendAt: Date;
  resolvedAt: Date | null;
  error: string | null;
}

const OPEN: readonly SendRequestStatus[] = ['PENDING', 'APPROVED'];

/**
 * A message the worker is about to send (RF-PRS-05). The user approves it to send now or
 * cancels it; untouched, it is ready an hour after it was asked (RN-37). The worker claims it
 * before sending, so a cancel that arrives first always wins.
 */
export class SendRequest {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: SendRequestDetails,
  ) {}

  static create(
    id: string,
    ownerId: string,
    request: { leadId: string; stage: SendableStage; body: string },
    now: Date,
  ): SendRequest {
    return new SendRequest(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      {
        leadId: Require.present(request.leadId, 'leadId'),
        stage: Require.present(request.stage, 'stage'),
        body: Require.text(request.body, 'body', 4000),
        status: 'PENDING',
        requestedAt: now,
        autoSendAt: new Date(now.getTime() + AUTO_SEND_AFTER_MS),
        resolvedAt: null,
        error: null,
      },
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: SendRequestDetails,
  ): SendRequest {
    return new SendRequest(id, ownerId, details);
  }

  get details(): SendRequestDetails {
    return { ...this._details };
  }

  get open(): boolean {
    return OPEN.includes(this._details.status);
  }

  isReady(now: Date): boolean {
    const { status, autoSendAt } = this._details;
    return status === 'APPROVED' || (status === 'PENDING' && now >= autoSendAt);
  }

  approve(): void {
    this.requireStatus(['PENDING'], 'Este envio já foi decidido');
    this._details = { ...this._details, status: 'APPROVED' };
  }

  cancel(now: Date): void {
    this.requireStatus(OPEN, 'Este envio não pode mais ser cancelado');
    this._details = { ...this._details, status: 'CANCELLED', resolvedAt: now };
  }

  /** The worker is about to send: only a ready request, and only once. */
  claim(now: Date): void {
    if (!this.isReady(now)) {
      throw new BusinessRuleViolationError(
        'RN-37',
        'Este envio não está liberado: aguarde a aprovação ou o prazo de 1 hora',
      );
    }
    this._details = { ...this._details, status: 'SENDING' };
  }

  finish(sent: boolean, error: string | null, now: Date): void {
    this.requireStatus(['SENDING'], 'Este envio não foi reservado pelo worker');
    this._details = {
      ...this._details,
      status: sent ? 'SENT' : 'FAILED',
      error: sent ? null : Require.optionalText(error, 'error', 2000),
      resolvedAt: now,
    };
  }

  private requireStatus(
    allowed: readonly SendRequestStatus[],
    message: string,
  ): void {
    if (!allowed.includes(this._details.status))
      throw new BusinessRuleViolationError('RN-37', message);
  }
}
