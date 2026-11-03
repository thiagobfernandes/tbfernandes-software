import { IsoDate, Require } from '../../../../common/domain';

export const PROJECT_CATEGORIES = [
  'PROFESSIONAL',
  'PERSONAL',
  'STUDY',
  'RESEARCH',
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_STATUSES = [
  'PLANNED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_COLORS = [
  'TEAL',
  'VIOLET',
  'AMBER',
  'ROSE',
  'SKY',
] as const;
export type ProjectColor = (typeof PROJECT_COLORS)[number];

/** The editable fields of a project. goalId points to the goals module (no FK). */
export interface ProjectDetails {
  name: string;
  description: string | null;
  companyId: string | null;
  category: ProjectCategory;
  status: ProjectStatus | null;
  color: ProjectColor | null;
  startDate: IsoDate;
  dueDate: IsoDate | null;
  nextDelivery: string | null;
  goalId: string | null;
}

/** A body of work, optionally for a company. Deleting it keeps its tasks (RN-01). */
export class Project {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: ProjectDetails,
  ) {}

  static create(id: string, ownerId: string, details: ProjectDetails): Project {
    return new Project(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Project.validated(details),
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: ProjectDetails,
  ): Project {
    return new Project(id, ownerId, details);
  }

  get details(): ProjectDetails {
    return { ...this._details };
  }

  get status(): ProjectStatus {
    return this._details.status ?? 'PLANNED';
  }

  update(details: ProjectDetails): void {
    this._details = Project.validated(details);
  }

  private static validated(d: ProjectDetails): ProjectDetails {
    Require.present(d.startDate, 'startDate');
    Require.dateOrder(d.startDate, d.dueDate, 'dueDate');
    return {
      name: Require.text(d.name, 'name', 120),
      description: Require.optionalText(d.description, 'description', 2000),
      companyId: d.companyId ?? null,
      category: Require.present(d.category, 'category'),
      status: d.status ?? 'PLANNED',
      color: d.color ?? 'TEAL',
      startDate: d.startDate,
      dueDate: d.dueDate ?? null,
      nextDelivery: Require.optionalText(d.nextDelivery, 'nextDelivery', 200),
      goalId: d.goalId ?? null,
    };
  }
}
