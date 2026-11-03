import { IsoDate, Require } from '../../../../common/domain';

/** The editable fields of a milestone. */
export interface MilestoneDetails {
  goalId: string;
  title: string;
  dueDate: IsoDate | null;
  done: boolean;
}

/** A checkpoint of a goal (RF-GOL-03). */
export class Milestone {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: MilestoneDetails,
  ) {}

  static create(id: string, ownerId: string, details: MilestoneDetails) {
    return new Milestone(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Milestone.validated(details),
    );
  }

  /** Rebuilds a milestone already stored; no rules run. */
  static restore(id: string, ownerId: string, details: MilestoneDetails) {
    return new Milestone(id, ownerId, details);
  }

  get details(): MilestoneDetails {
    return { ...this._details };
  }

  update(details: MilestoneDetails): void {
    this._details = Milestone.validated(details);
  }

  private static validated(d: MilestoneDetails): MilestoneDetails {
    return {
      goalId: Require.present(d.goalId, 'goalId'),
      title: Require.text(d.title, 'title', 200),
      dueDate: d.dueDate ?? null,
      done: d.done ?? false,
    };
  }
}
