import { Project } from '../../../domain';
import { ProjectEntity } from '../project.entity';

/** Project ↔ work.project row. */
export const ProjectPersistenceMapper = {
  toDomain(e: ProjectEntity): Project {
    return Project.restore(e.id, e.ownerId, {
      name: e.name,
      description: e.description,
      companyId: e.companyId,
      category: e.category,
      status: e.status,
      color: e.color,
      startDate: e.startDate,
      dueDate: e.dueDate,
      nextDelivery: e.nextDelivery,
      goalId: e.goalId,
    });
  },

  toEntity(
    project: Project,
    e: ProjectEntity = new ProjectEntity(),
  ): ProjectEntity {
    const d = project.details;
    e.id = project.id;
    e.ownerId = project.ownerId;
    e.name = d.name;
    e.description = d.description;
    e.companyId = d.companyId;
    e.category = d.category;
    e.status = project.status;
    e.color = d.color ?? 'TEAL';
    e.startDate = d.startDate;
    e.dueDate = d.dueDate;
    e.nextDelivery = d.nextDelivery;
    e.goalId = d.goalId;
    return e;
  },
};
