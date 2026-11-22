import { Injectable } from '@nestjs/common';
import { Clock, IdGenerator, UnitOfWork } from '../../../common/application';
import { YearMonth, YearMonths } from '../../../common/domain';
import {
  applyScenario,
  CommitmentRepository,
  CreditCardRepository,
  EntryScope,
  ExpenseBreakdown,
  expenseBreakdown,
  FinanceEntryRepository,
  goalStatus,
  GoalStatus,
  MonthProjection,
  MonthReport,
  monthReport,
  MonthSnapshot,
  MonthSnapshotRepository,
  nextDue,
  PlanningSettings,
  PlanningSettingsRepository,
  PlanOverview,
  Simulation,
  PlanState,
  projectPlan,
  ReserveFundRepository,
  ScenarioOperation,
  SettingsDetails,
} from '../domain';
import { PlanLoader } from './plan-loader';

/** Months shown ahead when looking at goals and the next bills. */
const HORIZON_MONTHS = 12;

/** The monthly plan: projection, simulator, overview, month report and closing (RF-PLN-01..06). */
@Injectable()
export class PlanningService {
  constructor(
    private readonly plan: PlanLoader,
    private readonly settingsRepository: PlanningSettingsRepository,
    private readonly commitments: CommitmentRepository,
    private readonly cards: CreditCardRepository,
    private readonly funds: ReserveFundRepository,
    private readonly snapshots: MonthSnapshotRepository,
    private readonly entries: FinanceEntryRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  async projection(
    from: YearMonth,
    months: number,
  ): Promise<MonthProjection[]> {
    return projectPlan(await this.plan.state(), from, lastMonth(from, months));
  }

  /** Every expense of a month, plan and entries, with status and no double counting (RF-PLN-10). */
  async expenses(
    month: YearMonth,
    scope: EntryScope | null,
  ): Promise<ExpenseBreakdown> {
    const state = await this.plan.state();
    const [projection] = projectPlan(state, month, month);
    const entries = await this.entries.findAll(this.plan.ownerId(), {
      from: YearMonths.firstDay(month),
      to: YearMonths.lastDay(month),
      scope: null,
    });
    return expenseBreakdown({
      month,
      scope,
      projection,
      commitments: state.commitments,
      cards: state.cards,
      entries,
    });
  }

  /** Runs the operations on a copy of the plan; nothing is saved (RN-PLN-09). */
  async simulate(
    from: YearMonth,
    months: number,
    operations: ScenarioOperation[],
  ): Promise<Simulation> {
    const to = lastMonth(from, months);
    const base = projectPlan(await this.plan.state(), from, to);
    const copy = await this.plan.state();
    applyScenario(copy, operations, this.scenarioContext(copy));
    return { base, simulated: projectPlan(copy, from, to) };
  }

  /** Saves what the simulator showed, with the same rules. */
  applyScenario(operations: ScenarioOperation[]): Promise<void> {
    return this.uow.run(async () => {
      const state = await this.plan.state();
      const changes = applyScenario(
        state,
        operations,
        this.scenarioContext(state),
      );
      for (const commitment of [...changes.created, ...changes.commitments]) {
        await this.commitments.save(commitment);
      }
      for (const card of changes.cards) await this.cards.save(card);
      for (const fund of changes.funds) await this.funds.save(fund);
    });
  }

  async overview(month?: YearMonth): Promise<PlanOverview> {
    const today = this.clock.today();
    const current = month ?? YearMonths.of(today);
    const state = await this.plan.state();
    const months = projectPlan(
      state,
      current,
      lastMonth(current, HORIZON_MONTHS),
    );
    await this.snapshotIfOpened(months[0], today);
    return {
      month: current,
      projection: months[0],
      goals: state.funds
        .filter((fund) => fund.details.kind !== 'EMERGENCY')
        .map((fund) => goalStatus(fund, state, months, YearMonths.of(today))),
      nextDue: nextDue(months, today),
      pendingReserves: state.funds.reduce(
        (total, fund) => total + fund.pending(),
        0,
      ),
    };
  }

  async goals(): Promise<GoalStatus[]> {
    return (await this.overview()).goals;
  }

  async report(month: YearMonth): Promise<MonthReport> {
    const state = await this.plan.state();
    const [previous, current] = projectPlan(
      state,
      YearMonths.plusMonths(month, -1),
      month,
    );
    await this.snapshotIfOpened(current, this.clock.today());
    const snapshot = await this.snapshots.find(this.plan.ownerId(), month);
    return monthReport(current, previous, snapshot);
  }

  settings(): Promise<PlanningSettings> {
    return this.plan.settings();
  }

  updateSettings(details: SettingsDetails): Promise<PlanningSettings> {
    return this.changeSettings((settings) => settings.update(details));
  }

  closeThrough(month: YearMonth): Promise<PlanningSettings> {
    return this.changeSettings((settings) =>
      settings.closeThrough(month, this.clock.today()),
    );
  }

  reopenFrom(month: YearMonth): Promise<PlanningSettings> {
    return this.changeSettings((settings) => settings.reopenFrom(month));
  }

  private changeSettings(
    apply: (settings: PlanningSettings) => void,
  ): Promise<PlanningSettings> {
    return this.uow.run(async () => {
      const settings = await this.plan.settings();
      apply(settings);
      return this.settingsRepository.save(settings);
    });
  }

  /** The first time a month that has started is looked at, its plan is kept (RF-PLN-06). */
  private async snapshotIfOpened(
    projection: MonthProjection,
    today: string,
  ): Promise<void> {
    if (projection.month > YearMonths.of(today)) return;
    await this.snapshots.saveIfAbsent(
      MonthSnapshot.take(
        this.ids.forNewAggregate(),
        this.plan.ownerId(),
        projection,
        today,
      ),
    );
  }

  private scenarioContext(state: PlanState) {
    return {
      ownerId: this.plan.ownerId(),
      newId: () => this.ids.newId(),
      lock: state.settings.lock,
    };
  }
}

function lastMonth(from: YearMonth, months: number): YearMonth {
  return YearMonths.plusMonths(from, Math.max(1, months) - 1);
}
