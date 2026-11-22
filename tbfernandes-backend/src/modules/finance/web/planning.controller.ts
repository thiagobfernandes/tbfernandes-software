import { Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidatedBody, ValidatedQuery } from '../../../common/decorators';
import { Clock } from '../../../common/application';
import { YearMonths } from '../../../common/domain';
import { PlanningService } from '../application/planning.service';
import {
  expensesQuerySchema,
  monthSchema,
  PlanningRequestMapper as Request,
  PlanningResponseMapper as Response,
  projectionQuerySchema,
  reportQuerySchema,
  scenarioSchema,
  settingsSchema,
  type ExpensesQuery,
  type MonthQuery,
  type PeriodQuery,
  type ValidScenarioRequest,
  type ValidSettingsRequest,
} from '../protocols';

/** The monthly plan (FIN-PLN): projection, simulator, overview, report and closing. */
@ApiTags('finance-planning')
@Controller('finance/planning')
export class PlanningController {
  constructor(
    private readonly planning: PlanningService,
    private readonly clock: Clock,
  ) {}

  /** from=YYYY-MM (default: this month), months=1..36 (default 13). */
  @Get('projection')
  async projection(@ValidatedQuery(projectionQuerySchema) query: PeriodQuery) {
    const months = await this.planning.projection(
      this.from(query.from),
      query.months,
    );
    return months.map((month) => Response.month(month));
  }

  /** Same plan with the operations applied, next to the plan as it is. Nothing is saved. */
  @Post('simulate')
  @HttpCode(200)
  async simulate(@ValidatedBody(scenarioSchema) body: ValidScenarioRequest) {
    const simulation = await this.planning.simulate(
      this.from(body.from),
      body.months,
      Request.operations(body.operations),
    );
    return Response.simulation(simulation);
  }

  /** Confirms a simulation: the same operations, saved. */
  @Post('scenario/apply')
  @HttpCode(204)
  async apply(
    @ValidatedBody(scenarioSchema) body: ValidScenarioRequest,
  ): Promise<void> {
    await this.planning.applyScenario(Request.operations(body.operations));
  }

  /** Every expense of the month: plan lines and entries, with status (RF-PLN-10). */
  @Get('expenses')
  async expenses(@ValidatedQuery(expensesQuerySchema) query: ExpensesQuery) {
    return Response.expenses(
      await this.planning.expenses(this.from(query.month), query.scope),
    );
  }

  @Get('overview')
  async overview(@ValidatedQuery(reportQuerySchema) query: MonthQuery) {
    return Response.overview(
      await this.planning.overview(query.month ?? undefined),
    );
  }

  @Get('report')
  async report(@ValidatedQuery(reportQuerySchema) query: MonthQuery) {
    return Response.report(await this.planning.report(this.from(query.month)));
  }

  @Get('settings')
  async settings() {
    return Response.settings(await this.planning.settings());
  }

  @Put('settings')
  async updateSettings(
    @ValidatedBody(settingsSchema) body: ValidSettingsRequest,
  ) {
    return Response.settings(
      await this.planning.updateSettings(Request.settings(body)),
    );
  }

  /** Closes every month up to `month` (RN-PLN-01). */
  @Post('months/close')
  @HttpCode(200)
  async close(@ValidatedBody(monthSchema) body: { month: string }) {
    return Response.settings(await this.planning.closeThrough(body.month));
  }

  /** Reopens `month` and the months after it. */
  @Post('months/reopen')
  @HttpCode(200)
  async reopen(@ValidatedBody(monthSchema) body: { month: string }) {
    return Response.settings(await this.planning.reopenFrom(body.month));
  }

  private from(month: string | null): string {
    return month ?? YearMonths.of(this.clock.today());
  }
}
