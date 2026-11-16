import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Lead, LeadRepository, LeadStatus } from '../../domain';
import { LeadEntity } from './lead.entity';
import { LeadPersistenceMapper as Mapper } from './mappers/lead.persistence-mapper';

@Injectable()
export class TypeOrmLeadRepository extends LeadRepository {
  private readonly rows: BaseRepository<LeadEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(LeadEntity, tx);
  }

  async create(lead: Lead): Promise<Lead> {
    await this.rows.insertEntity(Mapper.toEntity(lead));
    return lead;
  }

  async save(lead: Lead): Promise<Lead> {
    const existing = await this.rows.findOwned(lead.ownerId, lead.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(Mapper.toEntity(lead, existing ?? undefined)),
    );
  }

  async findById(ownerId: string, id: string): Promise<Lead | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findByExternalId(
    ownerId: string,
    externalId: string,
  ): Promise<Lead | null> {
    const [entity] = await this.rows.findAllOwned(ownerId, {
      where: { externalId },
    });
    return entity ? Mapper.toDomain(entity) : null;
  }

  async findAll(ownerId: string, status: LeadStatus | null): Promise<Lead[]> {
    const query = this.rows.repository
      .createQueryBuilder('lead')
      .where('lead.ownerId = :ownerId', { ownerId })
      .orderBy('lead.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('lead.name', 'ASC');
    if (status) query.andWhere('lead.status = :status', { status });
    const rows = await query.getMany();
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(lead: Lead): Promise<void> {
    return this.rows.deleteOwned(lead.ownerId, lead.id);
  }
}
