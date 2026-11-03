import { Injectable } from '@nestjs/common';
import {
  Clock,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  Projection,
  PurchaseDetails,
  PurchaseGoal,
  PurchaseGoalRepository,
} from '../domain';

/** Purchase goals and their projection (RF-FIN-03, FIN-04). */
@Injectable()
export class PurchaseService {
  constructor(
    private readonly purchases: PurchaseGoalRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: PurchaseDetails): Promise<PurchaseGoal> {
    return this.purchases.create(
      PurchaseGoal.create(
        this.ids.forNewAggregate(),
        this.owner.currentOwnerId(),
        details,
      ),
    );
  }

  update(id: string, details: PurchaseDetails): Promise<PurchaseGoal> {
    return this.uow.run(async () => {
      const purchase = await this.get(id);
      purchase.update(details);
      return this.purchases.save(purchase);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.purchases.delete(await this.get(id)));
  }

  async get(id: string): Promise<PurchaseGoal> {
    const purchase = await this.purchases.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!purchase) throw new NotFoundError('A compra', id);
    return purchase;
  }

  list(): Promise<PurchaseGoal[]> {
    return this.purchases.findAll(this.owner.currentOwnerId());
  }

  async projection(id: string): Promise<Projection> {
    return (await this.get(id)).project(this.clock.today());
  }
}
