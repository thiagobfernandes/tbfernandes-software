import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CompanyService } from './application/company.service';
import { ProjectService } from './application/project.service';
import { TaskService } from './application/task.service';
import { WorkLookupService } from './application/work-lookup.service';
import { WorkSummaryService } from './application/work-summary.service';
import { CompanyRepository, ProjectRepository, TaskRepository } from './domain';
import { CompanyEntity } from './infrastructure/persistence/company.entity';
import { ProjectEntity } from './infrastructure/persistence/project.entity';
import {
  TaskChecklistItemEntity,
  TaskEntity,
} from './infrastructure/persistence/task.entity';
import { TypeOrmCompanyRepository } from './infrastructure/persistence/typeorm-company.repository';
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm-project.repository';
import { TypeOrmTaskRepository } from './infrastructure/persistence/typeorm-task.repository';
import { CompanyController } from './web/company.controller';
import { DashboardController } from './web/dashboard.controller';
import { ProjectController } from './web/project.controller';
import { TaskController } from './web/task.controller';
import { FollowUpTasks, WorkLookup } from './work.lookup';

@Module({
  imports: [
    DatabaseModule.forFeature([
      CompanyEntity,
      ProjectEntity,
      TaskEntity,
      TaskChecklistItemEntity,
    ]),
  ],
  controllers: [
    CompanyController,
    ProjectController,
    TaskController,
    DashboardController,
  ],
  providers: [
    CompanyService,
    ProjectService,
    TaskService,
    WorkSummaryService,
    WorkLookupService,
    { provide: CompanyRepository, useClass: TypeOrmCompanyRepository },
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository },
    { provide: TaskRepository, useClass: TypeOrmTaskRepository },
    { provide: WorkLookup, useExisting: WorkLookupService },
    { provide: FollowUpTasks, useExisting: WorkLookupService },
  ],
  exports: [WorkLookup, FollowUpTasks],
})
export class WorkModule {}
