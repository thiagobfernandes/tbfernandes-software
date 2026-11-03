import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UnitOfWork } from '../../../common/application';
import { Logger } from '../../logger';
import { TransactionContext } from './transaction-context';

/** UnitOfWork on a TypeORM transaction. A nested `run` joins the outer transaction. */
@Injectable()
export class TypeOrmUnitOfWork extends UnitOfWork {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (TransactionContext.current()) return work();
    const afterCommit: Array<() => void> = [];
    const result = await this.dataSource.transaction((manager) =>
      TransactionContext.run(manager, work, afterCommit),
    );
    for (const callback of afterCommit) {
      try {
        callback();
      } catch (error) {
        Logger.error('After-commit callback failed', error);
      }
    }
    return result;
  }
}
