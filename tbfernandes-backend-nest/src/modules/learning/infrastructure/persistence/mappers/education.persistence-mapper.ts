import { Education } from '../../../domain';
import { EducationEntity } from '../education.entity';

/** Education ↔ learning.education row. */
export const EducationPersistenceMapper = {
  toDomain(e: EducationEntity): Education {
    return Education.restore(e.id, e.ownerId, {
      institution: e.institution,
      course: e.course,
      degree: e.degree,
      status: e.status,
      startDate: e.startDate,
      endDate: e.endDate,
    });
  },

  toEntity(ed: Education, e: EducationEntity = new EducationEntity()) {
    Object.assign(e, ed.details, { id: ed.id, ownerId: ed.ownerId });
    return e;
  },
};
