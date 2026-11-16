import { Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Notification, NotificationRepository } from '../../domain';
import { NotificationPersistenceMapper as Mapper } from './mappers/notification.persistence-mapper';
import { NotificationEntity } from './notification.entity';

@Injectable()
export class TypeOrmNotificationRepository extends NotificationRepository {
  private readonly rows: BaseRepository<NotificationEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(NotificationEntity, tx);
  }

  async createOnce(notification: Notification): Promise<boolean> {
    const result = await this.rows.repository
      .createQueryBuilder()
      .insert()
      .into(NotificationEntity)
      .values(Mapper.toEntity(notification))
      .orIgnore()
      .returning('id')
      .execute();
    return (result.raw as { id: string }[]).length > 0;
  }

  async save(notification: Notification): Promise<Notification> {
    const existing = await this.rows.findOwned(
      notification.ownerId,
      notification.id,
    );
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(notification, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<Notification | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findRecent(
    ownerId: string,
    unreadOnly: boolean,
    limit: number,
  ): Promise<Notification[]> {
    const rows = await this.rows.repository.find({
      where: { ownerId, ...(unreadOnly ? { readAt: IsNull() } : {}) },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  countUnread(ownerId: string): Promise<number> {
    return this.rows.repository.count({ where: { ownerId, readAt: IsNull() } });
  }

  async markAllRead(ownerId: string, now: Date): Promise<void> {
    await this.rows.repository.update(
      { ownerId, readAt: IsNull() },
      { readAt: now },
    );
  }
}
