import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AppointmentService } from './application/appointment.service';
import { CompanyService } from './application/company.service';
import { ProjectService } from './application/project.service';
import { TaskService } from './application/task.service';
import { WorkLookupService } from './application/work-lookup.service';
import { WorkSummaryService } from './application/work-summary.service';
import {
  AppointmentRepository,
  CompanyRepository,
  ProjectRepository,
  TaskRepository,
} from './domain';
import { AppointmentEntity } from './infrastructure/persistence/appointment.entity';
import { CompanyEntity } from './infrastructure/persistence/company.entity';
import { ProjectEntity } from './infrastructure/persistence/project.entity';
import {
  TaskChecklistItemEntity,
  TaskEntity,
} from './infrastructure/persistence/task.entity';
import { TypeOrmAppointmentRepository } from './infrastructure/persistence/typeorm-appointment.repository';
import { TypeOrmCompanyRepository } from './infrastructure/persistence/typeorm-company.repository';
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm-project.repository';
import { TypeOrmTaskRepository } from './infrastructure/persistence/typeorm-task.repository';
import { AppointmentController } from './web/appointment.controller';
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
      AppointmentEntity,
    ]),
  ],
  controllers: [
    CompanyController,
    ProjectController,
    TaskController,
    AppointmentController,
    DashboardController,
  ],
  providers: [
    CompanyService,
    ProjectService,
    TaskService,
    AppointmentService,
    WorkSummaryService,
    WorkLookupService,
    { provide: CompanyRepository, useClass: TypeOrmCompanyRepository },
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository },
    { provide: TaskRepository, useClass: TypeOrmTaskRepository },
    { provide: AppointmentRepository, useClass: TypeOrmAppointmentRepository },
    { provide: WorkLookup, useExisting: WorkLookupService },
    { provide: FollowUpTasks, useExisting: WorkLookupService },
  ],
  exports: [WorkLookup, FollowUpTasks],
})
export class WorkModule {}
