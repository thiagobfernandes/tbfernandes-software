import { Project, ProjectDetails } from '../../domain';
import { ValidProjectRequest } from '../project.request';
import { ProjectResponse } from '../project.response';

/** JSON ↔ Project. */
export const ProjectMapper = {
  toDetails(request: ValidProjectRequest): ProjectDetails {
    return { ...request };
  },

  toResponse(project: Project): ProjectResponse {
    const d = project.details;
    return {
      id: project.id,
      name: d.name,
      description: d.description,
      companyId: d.companyId,
      category: d.category.toLowerCase(),
      status: project.status.toLowerCase(),
      color: (d.color ?? 'TEAL').toLowerCase(),
      startDate: d.startDate,
      dueDate: d.dueDate,
      nextDelivery: d.nextDelivery,
      goalId: d.goalId,
    };
  },
};
