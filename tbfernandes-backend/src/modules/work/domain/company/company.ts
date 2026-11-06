import { IsoDate, Require } from '../../../../common/domain';

export const COMPANY_RELATIONSHIPS = [
  'CONTRACTOR',
  'CLIENT',
  'PARTNER',
  'OWN',
] as const;
export type CompanyRelationship = (typeof COMPANY_RELATIONSHIPS)[number];

export const COMPANY_STATUSES = ['ACTIVE', 'INACTIVE', 'CLOSED'] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export interface CompanyDetails {
  name: string;
  tradeName: string | null;
  relationship: CompanyRelationship;
  status: CompanyStatus | null;
  description: string | null;
  startDate: IsoDate;
  mainContact: string | null;
}

/**
 * A company you work for, with, or own. A company with projects is closed rather than
 * deleted, because projects and history point to it (RN-01).
 */
export class Company {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: CompanyDetails,
  ) {}

  static create(id: string, ownerId: string, details: CompanyDetails): Company {
    return new Company(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Company.validated(details),
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: CompanyDetails,
  ): Company {
    return new Company(id, ownerId, details);
  }

  get details(): CompanyDetails {
    return { ...this._details };
  }

  get status(): CompanyStatus {
    return this._details.status ?? 'ACTIVE';
  }

  update(details: CompanyDetails): void {
    this._details = Company.validated(details);
  }

  private static validated(details: CompanyDetails): CompanyDetails {
    return {
      name: Require.text(details.name, 'name', 120),
      tradeName: Require.optionalText(details.tradeName, 'tradeName', 120),
      relationship: Require.present(details.relationship, 'relationship'),
      status: details.status ?? 'ACTIVE',
      description: Require.optionalText(
        details.description,
        'description',
        2000,
      ),
      startDate: Require.present(details.startDate, 'startDate'),
      mainContact: Require.optionalText(
        details.mainContact,
        'mainContact',
        120,
      ),
    };
  }
}
