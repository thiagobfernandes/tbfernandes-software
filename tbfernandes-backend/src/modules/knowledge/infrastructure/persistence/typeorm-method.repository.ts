import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Method, MethodRepository } from '../../domain';
import { MethodPersistenceMapper as Mapper } from './mappers/method.persistence-mapper';
import {
  MethodEntity,
  MethodExampleEntity,
  MethodStepEntity,
} from './method.entity';

/** MethodRepository on TypeORM. Steps and examples are rewritten in order on every save. */
@Injectable()
export class TypeOrmMethodRepository extends MethodRepository {
  private readonly rows: BaseRepository<MethodEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(MethodEntity, tx);
  }

  async create(method: Method): Promise<Method> {
    await this.rows.insertEntity(Mapper.toEntity(method));
    await this.writeChildren(method);
    return (await this.findById(method.ownerId, method.id))!;
  }

  async save(method: Method): Promise<Method> {
    const existing = await this.rows.findOwned(method.ownerId, method.id);
    await this.rows.saveEntity(Mapper.toEntity(method, existing ?? undefined));
    const manager = this.tx.manager;
    await manager.delete(MethodStepEntity, { methodId: method.id });
    await manager.delete(MethodExampleEntity, { methodId: method.id });
    await this.writeChildren(method);
    return (await this.findById(method.ownerId, method.id))!;
  }

  async findById(ownerId: string, id: string): Promise<Method | null> {
    const entity = await this.rows.findOwned(ownerId, id, {
      steps: true,
      examples: true,
    });
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Method[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { title: 'ASC' },
      relations: { steps: true, examples: true },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(method: Method): Promise<void> {
    return this.rows.deleteOwned(method.ownerId, method.id);
  }

  private async writeChildren(method: Method): Promise<void> {
    const manager = this.tx.manager;
    const steps = Mapper.toStepEntities(method);
    const examples = Mapper.toExampleEntities(method);
    if (steps.length) await manager.insert(MethodStepEntity, steps);
    if (examples.length) await manager.insert(MethodExampleEntity, examples);
  }
}
