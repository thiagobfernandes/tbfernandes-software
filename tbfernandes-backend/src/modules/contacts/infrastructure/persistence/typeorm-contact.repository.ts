import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Contact, ContactRepository } from '../../domain';
import { ContactEntity } from './contact.entity';
import { ContactPersistenceMapper as Mapper } from './mappers/contact.persistence-mapper';

/** ContactRepository on TypeORM. */
@Injectable()
export class TypeOrmContactRepository extends ContactRepository {
  private readonly rows: BaseRepository<ContactEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(ContactEntity, tx);
  }

  async create(contact: Contact): Promise<Contact> {
    await this.rows.insertEntity(Mapper.toEntity(contact));
    return contact;
  }

  async save(contact: Contact): Promise<Contact> {
    const existing = await this.rows.findOwned(contact.ownerId, contact.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(contact, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<Contact | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Contact[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { name: 'ASC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  async findByCompany(ownerId: string, companyId: string): Promise<Contact[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: { companyId },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(contact: Contact): Promise<void> {
    return this.rows.deleteOwned(contact.ownerId, contact.id);
  }
}
