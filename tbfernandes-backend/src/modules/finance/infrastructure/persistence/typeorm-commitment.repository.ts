import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Commitment, CommitmentRepository } from '../../domain';
import { replaceRows, rowsByParent } from './child-rows';
import { CommitmentPersistenceMapper as Mapper } from './mappers/planning.persistence-mapper';
import {
  CommitmentChangeEntity,
  CommitmentEntity,
  CommitmentMonthEntity,
  CommitmentPaymentEntity,
} from './planning.entities';

/** CommitmentRepository on TypeORM. Changes, month overrides and payments are rewritten on save. */
@Injectable()
export class TypeOrmCommitmentRepository extends CommitmentRepository {
  private readonly rows: BaseRepository<CommitmentEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(CommitmentEntity, tx);
  }

  async save(commitment: Commitment): Promise<Commitment> {
    const existing = await this.rows.findOwned(
      commitment.ownerId,
      commitment.id,
    );
    await this.rows.saveEntity(
      Mapper.toEntity(commitment, existing ?? undefined),
    );
    const manager = this.tx.manager;
    const children = Mapper.toRows(commitment);
    const where = { commitmentId: commitment.id };
    await replaceRows(manager, CommitmentChangeEntity, where, children.changes);
    await replaceRows(manager, CommitmentMonthEntity, where, children.months);
    await replaceRows(
      manager,
      CommitmentPaymentEntity,
      where,
      children.payments,
    );
    return commitment;
  }

  async findById(ownerId: string, id: string): Promise<Commitment | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity ? (await this.withChildren([entity]))[0] : null;
  }

  async findAll(ownerId: string): Promise<Commitment[]> {
    const entities = await this.rows.findAllOwned(ownerId, {
      order: { startMonth: 'ASC', name: 'ASC' },
    });
    return this.withChildren(entities);
  }

  delete(commitment: Commitment): Promise<void> {
    return this.rows.deleteOwned(commitment.ownerId, commitment.id);
  }

  private async withChildren(
    entities: CommitmentEntity[],
  ): Promise<Commitment[]> {
    const manager = this.tx.manager;
    const ids = entities.map((entity) => entity.id);
    // One after the other: queries inside a transaction share one connection.
    const changes = await rowsByParent(
      manager,
      CommitmentChangeEntity,
      'commitmentId',
      ids,
    );
    const months = await rowsByParent(
      manager,
      CommitmentMonthEntity,
      'commitmentId',
      ids,
    );
    const payments = await rowsByParent(
      manager,
      CommitmentPaymentEntity,
      'commitmentId',
      ids,
    );
    return entities.map((entity) =>
      Mapper.toDomain(entity, {
        changes: changes.get(entity.id) ?? [],
        months: months.get(entity.id) ?? [],
        payments: payments.get(entity.id) ?? [],
      }),
    );
  }
}
