import {
  BusinessRuleViolationError,
  IsoDate,
  Require,
} from '../../../../common/domain';

export const INTERACTION_KINDS = [
  'MEETING',
  'CALL',
  'MESSAGE',
  'EVENT',
  'REFERRAL',
] as const;
export type InteractionKind = (typeof INTERACTION_KINDS)[number];

/** The editable fields of an interaction. */
export interface InteractionDetails {
  contactId: string;
  date: IsoDate;
  kind: InteractionKind;
  summary: string;
  /** work.task (other module). */
  followUpTaskId: string | null;
}

/** Something that happened with a contact (RF-CTC-02). */
export class Interaction {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: InteractionDetails,
  ) {}

  static create(
    id: string,
    ownerId: string,
    details: InteractionDetails,
  ): Interaction {
    return new Interaction(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Interaction.validated(details),
    );
  }

  /** Rebuilds an interaction already stored; no rules run. */
  static restore(
    id: string,
    ownerId: string,
    details: InteractionDetails,
  ): Interaction {
    return new Interaction(id, ownerId, details);
  }

  get details(): InteractionDetails {
    return { ...this._details };
  }

  update(details: InteractionDetails): void {
    this._details = Interaction.validated(details);
  }

  /** RF-CTC-03: one follow-up per interaction (RN-24). */
  followUpCreated(taskId: string): void {
    if (this._details.followUpTaskId != null) {
      throw new BusinessRuleViolationError(
        'RN-24',
        'Esta interação já tem uma tarefa de follow-up',
      );
    }
    this._details = { ...this._details, followUpTaskId: taskId };
  }

  followUpDeleted(): void {
    this._details = { ...this._details, followUpTaskId: null };
  }

  private static validated(d: InteractionDetails): InteractionDetails {
    return {
      contactId: Require.present(d.contactId, 'contactId'),
      date: Require.present(d.date, 'date'),
      kind: Require.present(d.kind, 'kind'),
      summary: Require.text(d.summary, 'summary', 2000),
      followUpTaskId: d.followUpTaskId ?? null,
    };
  }
}
