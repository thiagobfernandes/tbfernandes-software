import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Material, MaterialRepository } from '../../domain';
import { MaterialEntity } from './material.entity';
import { MaterialPersistenceMapper as Mapper } from './mappers/material.persistence-mapper';

/** MaterialRepository on TypeORM. */
@Injectable()
export class TypeOrmMaterialRepository extends MaterialRepository {
  private readonly rows: BaseRepository<MaterialEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(MaterialEntity, tx);
  }

  async create(item: Material): Promise<Material> {
    await this.rows.insertEntity(Mapper.toEntity(item));
    return item;
  }

  async save(item: Material): Promise<Material> {
    const existing = await this.rows.findOwned(item.ownerId, item.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(Mapper.toEntity(item, existing ?? undefined)),
    );
  }

  async findById(ownerId: string, id: string): Promise<Material | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string, studyId: string | null): Promise<Material[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: studyId ? { studyId } : {},
      order: { title: 'ASC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(item: Material): Promise<void> {
    return this.rows.deleteOwned(item.ownerId, item.id);
  }
}
