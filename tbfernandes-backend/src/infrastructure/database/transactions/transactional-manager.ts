import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionContext } from './transaction-context';

@Injectable()
export class TransactionalManager {
  constructor(private readonly dataSource: DataSource) {}

  get manager(): EntityManager {
    return TransactionContext.current()?.manager ?? this.dataSource.manager;
  }
}
