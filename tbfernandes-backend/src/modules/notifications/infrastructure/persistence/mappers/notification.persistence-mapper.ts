import { Notification } from '../../../domain';
import { NotificationEntity } from '../notification.entity';

export const NotificationPersistenceMapper = {
  toDomain(entity: NotificationEntity): Notification {
    return Notification.restore(entity.id, entity.ownerId, {
      kind: entity.kind,
      title: entity.title,
      body: entity.body,
      href: entity.href,
      key: entity.dedupeKey,
      createdAt: entity.createdAt,
      readAt: entity.readAt,
    });
  },

  toEntity(
    notification: Notification,
    entity: NotificationEntity = new NotificationEntity(),
  ): NotificationEntity {
    const details = notification.details;
    entity.id = notification.id;
    entity.ownerId = notification.ownerId;
    entity.kind = details.kind;
    entity.title = details.title;
    entity.body = details.body;
    entity.href = details.href;
    entity.dedupeKey = details.key;
    entity.readAt = details.readAt;
    entity.createdAt = details.createdAt;
    return entity;
  },
};
