import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import {
  LeadMessage,
  LeadMessageRepository,
  MessageDirection,
} from '../../domain';
import { LeadMessageEntity } from './lead-message.entity';
import { LeadMessagePersistenceMapper as Mapper } from './mappers/lead-message.persistence-mapper';

@Injectable()
export class TypeOrmLeadMessageRepository extends LeadMessageRepository {
  private readonly rows: BaseRepository<LeadMessageEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(LeadMessageEntity, tx);
  }

  async create(message: LeadMessage): Promise<LeadMessage> {
    await this.rows.insertEntity(Mapper.toEntity(message));
    return message;
  }

  async findAll(
    ownerId: string,
    leadId: string | null,
  ): Promise<LeadMessage[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: leadId ? { leadId } : {},
      order: { sentAt: 'DESC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  async findSame(
    ownerId: string,
    leadId: string,
    direction: MessageDirection,
    sentAt: Date,
  ): Promise<LeadMessage | null> {
    const [entity] = await this.rows.findAllOwned(ownerId, {
      where: { leadId, direction, sentAt },
    });
    return entity ? Mapper.toDomain(entity) : null;
  }
}
