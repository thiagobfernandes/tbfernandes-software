import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { BankConnection, BankConnectionRepository } from '../../domain';
import {
  BankAccountEntity,
  BankConnectionEntity,
} from './bank-connection.entity';
import { BankConnectionPersistenceMapper as Mapper } from './mappers/bank-connection.persistence-mapper';

/** BankConnectionRepository on TypeORM. Accounts are rewritten on every save. */
@Injectable()
export class TypeOrmBankConnectionRepository extends BankConnectionRepository {
  private readonly rows: BaseRepository<BankConnectionEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(BankConnectionEntity, tx);
  }

  async save(connection: BankConnection): Promise<BankConnection> {
    const existing = await this.rows.repository.findOneBy({
      id: connection.id,
    });
    await this.rows.saveEntity(
      Mapper.toEntity(connection, existing ?? undefined),
    );
    const manager = this.tx.manager;
    await manager.delete(BankAccountEntity, { connectionId: connection.id });
    const accounts = Mapper.toAccountEntities(connection);
    if (accounts.length) await manager.insert(BankAccountEntity, accounts);
    return (await this.findOne({ id: connection.id }))!;
  }

  async saveIfAbsent(connection: BankConnection): Promise<BankConnection> {
    const d = connection.details;
    await this.tx.manager.query(
      `INSERT INTO finance.bank_connection (id, owner_id, external_id, institution, scope, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (external_id) DO NOTHING`,
      [
        connection.id,
        connection.ownerId,
        connection.externalId,
        d.institution,
        d.scope,
        d.status,
      ],
    );
    return (await this.findByExternalId(connection.externalId))!;
  }

  findById(ownerId: string, id: string): Promise<BankConnection | null> {
    return this.findOne({ ownerId, id });
  }

  findByExternalId(externalId: string): Promise<BankConnection | null> {
    return this.findOne({ externalId });
  }

  async lockByExternalId(externalId: string): Promise<BankConnection | null> {
    // Empty, without an error, when another transaction has just deleted the row.
    const locked: Array<{ id: string }> = await this.tx.manager.query(
      'SELECT id FROM finance.bank_connection WHERE external_id = $1 FOR UPDATE',
      [externalId],
    );
    return locked.length ? this.findOne({ id: locked[0].id }) : null;
  }

  async findAll(ownerId: string): Promise<BankConnection[]> {
    const rows = await this.rows.repository.find({
      where: { ownerId },
      relations: { accounts: true },
      order: { institution: 'ASC', accounts: { externalId: 'ASC' } },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(connection: BankConnection): Promise<void> {
    return this.rows.deleteOwned(connection.ownerId, connection.id);
  }

  private async findOne(
    where: FindOptionsWhere<BankConnectionEntity>,
  ): Promise<BankConnection | null> {
    const entity = await this.rows.repository.findOne({
      where,
      relations: { accounts: true },
      order: { accounts: { externalId: 'ASC' } },
    });
    return entity && Mapper.toDomain(entity);
  }
}
