import { Project, ProjectDetails } from '../../domain';
import { ValidProjectRequest } from '../project.request';
import { ProjectResponse } from '../project.response';

export const ProjectMapper = {
  toDetails(request: ValidProjectRequest): ProjectDetails {
    return { ...request };
  },

  toResponse(project: Project): ProjectResponse {
    const details = project.details;
    return {
      id: project.id,
      name: details.name,
      description: details.description,
      companyId: details.companyId,
      category: details.category.toLowerCase(),
      status: project.status.toLowerCase(),
      color: (details.color ?? 'TEAL').toLowerCase(),
      startDate: details.startDate,
      dueDate: details.dueDate,
      nextDelivery: details.nextDelivery,
      goalId: details.goalId,
    };
  },
};
