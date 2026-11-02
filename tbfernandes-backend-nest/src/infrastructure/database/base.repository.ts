import {
  EntityTarget,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { AuditedEntity } from './audited.entity';
import { TransactionalManager } from './transactions';

/**
 * Shared queries of the TypeORM repositories, used by composition as in my-self.so (each
 * repository holds one and implements its domain interface). Every query is scoped to an
 * owner, and every call joins the current transaction when there is one.
 */
export class BaseRepository<E extends AuditedEntity> {
  constructor(
    private readonly target: EntityTarget<E>,
    private readonly tx: TransactionalManager,
  ) {}

  get repository(): Repository<E> {
    return this.tx.manager.getRepository(this.target);
  }

  findOwned(
    ownerId: string,
    id: string,
    relations?: FindOptionsRelations<E>,
  ): Promise<E | null> {
    return this.repository.findOne({
      where: { ownerId, id } as FindOptionsWhere<E>,
      relations,
    });
  }

  findAllOwned(
    ownerId: string,
    options: {
      where?: FindOptionsWhere<E>;
      order?: FindOptionsOrder<E>;
      relations?: FindOptionsRelations<E>;
    } = {},
  ): Promise<E[]> {
    return this.repository.find({
      where: { ...options.where, ownerId } as FindOptionsWhere<E>,
      order: options.order,
      relations: options.relations,
    });
  }

  existsOwned(ownerId: string, where: FindOptionsWhere<E>): Promise<boolean> {
    return this.repository.exists({
      where: { ...where, ownerId } as FindOptionsWhere<E>,
    });
  }

  /** Plain INSERT: a taken id fails with a unique violation (409) instead of overwriting. */
  async insertEntity(entity: E): Promise<void> {
    await this.repository.insert(entity as never);
  }

  async saveEntity(entity: E): Promise<E> {
    return this.repository.save(entity);
  }

  async deleteOwned(ownerId: string, id: string): Promise<void> {
    await this.repository.delete({ ownerId, id } as FindOptionsWhere<E>);
  }
}
