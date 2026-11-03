import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionContext } from './transaction-context';

/** The EntityManager of the current transaction, or the default one outside a UnitOfWork. */
@Injectable()
export class TransactionalManager {
  constructor(private readonly dataSource: DataSource) {}

  get manager(): EntityManager {
    return TransactionContext.current()?.manager ?? this.dataSource.manager;
  }
}
