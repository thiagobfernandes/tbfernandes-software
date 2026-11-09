import { IsoDate, Require } from '../../../../common/domain';

export interface MilestoneDetails {
  goalId: string;
  title: string;
  dueDate: IsoDate | null;
  done: boolean;
}

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

  static restore(id: string, ownerId: string, details: MilestoneDetails) {
    return new Milestone(id, ownerId, details);
  }

  get details(): MilestoneDetails {
    return { ...this._details };
  }

  update(details: MilestoneDetails): void {
    this._details = Milestone.validated(details);
  }

  private static validated(details: MilestoneDetails): MilestoneDetails {
    return {
      goalId: Require.present(details.goalId, 'goalId'),
      title: Require.text(details.title, 'title', 200),
      dueDate: details.dueDate ?? null,
      done: details.done ?? false,
    };
  }
}
