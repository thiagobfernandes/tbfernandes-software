import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Study, StudyRepository } from '../../domain';
import { StudyPersistenceMapper as Mapper } from './mappers/study.persistence-mapper';
import { StudyEntity, StudySkillEntity } from './study.entity';

/** StudyRepository on TypeORM. Skill links are rewritten on every save. */
@Injectable()
export class TypeOrmStudyRepository extends StudyRepository {
  private readonly rows: BaseRepository<StudyEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(StudyEntity, tx);
  }

  private get links() {
    return this.tx.manager.getRepository(StudySkillEntity);
  }

  async create(study: Study): Promise<Study> {
    await this.rows.insertEntity(Mapper.toEntity(study));
    await this.writeLinks(study);
    return (await this.findById(study.ownerId, study.id))!;
  }

  async save(study: Study): Promise<Study> {
    const existing = await this.rows.findOwned(study.ownerId, study.id);
    await this.rows.saveEntity(Mapper.toEntity(study, existing ?? undefined));
    await this.links.delete({ studyId: study.id });
    await this.writeLinks(study);
    return (await this.findById(study.ownerId, study.id))!;
  }

  async findById(ownerId: string, id: string): Promise<Study | null> {
    const entity = await this.rows.findOwned(ownerId, id, { skills: true });
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Study[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { name: 'ASC' },
      relations: { skills: true },
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

  delete(study: Study): Promise<void> {
    return this.rows.deleteOwned(study.ownerId, study.id);
  }

  private async writeLinks(study: Study): Promise<void> {
    const links = Mapper.toSkillEntities(study);
    if (links.length) await this.links.insert(links);
  }
}
