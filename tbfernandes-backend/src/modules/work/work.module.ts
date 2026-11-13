import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AppointmentService } from './application/appointment.service';
import { CompanyService } from './application/company.service';
import { ProjectService } from './application/project.service';
import { RoutineCheckService } from './application/routine-check.service';
import { RoutineService } from './application/routine.service';
import { TaskService } from './application/task.service';
import { TimeEntryService } from './application/time-entry.service';
import { WorkLookupService } from './application/work-lookup.service';
import { WorkSummaryService } from './application/work-summary.service';
import {
  AppointmentRepository,
  CompanyRepository,
  ProjectRepository,
  RoutineCheckRepository,
  RoutineRepository,
  TaskRepository,
  TimeEntryRepository,
} from './domain';
import { AppointmentEntity } from './infrastructure/persistence/appointment.entity';
import { CompanyEntity } from './infrastructure/persistence/company.entity';
import { ProjectEntity } from './infrastructure/persistence/project.entity';
import { RoutineCheckEntity } from './infrastructure/persistence/routine-check.entity';
import { RoutineEntity } from './infrastructure/persistence/routine.entity';
import { TypeOrmRoutineCheckRepository } from './infrastructure/persistence/typeorm-routine-check.repository';
import { TypeOrmRoutineRepository } from './infrastructure/persistence/typeorm-routine.repository';
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
import { RoutineCheckController } from './web/routine-check.controller';
import { RoutineController } from './web/routine.controller';
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
      RoutineEntity,
      RoutineCheckEntity,
    ]),
  ],
  controllers: [
    CompanyController,
    ProjectController,
    TaskController,
    AppointmentController,
    TimeEntryController,
    RoutineController,
    RoutineCheckController,
    DashboardController,
  ],
  providers: [
    CompanyService,
    ProjectService,
    TaskService,
    AppointmentService,
    TimeEntryService,
    RoutineService,
    RoutineCheckService,
    WorkSummaryService,
    WorkLookupService,
    { provide: CompanyRepository, useClass: TypeOrmCompanyRepository },
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository },
    { provide: TaskRepository, useClass: TypeOrmTaskRepository },
    { provide: AppointmentRepository, useClass: TypeOrmAppointmentRepository },
    { provide: TimeEntryRepository, useClass: TypeOrmTimeEntryRepository },
    { provide: RoutineRepository, useClass: TypeOrmRoutineRepository },
    {
      provide: RoutineCheckRepository,
      useClass: TypeOrmRoutineCheckRepository,
    },
    { provide: WorkLookup, useExisting: WorkLookupService },
    { provide: FollowUpTasks, useExisting: WorkLookupService },
  ],
  exports: [WorkLookup, FollowUpTasks],
})
export class WorkModule {}
