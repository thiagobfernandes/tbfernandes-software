import { Injectable } from '@nestjs/common';
import { IdGenerator, UnitOfWork } from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  FundDetails,
  MonthLock,
  MovementInput,
  ReserveFund,
  ReserveFundRepository,
} from '../domain';
import { PlanLoader } from './plan-loader';

/** Emergency reserve, trip money and other goals, with their movements (RF-PLN-04). */
@Injectable()
export class ReserveFundService {
  constructor(
    private readonly funds: ReserveFundRepository,
    private readonly plan: PlanLoader,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: FundDetails): Promise<ReserveFund> {
    return this.funds.save(
      ReserveFund.create(
        this.ids.forNewAggregate(),
        this.plan.ownerId(),
        details,
      ),
    );
  }

  update(id: string, details: FundDetails): Promise<ReserveFund> {
    return this.change(id, (fund) => fund.update(details));
  }

  addMovement(id: string, input: MovementInput) {
    return this.change(id, (fund, lock) =>
      fund.addMovement(this.ids.newId(), input, lock),
    );
  }

  updateMovement(id: string, movementId: string, input: MovementInput) {
    return this.change(id, (fund, lock) =>
      fund.updateMovement(movementId, input, lock),
    );
  }

  removeMovement(id: string, movementId: string) {
    return this.change(id, (fund, lock) =>
      fund.removeMovement(movementId, lock),
    );
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => {
      const fund = await this.get(id);
      const lock = await this.plan.lock();
      for (const movement of fund.movements)
        lock.assertOpen(movement.date.slice(0, 7));
      await this.funds.delete(fund);
    });
  }

  async get(id: string): Promise<ReserveFund> {
    const fund = await this.funds.findById(this.plan.ownerId(), id);
    if (!fund) throw new NotFoundError('A reserva', id);
    return fund;
  }

  list(): Promise<ReserveFund[]> {
    return this.funds.findAll(this.plan.ownerId());
  }

  private change(
    id: string,
    apply: (fund: ReserveFund, lock: MonthLock) => void,
  ): Promise<ReserveFund> {
    return this.uow.run(async () => {
      const fund = await this.get(id);
      apply(fund, await this.plan.lock());
      return this.funds.save(fund);
    });
  }
}
