import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Education, EducationRepository } from '../../domain';
import { EducationEntity } from './education.entity';
import { EducationPersistenceMapper as Mapper } from './mappers/education.persistence-mapper';

/** EducationRepository on TypeORM. */
@Injectable()
export class TypeOrmEducationRepository extends EducationRepository {
  private readonly rows: BaseRepository<EducationEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(EducationEntity, tx);
  }

  async create(item: Education): Promise<Education> {
    await this.rows.insertEntity(Mapper.toEntity(item));
    return item;
  }

  async save(item: Education): Promise<Education> {
    const existing = await this.rows.findOwned(item.ownerId, item.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(Mapper.toEntity(item, existing ?? undefined)),
    );
  }

  async findById(ownerId: string, id: string): Promise<Education | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Education[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { startDate: 'DESC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(item: Education): Promise<void> {
    return this.rows.deleteOwned(item.ownerId, item.id);
  }
}
