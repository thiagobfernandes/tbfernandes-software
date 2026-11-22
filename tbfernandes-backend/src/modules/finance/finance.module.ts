import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Clock } from '../../common/application';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { pluggyConfig } from '../../infrastructure/environments/registers';
import { CashFlowService } from './application/cash-flow.service';
import { CommitmentService } from './application/commitment.service';
import { CreditCardService } from './application/credit-card.service';
import { PlanLoader } from './application/plan-loader';
import { PlanningService } from './application/planning.service';
import { ReserveFundService } from './application/reserve-fund.service';
import { ConnectionSyncListener } from './application/connection-sync.listener';
import { FinanceEntryService } from './application/finance-entry.service';
import { FinanceLookupService } from './application/finance-lookup.service';
import { OpenFinanceGateway } from './application/open-finance.gateway';
import { OpenFinanceService } from './application/open-finance.service';
import { PurchaseService } from './application/purchase.service';
import {
  BankConnectionRepository,
  CommitmentRepository,
  CreditCardRepository,
  FinanceEntryRepository,
  MonthSnapshotRepository,
  PlanningSettingsRepository,
  PurchaseGoalRepository,
  ReserveFundRepository,
} from './domain';
import { FinanceLookup } from './finance.lookup';
import {
  BankAccountEntity,
  BankConnectionEntity,
} from './infrastructure/persistence/bank-connection.entity';
import { FinanceEntryEntity } from './infrastructure/persistence/finance-entry.entity';
import { PLANNING_ENTITIES } from './infrastructure/persistence/planning.entities';
import { PurchaseGoalEntity } from './infrastructure/persistence/purchase-goal.entity';
import { TypeOrmCommitmentRepository } from './infrastructure/persistence/typeorm-commitment.repository';
import { TypeOrmCreditCardRepository } from './infrastructure/persistence/typeorm-credit-card.repository';
import {
  TypeOrmMonthSnapshotRepository,
  TypeOrmPlanningSettingsRepository,
} from './infrastructure/persistence/typeorm-planning-settings.repository';
import { TypeOrmReserveFundRepository } from './infrastructure/persistence/typeorm-reserve-fund.repository';
import { TypeOrmBankConnectionRepository } from './infrastructure/persistence/typeorm-bank-connection.repository';
import { TypeOrmFinanceEntryRepository } from './infrastructure/persistence/typeorm-finance-entry.repository';
import { TypeOrmPurchaseGoalRepository } from './infrastructure/persistence/typeorm-purchase-goal.repository';
import { DisabledOpenFinanceGateway } from './infrastructure/pluggy/disabled-open-finance.gateway';
import { PluggyOpenFinanceGateway } from './infrastructure/pluggy/pluggy-open-finance.gateway';
import { CashFlowController } from './web/cash-flow.controller';
import { CommitmentController } from './web/commitment.controller';
import { CreditCardController } from './web/credit-card.controller';
import { PlanningController } from './web/planning.controller';
import { ReserveFundController } from './web/reserve-fund.controller';
import { ConnectionController } from './web/connection.controller';
import { FinanceEntryController } from './web/finance-entry.controller';
import { PluggyWebhookController } from './web/pluggy-webhook.controller';
import { PurchaseController } from './web/purchase.controller';

@Module({
  imports: [
    DatabaseModule.forFeature([
      FinanceEntryEntity,
      PurchaseGoalEntity,
      BankConnectionEntity,
      BankAccountEntity,
      ...PLANNING_ENTITIES,
    ]),
  ],
  controllers: [
    FinanceEntryController,
    CashFlowController,
    PurchaseController,
    ConnectionController,
    PluggyWebhookController,
    PlanningController,
    CommitmentController,
    CreditCardController,
    ReserveFundController,
  ],
  providers: [
    FinanceEntryService,
    CashFlowService,
    PurchaseService,
    OpenFinanceService,
    FinanceLookupService,
    ConnectionSyncListener,
    PlanLoader,
    PlanningService,
    CommitmentService,
    CreditCardService,
    ReserveFundService,
    { provide: CommitmentRepository, useClass: TypeOrmCommitmentRepository },
    { provide: CreditCardRepository, useClass: TypeOrmCreditCardRepository },
    { provide: ReserveFundRepository, useClass: TypeOrmReserveFundRepository },
    {
      provide: PlanningSettingsRepository,
      useClass: TypeOrmPlanningSettingsRepository,
    },
    {
      provide: MonthSnapshotRepository,
      useClass: TypeOrmMonthSnapshotRepository,
    },
    {
      provide: FinanceEntryRepository,
      useClass: TypeOrmFinanceEntryRepository,
    },
    {
      provide: PurchaseGoalRepository,
      useClass: TypeOrmPurchaseGoalRepository,
    },
    {
      provide: BankConnectionRepository,
      useClass: TypeOrmBankConnectionRepository,
    },
    {
      provide: OpenFinanceGateway,
      inject: [pluggyConfig.KEY, Clock],
      useFactory: (config: ConfigType<typeof pluggyConfig>, clock: Clock) =>
        config.enabled
          ? new PluggyOpenFinanceGateway(config, clock)
          : new DisabledOpenFinanceGateway(),
    },
    { provide: FinanceLookup, useExisting: FinanceLookupService },
  ],
  exports: [FinanceLookup],
})
export class FinanceModule {}
