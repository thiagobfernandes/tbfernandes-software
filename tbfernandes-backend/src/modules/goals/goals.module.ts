import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { FinanceModule } from '../finance';
import { LearningModule } from '../learning';
import { WorkModule } from '../work';
import { GoalLinksService } from './application/goal-links.service';
import { GoalService } from './application/goal.service';
import { GoalsLookupService } from './application/goals-lookup.service';
import { MilestoneService } from './application/milestone.service';
import { TaskCompletedListener } from './application/task-completed.listener';
import { GoalRepository, MilestoneRepository } from './domain';
import { GoalsLookup } from './goals.lookup';
import { GoalEntity } from './infrastructure/persistence/goal.entity';
import { MilestoneEntity } from './infrastructure/persistence/milestone.entity';
import { TypeOrmGoalRepository } from './infrastructure/persistence/typeorm-goal.repository';
import { TypeOrmMilestoneRepository } from './infrastructure/persistence/typeorm-milestone.repository';
import { GoalController } from './web/goal.controller';
import { MilestoneController } from './web/milestone.controller';

@Module({
  imports: [
    WorkModule,
    LearningModule,
    FinanceModule,
    DatabaseModule.forFeature([GoalEntity, MilestoneEntity]),
  ],
  controllers: [GoalController, MilestoneController],
  providers: [
    GoalService,
    MilestoneService,
    GoalLinksService,
    GoalsLookupService,
    TaskCompletedListener,
    { provide: GoalRepository, useClass: TypeOrmGoalRepository },
    { provide: MilestoneRepository, useClass: TypeOrmMilestoneRepository },
    { provide: GoalsLookup, useExisting: GoalsLookupService },
  ],
  exports: [GoalsLookup],
})
export class GoalsModule {}
