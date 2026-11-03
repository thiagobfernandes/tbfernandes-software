import { IsoDate, Require } from '../../../../common/domain';

export const STUDY_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'PAUSED',
  'COMPLETED',
] as const;
export type StudyStatus = (typeof STUDY_STATUSES)[number];

/** The editable fields of a study plan. */
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

/** A study plan (RF-LRN-01). */
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

  /** Rebuilds a study already stored; no rules run. */
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

  private static validated(d: StudyDetails): StudyDetails {
    Require.dateOrder(d.startDate, d.dueDate, 'dueDate');
    return {
      name: Require.text(d.name, 'name', 200),
      description: Require.optionalText(d.description, 'description', 2000),
      status: d.status ?? 'PLANNED',
      goalId: d.goalId ?? null,
      skillIds: [...new Set(d.skillIds ?? [])],
      startDate: d.startDate ?? null,
      dueDate: d.dueDate ?? null,
      nextActivity: Require.optionalText(d.nextActivity, 'nextActivity', 300),
    };
  }
}
