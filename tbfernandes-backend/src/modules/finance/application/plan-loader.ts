import { Injectable } from '@nestjs/common';
import { IdGenerator, OwnerContext } from '../../../common/application';
import {
  CommitmentRepository,
  CreditCardRepository,
  MonthLock,
  PlanningSettings,
  PlanningSettingsRepository,
  PlanState,
  ReserveFundRepository,
} from '../domain';

/** Loads the whole plan of the current owner: it is small, and every projection needs all of it. */
@Injectable()
export class PlanLoader {
  constructor(
    private readonly settingsRepository: PlanningSettingsRepository,
    private readonly commitments: CommitmentRepository,
    private readonly cards: CreditCardRepository,
    private readonly funds: ReserveFundRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
  ) {}

  ownerId(): string {
    return this.owner.currentOwnerId();
  }

  async settings(): Promise<PlanningSettings> {
    const ownerId = this.ownerId();
    return (
      (await this.settingsRepository.find(ownerId)) ??
      PlanningSettings.defaults(this.ids.forNewAggregate(), ownerId)
    );
  }

  async lock(): Promise<MonthLock> {
    return (await this.settings()).lock;
  }

  async state(): Promise<PlanState> {
    const ownerId = this.ownerId();
    // Sequential: inside a unit of work every query shares one connection.
    const settings = await this.settings();
    const commitments = await this.commitments.findAll(ownerId);
    const cards = await this.cards.findAll(ownerId);
    const funds = await this.funds.findAll(ownerId);
    return { settings, commitments, cards, funds };
  }
}
