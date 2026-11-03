import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Skill, SkillRepository } from '../../domain';
import { SkillEntity } from './skill.entity';
import { SkillPersistenceMapper as Mapper } from './mappers/skill.persistence-mapper';

/** SkillRepository on TypeORM. */
@Injectable()
export class TypeOrmSkillRepository extends SkillRepository {
  private readonly rows: BaseRepository<SkillEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(SkillEntity, tx);
  }

  async create(item: Skill): Promise<Skill> {
    await this.rows.insertEntity(Mapper.toEntity(item));
    return item;
  }

  async save(item: Skill): Promise<Skill> {
    const existing = await this.rows.findOwned(item.ownerId, item.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(Mapper.toEntity(item, existing ?? undefined)),
    );
  }

  async findById(ownerId: string, id: string): Promise<Skill | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Skill[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { name: 'ASC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  async allExist(ownerId: string, ids: readonly string[]): Promise<boolean> {
    const unique = [...new Set(ids)];
    const found = await this.rows.repository.countBy({
      ownerId,
      id: In(unique),
    });
    return found === unique.length;
  }

  delete(item: Skill): Promise<void> {
    return this.rows.deleteOwned(item.ownerId, item.id);
  }
}
