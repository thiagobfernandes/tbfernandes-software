import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AppointmentService } from './application/appointment.service';
import { CompanyService } from './application/company.service';
import { ProjectService } from './application/project.service';
import { TaskService } from './application/task.service';
import { TimeEntryService } from './application/time-entry.service';
import { WorkLookupService } from './application/work-lookup.service';
import { WorkSummaryService } from './application/work-summary.service';
import {
  AppointmentRepository,
  CompanyRepository,
  ProjectRepository,
  TaskRepository,
  TimeEntryRepository,
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
import { TimeEntryEntity } from './infrastructure/persistence/time-entry.entity';
import { TypeOrmTimeEntryRepository } from './infrastructure/persistence/typeorm-time-entry.repository';
import { AppointmentController } from './web/appointment.controller';
import { CompanyController } from './web/company.controller';
import { DashboardController } from './web/dashboard.controller';
import { ProjectController } from './web/project.controller';
import { TaskController } from './web/task.controller';
import { TimeEntryController } from './web/time-entry.controller';
import { FollowUpTasks, WorkLookup } from './work.lookup';

@Module({
  imports: [
    DatabaseModule.forFeature([
      CompanyEntity,
      ProjectEntity,
      TaskEntity,
      TaskChecklistItemEntity,
      AppointmentEntity,
      TimeEntryEntity,
    ]),
  ],
  controllers: [
    CompanyController,
    ProjectController,
    TaskController,
    AppointmentController,
    TimeEntryController,
    DashboardController,
  ],
  providers: [
    CompanyService,
    ProjectService,
    TaskService,
    AppointmentService,
    TimeEntryService,
    WorkSummaryService,
    WorkLookupService,
    { provide: CompanyRepository, useClass: TypeOrmCompanyRepository },
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository },
    { provide: TaskRepository, useClass: TypeOrmTaskRepository },
    { provide: AppointmentRepository, useClass: TypeOrmAppointmentRepository },
    { provide: TimeEntryRepository, useClass: TypeOrmTimeEntryRepository },
    { provide: WorkLookup, useExisting: WorkLookupService },
    { provide: FollowUpTasks, useExisting: WorkLookupService },
  ],
  exports: [WorkLookup, FollowUpTasks],
})
export class WorkModule {}
