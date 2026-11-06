import { Require } from '../../../../common/domain';

export const MATERIAL_TYPES = [
  'VIDEO',
  'ARTICLE',
  'BOOK',
  'DOCS',
  'COURSE',
  'REPOSITORY',
  'PAPER',
  'NOTE',
] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const MATERIAL_STATUSES = [
  'TO_CONSUME',
  'IN_PROGRESS',
  'CONSUMED',
  'REVIEWED',
] as const;
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export interface MaterialDetails {
  studyId: string | null;
  title: string;
  type: MaterialType;
  url: string | null;
  status: MaterialStatus | null;
  notes: string | null;
}

export class Material {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: MaterialDetails,
  ) {}

  static create(id: string, ownerId: string, details: MaterialDetails) {
    return new Material(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Material.validated(details),
    );
  }

  static restore(id: string, ownerId: string, details: MaterialDetails) {
    return new Material(id, ownerId, details);
  }

  get details(): MaterialDetails {
    return { ...this._details };
  }

  get status(): MaterialStatus {
    return this._details.status ?? 'TO_CONSUME';
  }

  update(details: MaterialDetails): void {
    this._details = Material.validated(details);
  }

  private static validated(details: MaterialDetails): MaterialDetails {
    return {
      studyId: details.studyId ?? null,
      title: Require.text(details.title, 'title', 300),
      type: Require.present(details.type, 'type'),
      url: Require.optionalText(details.url, 'url', 2000),
      status: details.status ?? 'TO_CONSUME',
      notes: Require.optionalText(details.notes, 'notes', 5000),
    };
  }
}
