import { Injectable } from '@nestjs/common';
import { Clock, OwnerContext } from '../../../common/application';
import {
  CompanyRepository,
  ProjectRepository,
  TaskRepository,
} from '../domain';

/** Numbers for the dashboard cards (RF-WRK-13). */
export interface WorkSummary {
  openTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  dueToday: number;
  completedThisWeek: number;
  activeProjects: number;
  activeCompanies: number;
}

/** WRK-07. "Today" and "this week" (from Monday) use the configured time zone. */
@Injectable()
export class WorkSummaryService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
    private readonly companies: CompanyRepository,
    private readonly owner: OwnerContext,
    private readonly clock: Clock,
  ) {}

  async summary(): Promise<WorkSummary> {
    const ownerId = this.owner.currentOwnerId();
    const today = this.clock.today();
    const [tasks, projects, companies, completedThisWeek] = await Promise.all([
      this.tasks.findAll(ownerId),
      this.projects.findAll(ownerId),
      this.companies.findAll(ownerId),
      this.tasks.countCompletedSince(ownerId, this.clock.startOfWeek()),
    ]);
    const open = tasks.filter((task) => task.isOpen());
    const due = (task: (typeof open)[number]) => task.details.dueDate;
    return {
      openTasks: open.length,
      overdueTasks: open.filter(
        (task) => due(task) !== null && due(task)! < today,
      ).length,
      blockedTasks: open.filter((task) => task.status === 'BLOCKED').length,
      dueToday: open.filter((task) => due(task) === today).length,
      completedThisWeek,
      activeProjects: projects.filter((project) => project.status === 'ACTIVE')
        .length,
      activeCompanies: companies.filter(
        (company) => company.status === 'ACTIVE',
      ).length,
    };
  }
}
