import { Skill } from '../../../domain';
import { SkillEntity } from '../skill.entity';

/** Skill ↔ learning.skill row. */
export const SkillPersistenceMapper = {
  toDomain(e: SkillEntity): Skill {
    return Skill.restore(e.id, e.ownerId, {
      name: e.name,
      level: e.level,
      evidence: e.evidence,
    });
  },

  toEntity(skill: Skill, e: SkillEntity = new SkillEntity()): SkillEntity {
    Object.assign(e, skill.details, { id: skill.id, ownerId: skill.ownerId });
    return e;
  },
};
