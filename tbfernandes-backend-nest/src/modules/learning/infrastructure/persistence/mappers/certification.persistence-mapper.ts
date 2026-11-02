import { Certification } from '../../../domain';
import {
  CertificationEntity,
  CertificationStudyEntity,
} from '../certification.entity';

/** Certification ↔ learning.certification row and its certification_study rows. */
export const CertificationPersistenceMapper = {
  toDomain(e: CertificationEntity): Certification {
    return Certification.restore(e.id, e.ownerId, {
      name: e.name,
      issuer: e.issuer,
      status: e.status,
      obtainedAt: e.obtainedAt,
      expiresAt: e.expiresAt,
      validationUrl: e.validationUrl,
      studyIds: (e.studies ?? []).map((link) => link.studyId),
    });
  },

  /** The certification row only; study links come from toStudyEntities. */
  toEntity(
    certification: Certification,
    e: CertificationEntity = new CertificationEntity(),
  ): CertificationEntity {
    const d = certification.details;
    e.id = certification.id;
    e.ownerId = certification.ownerId;
    e.name = d.name;
    e.issuer = d.issuer;
    e.status = certification.status;
    e.obtainedAt = d.obtainedAt;
    e.expiresAt = d.expiresAt;
    e.validationUrl = d.validationUrl;
    delete e.studies;
    return e;
  },

  toStudyEntities(certification: Certification): CertificationStudyEntity[] {
    return certification.details.studyIds.map((studyId) =>
      Object.assign(new CertificationStudyEntity(), {
        certificationId: certification.id,
        studyId,
      }),
    );
  },
};
