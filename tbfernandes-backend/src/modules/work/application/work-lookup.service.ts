import { Injectable } from '@nestjs/common';
import { IsoDate } from '../../../common/domain';
import {
  CompanyRepository,
  ProjectRepository,
  TaskRepository,
} from '../domain';
import {
  CompanyView,
  FollowUpTasks,
  ProjectView,
  TaskView,
  WorkLookup,
} from '../work.lookup';
import { TaskService } from './task.service';

/** Implements the work module's public API (WRK-08) on top of its own repositories. */
@Injectable()
export class WorkLookupService implements WorkLookup, FollowUpTasks {
  constructor(
    private readonly companiesRepo: CompanyRepository,
    private readonly projectsRepo: ProjectRepository,
    private readonly tasksRepo: TaskRepository,
    private readonly taskService: TaskService,
  ) {}

  companyExists(ownerId: string, companyId: string): Promise<boolean> {
    return this.companiesRepo.exists(ownerId, companyId);
  }

  projectExists(ownerId: string, projectId: string): Promise<boolean> {
    return this.projectsRepo.exists(ownerId, projectId);
  }

  async taskExists(ownerId: string, taskId: string): Promise<boolean> {
    return (await this.tasksRepo.findById(ownerId, taskId)) !== null;
  }

  async companies(ownerId: string): Promise<CompanyView[]> {
    return (await this.companiesRepo.findAll(ownerId)).map((company) => ({
      id: company.id,
      name: company.details.name,
      status: company.status.toLowerCase(),
    }));
  }

  async projects(ownerId: string): Promise<ProjectView[]> {
    return (await this.projectsRepo.findAll(ownerId)).map((project) => {
      const d = project.details;
      return {
        id: project.id,
        name: d.name,
        status: project.status.toLowerCase(),
        companyId: d.companyId,
        goalId: d.goalId,
        dueDate: d.dueDate,
        nextDelivery: d.nextDelivery,
      };
    });
  }

  async tasks(ownerId: string): Promise<TaskView[]> {
    return (await this.tasksRepo.findAll(ownerId)).map((task) => {
      const d = task.details;
      return {
        id: task.id,
        title: d.title,
        description: d.description,
        status: task.status.toLowerCase(),
        priority: (d.priority ?? 'NORMAL').toLowerCase(),
        projectId: d.projectId,
        goalId: d.goalId,
        dueDate: d.dueDate,
      };
    });
  }

  async create(
    title: string,
    description: string | null,
    dueDate: IsoDate | null,
  ): Promise<string> {
    const task = await this.taskService.create(
      {
        title,
        description,
        projectId: null,
        priority: 'NORMAL',
        tag: 'Follow-up',
        startDate: null,
        dueDate,
        doneCriteria: null,
        checklistDone: null,
        checklistTotal: null,
        checklistItems: [],
        goalId: null,
      },
      'TODO',
    );
    return task.id;
  }
}
