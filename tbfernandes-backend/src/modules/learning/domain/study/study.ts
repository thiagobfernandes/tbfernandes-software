import { IsoDate, Require } from '../../../../common/domain';

export const STUDY_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'PAUSED',
  'COMPLETED',
] as const;
export type StudyStatus = (typeof STUDY_STATUSES)[number];

export interface StudyDetails {
  name: string;
  description: string | null;
  status: StudyStatus | null;
  /** goals.goal (other module, no FK). */
  goalId: string | null;
  skillIds: string[];
  startDate: IsoDate | null;
  dueDate: IsoDate | null;
  nextActivity: string | null;
}

export class Study {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: StudyDetails,
  ) {}

  static create(id: string, ownerId: string, details: StudyDetails): Study {
    return new Study(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Study.validated(details),
    );
  }

  static restore(id: string, ownerId: string, details: StudyDetails): Study {
    return new Study(id, ownerId, details);
  }

  get details(): StudyDetails {
    return { ...this._details, skillIds: [...this._details.skillIds] };
  }

  get status(): StudyStatus {
    return this._details.status ?? 'PLANNED';
  }

  update(details: StudyDetails): void {
    this._details = Study.validated(details);
  }

  private static validated(details: StudyDetails): StudyDetails {
    Require.dateOrder(details.startDate, details.dueDate, 'dueDate');
    return {
      name: Require.text(details.name, 'name', 200),
      description: Require.optionalText(
        details.description,
        'description',
        2000,
      ),
      status: details.status ?? 'PLANNED',
      goalId: details.goalId ?? null,
      skillIds: [...new Set(details.skillIds ?? [])],
      startDate: details.startDate ?? null,
      dueDate: details.dueDate ?? null,
      nextActivity: Require.optionalText(
        details.nextActivity,
        'nextActivity',
        300,
      ),
    };
  }
}
