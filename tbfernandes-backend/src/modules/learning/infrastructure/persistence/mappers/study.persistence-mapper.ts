import { Study } from '../../../domain';
import { StudyEntity, StudySkillEntity } from '../study.entity';

export const StudyPersistenceMapper = {
  toDomain(entity: StudyEntity): Study {
    return Study.restore(entity.id, entity.ownerId, {
      name: entity.name,
      description: entity.description,
      status: entity.status,
      goalId: entity.goalId,
      skillIds: (entity.skills ?? []).map((link) => link.skillId),
      startDate: entity.startDate,
      dueDate: entity.dueDate,
      nextActivity: entity.nextActivity,
    });
  },

  /** The study row only; skill links come from toSkillEntities. */
  toEntity(study: Study, entity: StudyEntity = new StudyEntity()): StudyEntity {
    const details = study.details;
    entity.id = study.id;
    entity.ownerId = study.ownerId;
    entity.name = details.name;
    entity.description = details.description;
    entity.status = study.status;
    entity.goalId = details.goalId;
    entity.startDate = details.startDate;
    entity.dueDate = details.dueDate;
    entity.nextActivity = details.nextActivity;
    delete entity.skills;
    return entity;
  },

  toSkillEntities(study: Study): StudySkillEntity[] {
    return study.details.skillIds.map((skillId) =>
      Object.assign(new StudySkillEntity(), { studyId: study.id, skillId }),
    );
  },
};
