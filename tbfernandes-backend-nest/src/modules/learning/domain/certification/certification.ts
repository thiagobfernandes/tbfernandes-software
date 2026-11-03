import {
  BusinessRuleViolationError,
  IsoDate,
  Require,
} from '../../../../common/domain';

export const CERTIFICATION_STATUSES = [
  'PLANNED',
  'STUDYING',
  'OBTAINED',
  'EXPIRED',
] as const;
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

/** The editable fields of a certification. */
export interface CertificationDetails {
  name: string;
  issuer: string;
  status: CertificationStatus | null;
  obtainedAt: IsoDate | null;
  expiresAt: IsoDate | null;
  validationUrl: string | null;
  studyIds: string[];
}

/** A certification, planned or obtained (RF-LRN-04, RN-14). */
export class Certification {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: CertificationDetails,
  ) {}

  static create(id: string, ownerId: string, details: CertificationDetails) {
    return new Certification(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Certification.validated(details),
    );
  }

  /** Rebuilds a certification already stored; no rules run. */
  static restore(id: string, ownerId: string, details: CertificationDetails) {
    return new Certification(id, ownerId, details);
  }

  get details(): CertificationDetails {
    return { ...this._details, studyIds: [...this._details.studyIds] };
  }

  get status(): CertificationStatus {
    return this._details.status ?? 'PLANNED';
  }

  update(details: CertificationDetails): void {
    this._details = Certification.validated(details);
  }

  /** LRN-06: obtained and expiring between `from` and `to`, both included. */
  expiresBetween(from: IsoDate, to: IsoDate): boolean {
    const expires = this._details.expiresAt;
    return (
      this.status === 'OBTAINED' &&
      expires != null &&
      expires >= from &&
      expires <= to
    );
  }

  private static validated(d: CertificationDetails): CertificationDetails {
    const status = d.status ?? 'PLANNED';
    if (status === 'OBTAINED' && d.obtainedAt == null) {
      throw new BusinessRuleViolationError(
        'RN-14',
        'Uma certificação obtida precisa da data de obtenção',
      );
    }
    if (d.obtainedAt && d.expiresAt && d.expiresAt <= d.obtainedAt) {
      throw new BusinessRuleViolationError(
        'RN-14',
        'O vencimento precisa ser depois da data de obtenção',
      );
    }
    return {
      name: Require.text(d.name, 'name', 200),
      issuer: Require.text(d.issuer, 'issuer', 120),
      status,
      obtainedAt: d.obtainedAt ?? null,
      expiresAt: d.expiresAt ?? null,
      validationUrl: Require.optionalText(
        d.validationUrl,
        'validationUrl',
        2000,
      ),
      studyIds: [...new Set(d.studyIds ?? [])],
    };
  }
}
