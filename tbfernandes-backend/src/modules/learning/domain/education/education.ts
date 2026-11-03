import { IsoDate, Require } from '../../../../common/domain';

export const EDUCATION_STATUSES = [
  'IN_PROGRESS',
  'COMPLETED',
  'PAUSED',
] as const;
export type EducationStatus = (typeof EDUCATION_STATUSES)[number];

/** The editable fields of an education entry. */
export interface EducationDetails {
  institution: string;
  course: string;
  degree: string;
  status: EducationStatus;
  startDate: IsoDate;
  endDate: IsoDate | null;
}

/** Formal education: degree, course, institution (RF-LRN-05). */
export class Education {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: EducationDetails,
  ) {}

  static create(id: string, ownerId: string, details: EducationDetails) {
    return new Education(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Education.validated(details),
    );
  }

  /** Rebuilds an education entry already stored; no rules run. */
  static restore(id: string, ownerId: string, details: EducationDetails) {
    return new Education(id, ownerId, details);
  }

  get details(): EducationDetails {
    return { ...this._details };
  }

  update(details: EducationDetails): void {
    this._details = Education.validated(details);
  }

  private static validated(d: EducationDetails): EducationDetails {
    Require.present(d.startDate, 'startDate');
    Require.dateOrder(d.startDate, d.endDate, 'endDate');
    return {
      institution: Require.text(d.institution, 'institution', 200),
      course: Require.text(d.course, 'course', 200),
      degree: Require.text(d.degree, 'degree', 80),
      status: Require.present(d.status, 'status'),
      startDate: d.startDate,
      endDate: d.endDate ?? null,
    };
  }
}
