import { BusinessRuleViolationError, Require } from '../../../../common/domain';

export const MESSAGE_DIRECTIONS = ['OUTBOUND', 'INBOUND'] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_STAGES = [
  'FIRST',
  'FOLLOW_UP_1',
  'FOLLOW_UP_2',
  'REPLY',
  'OPT_OUT',
  /** Written by the user in the chat. */
  'MANUAL',
  /** A business's automatic greeting: neither a reply nor a reason to stop (RN-38). */
  'AUTO_REPLY',
] as const;
export type MessageStage = (typeof MESSAGE_STAGES)[number];

export interface LeadMessageDetails {
  leadId: string;
  direction: MessageDirection;
  stage: MessageStage;
  body: string;
  sentAt: Date;
}

/** One WhatsApp message sent to or received from a lead (RF-PRS-02). Never edited. */
export class LeadMessage {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: LeadMessageDetails,
  ) {}

  static create(
    id: string,
    ownerId: string,
    details: LeadMessageDetails,
  ): LeadMessage {
    return new LeadMessage(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      {
        leadId: Require.present(details.leadId, 'leadId'),
        direction: Require.present(details.direction, 'direction'),
        stage: Require.present(details.stage, 'stage'),
        body: Require.text(details.body, 'body', 4000),
        sentAt: Require.present(details.sentAt, 'sentAt'),
      },
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: LeadMessageDetails,
  ): LeadMessage {
    return new LeadMessage(id, ownerId, details);
  }

  get details(): LeadMessageDetails {
    return { ...this._details };
  }

  /** RN-38: an inbound message only moves between a reply and an automatic greeting. */
  reclassify(stage: 'REPLY' | 'AUTO_REPLY'): void {
    const { direction, stage: current } = this._details;
    if (
      direction !== 'INBOUND' ||
      (current !== 'REPLY' && current !== 'AUTO_REPLY')
    ) {
      throw new BusinessRuleViolationError(
        'RN-38',
        'Só uma resposta recebida pode virar automática, e vice-versa',
      );
    }
    this._details = { ...this._details, stage };
  }
}
