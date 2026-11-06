import { Certification } from '../../../domain';
import {
  CertificationEntity,
  CertificationStudyEntity,
} from '../certification.entity';

export const CertificationPersistenceMapper = {
  toDomain(entity: CertificationEntity): Certification {
    return Certification.restore(entity.id, entity.ownerId, {
      name: entity.name,
      issuer: entity.issuer,
      status: entity.status,
      obtainedAt: entity.obtainedAt,
      expiresAt: entity.expiresAt,
      validationUrl: entity.validationUrl,
      studyIds: (entity.studies ?? []).map((link) => link.studyId),
    });
  },

  /** The certification row only; study links come from toStudyEntities. */
  toEntity(
    certification: Certification,
    entity: CertificationEntity = new CertificationEntity(),
  ): CertificationEntity {
    const details = certification.details;
    entity.id = certification.id;
    entity.ownerId = certification.ownerId;
    entity.name = details.name;
    entity.issuer = details.issuer;
    entity.status = certification.status;
    entity.obtainedAt = details.obtainedAt;
    entity.expiresAt = details.expiresAt;
    entity.validationUrl = details.validationUrl;
    delete entity.studies;
    return entity;
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
