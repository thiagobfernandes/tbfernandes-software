import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { PurchaseGoal, PurchaseGoalRepository } from '../../domain';
import { PurchaseGoalPersistenceMapper as Mapper } from './mappers/purchase-goal.persistence-mapper';
import { PurchaseGoalEntity } from './purchase-goal.entity';

@Injectable()
export class TypeOrmPurchaseGoalRepository extends PurchaseGoalRepository {
  private readonly rows: BaseRepository<PurchaseGoalEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(PurchaseGoalEntity, tx);
  }

  async create(purchase: PurchaseGoal): Promise<PurchaseGoal> {
    await this.rows.insertEntity(Mapper.toEntity(purchase));
    return purchase;
  }

  async save(purchase: PurchaseGoal): Promise<PurchaseGoal> {
    const existing = await this.rows.findOwned(purchase.ownerId, purchase.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(purchase, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<PurchaseGoal | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<PurchaseGoal[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { desiredDate: { direction: 'ASC', nulls: 'LAST' }, name: 'ASC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(purchase: PurchaseGoal): Promise<void> {
    return this.rows.deleteOwned(purchase.ownerId, purchase.id);
  }
}
