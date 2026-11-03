import { Injectable } from '@nestjs/common';
import {
  EventPublisher,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import {
  BusinessRuleViolationError,
  NotFoundError,
} from '../../../common/domain';
import {
  CompanyRepository,
  Project,
  ProjectDetails,
  ProjectRepository,
  TaskRepository,
} from '../domain';
import { ProjectDeleted, WorkEvents } from '../work.events';

/** Project use cases (RF-WRK-04..06, WRK-11). */
@Injectable()
export class ProjectService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly companies: CompanyRepository,
    private readonly tasks: TaskRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly events: EventPublisher,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: ProjectDetails): Promise<Project> {
    return this.uow.run(async () => {
      const project = Project.create(
        this.ids.forNewAggregate(),
        this.owner.currentOwnerId(),
        details,
      );
      await this.checkCompany(project.details);
      return this.projects.create(project);
    });
  }

  update(id: string, details: ProjectDetails): Promise<Project> {
    return this.uow.run(async () => {
      const project = await this.get(id);
      project.update(details);
      await this.checkCompany(project.details);
      return this.projects.save(project);
    });
  }

  /** RN-01: the tasks stay, without project; other modules drop their links on the event. */
  delete(id: string): Promise<void> {
    return this.uow.run(async () => {
      const project = await this.get(id);
      await this.tasks.unlinkProject(project.ownerId, id);
      await this.projects.delete(project);
      this.events.publish({
        type: WorkEvents.projectDeleted,
        ownerId: project.ownerId,
        projectId: id,
      } satisfies ProjectDeleted);
    });
  }

  async get(id: string): Promise<Project> {
    const project = await this.projects.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!project) throw new NotFoundError('O projeto', id);
    return project;
  }

  list(companyId?: string | null): Promise<Project[]> {
    return this.projects.findAll(this.owner.currentOwnerId(), companyId);
  }

  /** RN-03: the company must exist, and a closed company takes no active project. */
  private async checkCompany(details: ProjectDetails): Promise<void> {
    if (!details.companyId) return;
    const company = await this.companies.findById(
      this.owner.currentOwnerId(),
      details.companyId,
    );
    if (!company) throw new NotFoundError('A empresa', details.companyId);
    if (company.status === 'CLOSED' && details.status === 'ACTIVE') {
      throw new BusinessRuleViolationError(
        'RN-03',
        'Uma empresa encerrada não pode ter projeto ativo',
      );
    }
  }
}
