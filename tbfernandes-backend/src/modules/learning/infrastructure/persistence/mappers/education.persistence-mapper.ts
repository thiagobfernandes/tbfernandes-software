import { Education } from '../../../domain';
import { EducationEntity } from '../education.entity';

export const EducationPersistenceMapper = {
  toDomain(entity: EducationEntity): Education {
    return Education.restore(entity.id, entity.ownerId, {
      institution: entity.institution,
      course: entity.course,
      degree: entity.degree,
      status: entity.status,
      startDate: entity.startDate,
      endDate: entity.endDate,
    });
  },

  toEntity(ed: Education, entity: EducationEntity = new EducationEntity()) {
    Object.assign(entity, ed.details, { id: ed.id, ownerId: ed.ownerId });
    return entity;
  },
};
