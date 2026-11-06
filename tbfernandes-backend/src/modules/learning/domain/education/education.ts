import { IsoDate, Require } from '../../../../common/domain';

export const EDUCATION_STATUSES = [
  'IN_PROGRESS',
  'COMPLETED',
  'PAUSED',
] as const;
export type EducationStatus = (typeof EDUCATION_STATUSES)[number];

export interface EducationDetails {
  institution: string;
  course: string;
  degree: string;
  status: EducationStatus;
  startDate: IsoDate;
  endDate: IsoDate | null;
}

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

  static restore(id: string, ownerId: string, details: EducationDetails) {
    return new Education(id, ownerId, details);
  }

  get details(): EducationDetails {
    return { ...this._details };
  }

  update(details: EducationDetails): void {
    this._details = Education.validated(details);
  }

  private static validated(details: EducationDetails): EducationDetails {
    Require.present(details.startDate, 'startDate');
    Require.dateOrder(details.startDate, details.endDate, 'endDate');
    return {
      institution: Require.text(details.institution, 'institution', 200),
      course: Require.text(details.course, 'course', 200),
      degree: Require.text(details.degree, 'degree', 80),
      status: Require.present(details.status, 'status'),
      startDate: details.startDate,
      endDate: details.endDate ?? null,
    };
  }
}
