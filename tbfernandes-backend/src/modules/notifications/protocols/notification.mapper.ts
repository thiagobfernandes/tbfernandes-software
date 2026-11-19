import { toInstant } from '../../../common/protocols/instant';
import { Notification } from '../domain';
import { NotificationResponse } from './notification.response';

export const NotificationMapper = {
  toResponse(notification: Notification): NotificationResponse {
    const details = notification.details;
    return {
      id: notification.id,
      kind: details.kind.toLowerCase(),
      title: details.title,
      body: details.body,
      href: details.href,
      createdAt: toInstant(details.createdAt)!,
      readAt: toInstant(details.readAt),
    };
  },
};
