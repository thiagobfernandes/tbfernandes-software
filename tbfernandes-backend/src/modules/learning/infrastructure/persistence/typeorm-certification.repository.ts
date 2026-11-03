import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Certification, CertificationRepository } from '../../domain';
import {
  CertificationEntity,
  CertificationStudyEntity,
} from './certification.entity';
import { CertificationPersistenceMapper as Mapper } from './mappers/certification.persistence-mapper';

/** CertificationRepository on TypeORM. Study links are rewritten on every save. */
@Injectable()
export class TypeOrmCertificationRepository extends CertificationRepository {
  private readonly rows: BaseRepository<CertificationEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(CertificationEntity, tx);
  }

  private get links() {
    return this.tx.manager.getRepository(CertificationStudyEntity);
  }

  async create(certification: Certification): Promise<Certification> {
    await this.rows.insertEntity(Mapper.toEntity(certification));
    await this.writeLinks(certification);
    return (await this.findById(certification.ownerId, certification.id))!;
  }

  async save(certification: Certification): Promise<Certification> {
    const existing = await this.rows.findOwned(
      certification.ownerId,
      certification.id,
    );
    await this.rows.saveEntity(
      Mapper.toEntity(certification, existing ?? undefined),
    );
    await this.links.delete({ certificationId: certification.id });
    await this.writeLinks(certification);
    return (await this.findById(certification.ownerId, certification.id))!;
  }

  async findById(ownerId: string, id: string): Promise<Certification | null> {
    const entity = await this.rows.findOwned(ownerId, id, { studies: true });
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Certification[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { name: 'ASC' },
      relations: { studies: true },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(certification: Certification): Promise<void> {
    return this.rows.deleteOwned(certification.ownerId, certification.id);
  }

  private async writeLinks(certification: Certification): Promise<void> {
    const links = Mapper.toStudyEntities(certification);
    if (links.length) await this.links.insert(links);
  }
}
