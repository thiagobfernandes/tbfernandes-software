import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { ReserveFund, ReserveFundRepository } from '../../domain';
import { replaceRows, rowsByParent } from './child-rows';
import { ReserveFundPersistenceMapper as Mapper } from './mappers/planning.persistence-mapper';
import { ReserveFundEntity, ReserveMovementEntity } from './planning.entities';

/** ReserveFundRepository on TypeORM. Movements are rewritten on save. */
@Injectable()
export class TypeOrmReserveFundRepository extends ReserveFundRepository {
  private readonly rows: BaseRepository<ReserveFundEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(ReserveFundEntity, tx);
  }

  async save(fund: ReserveFund): Promise<ReserveFund> {
    const existing = await this.rows.findOwned(fund.ownerId, fund.id);
    await this.rows.saveEntity(Mapper.toEntity(fund, existing ?? undefined));
    await replaceRows(
      this.tx.manager,
      ReserveMovementEntity,
      { fundId: fund.id },
      Mapper.toMovementRows(fund),
    );
    return fund;
  }

  async findById(ownerId: string, id: string): Promise<ReserveFund | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity ? (await this.withMovements([entity]))[0] : null;
  }

  async findAll(ownerId: string): Promise<ReserveFund[]> {
    const entities = await this.rows.findAllOwned(ownerId, {
      order: { name: 'ASC' },
    });
    return this.withMovements(entities);
  }

  delete(fund: ReserveFund): Promise<void> {
    return this.rows.deleteOwned(fund.ownerId, fund.id);
  }

  private async withMovements(
    entities: ReserveFundEntity[],
  ): Promise<ReserveFund[]> {
    const movements = await rowsByParent(
      this.tx.manager,
      ReserveMovementEntity,
      'fundId',
      entities.map((entity) => entity.id),
    );
    return entities.map((entity) =>
      Mapper.toDomain(entity, movements.get(entity.id) ?? []),
    );
  }
}
