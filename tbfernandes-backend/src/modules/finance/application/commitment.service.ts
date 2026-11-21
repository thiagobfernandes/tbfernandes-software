import { Injectable } from '@nestjs/common';
import { IdGenerator, UnitOfWork } from '../../../common/application';
import { NotFoundError, YearMonth } from '../../../common/domain';
import {
  ChangeInput,
  Commitment,
  CommitmentDetails,
  CommitmentPayment,
  CommitmentRepository,
  MonthLock,
  MonthOverride,
} from '../domain';
import { PlanLoader } from './plan-loader';

/** Salary, freelances, loans, bills and subscriptions of the plan (RF-PLN-02). */
@Injectable()
export class CommitmentService {
  constructor(
    private readonly commitments: CommitmentRepository,
    private readonly plan: PlanLoader,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  async create(
    details: CommitmentDetails,
    first: Omit<ChangeInput, 'active'>,
  ): Promise<Commitment> {
    const lock = await this.plan.lock();
    return this.commitments.save(
      Commitment.create(
        this.ids.forNewAggregate(),
        this.plan.ownerId(),
        details,
        first,
        lock,
      ),
    );
  }

  update(id: string, details: CommitmentDetails): Promise<Commitment> {
    return this.change(id, (commitment, lock) =>
      commitment.update(details, lock),
    );
  }

  changeFrom(id: string, fromMonth: YearMonth, input: ChangeInput) {
    return this.change(id, (commitment, lock) =>
      commitment.changeFrom(fromMonth, input, lock),
    );
  }

  setOverride(id: string, override: MonthOverride) {
    return this.change(id, (commitment, lock) =>
      commitment.setOverride(override, lock),
    );
  }

  clearOverride(id: string, month: YearMonth) {
    return this.change(id, (commitment, lock) =>
      commitment.clearOverride(month, lock),
    );
  }

  recordPayment(id: string, payment: CommitmentPayment) {
    return this.change(id, (commitment, lock) =>
      commitment.recordPayment(payment, lock),
    );
  }

  removePayment(id: string, month: YearMonth) {
    return this.change(id, (commitment, lock) =>
      commitment.removePayment(month, lock),
    );
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => {
      const commitment = await this.get(id);
      const lock = await this.plan.lock();
      lock.assertOpen(commitment.details.startMonth);
      await this.commitments.delete(commitment);
    });
  }

  async get(id: string): Promise<Commitment> {
    const commitment = await this.commitments.findById(this.plan.ownerId(), id);
    if (!commitment) throw new NotFoundError('O compromisso', id);
    return commitment;
  }

  list(): Promise<Commitment[]> {
    return this.commitments.findAll(this.plan.ownerId());
  }

  private change(
    id: string,
    apply: (commitment: Commitment, lock: MonthLock) => void,
  ): Promise<Commitment> {
    return this.uow.run(async () => {
      const commitment = await this.get(id);
      apply(commitment, await this.plan.lock());
      return this.commitments.save(commitment);
    });
  }
}
