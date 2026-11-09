import { Project } from '../../../domain';
import { ProjectEntity } from '../project.entity';

export const ProjectPersistenceMapper = {
  toDomain(entity: ProjectEntity): Project {
    return Project.restore(entity.id, entity.ownerId, {
      name: entity.name,
      description: entity.description,
      companyId: entity.companyId,
      category: entity.category,
      status: entity.status,
      color: entity.color,
      startDate: entity.startDate,
      dueDate: entity.dueDate,
      nextDelivery: entity.nextDelivery,
      goalId: entity.goalId,
    });
  },

  toEntity(
    project: Project,
    entity: ProjectEntity = new ProjectEntity(),
  ): ProjectEntity {
    const details = project.details;
    entity.id = project.id;
    entity.ownerId = project.ownerId;
    entity.name = details.name;
    entity.description = details.description;
    entity.companyId = details.companyId;
    entity.category = details.category;
    entity.status = project.status;
    entity.color = details.color ?? 'TEAL';
    entity.startDate = details.startDate;
    entity.dueDate = details.dueDate;
    entity.nextDelivery = details.nextDelivery;
    entity.goalId = details.goalId;
    return entity;
  },
};
