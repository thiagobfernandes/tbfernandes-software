import { Study } from '../../../domain';
import { StudyEntity, StudySkillEntity } from '../study.entity';

/** Study ↔ learning.study row and its learning.study_skill rows. */
export const StudyPersistenceMapper = {
  toDomain(e: StudyEntity): Study {
    return Study.restore(e.id, e.ownerId, {
      name: e.name,
      description: e.description,
      status: e.status,
      goalId: e.goalId,
      skillIds: (e.skills ?? []).map((link) => link.skillId),
      startDate: e.startDate,
      dueDate: e.dueDate,
      nextActivity: e.nextActivity,
    });
  },

  /** The study row only; skill links come from toSkillEntities. */
  toEntity(study: Study, e: StudyEntity = new StudyEntity()): StudyEntity {
    const d = study.details;
    e.id = study.id;
    e.ownerId = study.ownerId;
    e.name = d.name;
    e.description = d.description;
    e.status = study.status;
    e.goalId = d.goalId;
    e.startDate = d.startDate;
    e.dueDate = d.dueDate;
    e.nextActivity = d.nextActivity;
    delete e.skills;
    return e;
  },

  toSkillEntities(study: Study): StudySkillEntity[] {
    return study.details.skillIds.map((skillId) =>
      Object.assign(new StudySkillEntity(), { studyId: study.id, skillId }),
    );
  },
};
