import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { CreditCard, CreditCardRepository } from '../../domain';
import { replaceRows, rowsByParent } from './child-rows';
import { CreditCardPersistenceMapper as Mapper } from './mappers/planning.persistence-mapper';
import {
  CardPurchaseEntity,
  CardStatementEntity,
  CardTransactionEntity,
  CreditCardEntity,
} from './planning.entities';

/** CreditCardRepository on TypeORM. Statements, transactions and purchases are rewritten on save. */
@Injectable()
export class TypeOrmCreditCardRepository extends CreditCardRepository {
  private readonly rows: BaseRepository<CreditCardEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(CreditCardEntity, tx);
  }

  async save(card: CreditCard): Promise<CreditCard> {
    const existing = await this.rows.findOwned(card.ownerId, card.id);
    await this.rows.saveEntity(Mapper.toEntity(card, existing ?? undefined));
    const manager = this.tx.manager;
    const children = Mapper.toRows(card);
    const where = { cardId: card.id };
    await replaceRows(manager, CardStatementEntity, where, children.statements);
    await replaceRows(
      manager,
      CardTransactionEntity,
      where,
      children.transactions,
    );
    await replaceRows(manager, CardPurchaseEntity, where, children.purchases);
    return card;
  }

  async findById(ownerId: string, id: string): Promise<CreditCard | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity ? (await this.withChildren([entity]))[0] : null;
  }

  async findAll(ownerId: string): Promise<CreditCard[]> {
    const entities = await this.rows.findAllOwned(ownerId, {
      order: { name: 'ASC' },
    });
    return this.withChildren(entities);
  }

  delete(card: CreditCard): Promise<void> {
    return this.rows.deleteOwned(card.ownerId, card.id);
  }

  private async withChildren(
    entities: CreditCardEntity[],
  ): Promise<CreditCard[]> {
    const manager = this.tx.manager;
    const ids = entities.map((entity) => entity.id);
    // One after the other: queries inside a transaction share one connection.
    const statements = await rowsByParent(
      manager,
      CardStatementEntity,
      'cardId',
      ids,
    );
    const transactions = await rowsByParent(
      manager,
      CardTransactionEntity,
      'cardId',
      ids,
    );
    const purchases = await rowsByParent(
      manager,
      CardPurchaseEntity,
      'cardId',
      ids,
    );
    return entities.map((entity) =>
      Mapper.toDomain(entity, {
        statements: statements.get(entity.id) ?? [],
        transactions: sortedTransactions(transactions.get(entity.id) ?? []),
        purchases: purchases.get(entity.id) ?? [],
      }),
    );
  }
}

function sortedTransactions(
  rows: CardTransactionEntity[],
): CardTransactionEntity[] {
  return [...rows].sort(
    (left, right) =>
      left.statementMonth.localeCompare(right.statementMonth) ||
      right.date.localeCompare(left.date) ||
      left.occurrence - right.occurrence,
  );
}
