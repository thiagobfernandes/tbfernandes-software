import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import {
  SendableStage,
  SendRequest,
  SendRequestRepository,
  SendRequestStatus,
} from '../../domain';
import { SendRequestPersistenceMapper as Mapper } from './mappers/send-request.persistence-mapper';
import { SendRequestEntity } from './send-request.entity';

@Injectable()
export class TypeOrmSendRequestRepository extends SendRequestRepository {
  private readonly rows: BaseRepository<SendRequestEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(SendRequestEntity, tx);
  }

  async create(request: SendRequest): Promise<SendRequest> {
    await this.rows.insertEntity(Mapper.toEntity(request));
    return request;
  }

  async save(request: SendRequest): Promise<SendRequest> {
    const existing = await this.rows.findOwned(request.ownerId, request.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(request, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<SendRequest | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findLatest(
    ownerId: string,
    leadId: string,
    stage: SendableStage,
  ): Promise<SendRequest | null> {
    const [entity] = await this.rows.findAllOwned(ownerId, {
      where: { leadId, stage },
      order: { requestedAt: 'DESC' },
    });
    return entity ? Mapper.toDomain(entity) : null;
  }

  async findAll(
    ownerId: string,
    status: SendRequestStatus | null,
  ): Promise<SendRequest[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: status ? { status } : {},
      order: { requestedAt: 'DESC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  async findOpen(ownerId: string): Promise<SendRequest[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: { status: In(['PENDING', 'APPROVED']) },
      order: { requestedAt: 'ASC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }
}
