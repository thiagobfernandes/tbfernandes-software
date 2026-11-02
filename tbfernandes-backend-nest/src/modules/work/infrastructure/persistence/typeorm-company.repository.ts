import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Company, CompanyRepository } from '../../domain';
import { CompanyEntity } from './company.entity';
import { CompanyPersistenceMapper as Mapper } from './mappers/company.persistence-mapper';

/** CompanyRepository on TypeORM. */
@Injectable()
export class TypeOrmCompanyRepository extends CompanyRepository {
  private readonly rows: BaseRepository<CompanyEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(CompanyEntity, tx);
  }

  async create(company: Company): Promise<Company> {
    await this.rows.insertEntity(Mapper.toEntity(company));
    return company;
  }

  async save(company: Company): Promise<Company> {
    const existing = await this.rows.findOwned(company.ownerId, company.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(company, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<Company | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Company[]> {
    return (
      await this.rows.findAllOwned(ownerId, { order: { name: 'ASC' } })
    ).map((item) => Mapper.toDomain(item));
  }

  exists(ownerId: string, id: string): Promise<boolean> {
    return this.rows.existsOwned(ownerId, { id });
  }

  delete(company: Company): Promise<void> {
    return this.rows.deleteOwned(company.ownerId, company.id);
  }
}
