import { Skill } from '../../../domain';
import { SkillEntity } from '../skill.entity';

export const SkillPersistenceMapper = {
  toDomain(entity: SkillEntity): Skill {
    return Skill.restore(entity.id, entity.ownerId, {
      name: entity.name,
      level: entity.level,
      evidence: entity.evidence,
    });
  },

  toEntity(skill: Skill, entity: SkillEntity = new SkillEntity()): SkillEntity {
    Object.assign(entity, skill.details, {
      id: skill.id,
      ownerId: skill.ownerId,
    });
    return entity;
  },
};
