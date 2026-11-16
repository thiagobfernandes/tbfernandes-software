import { Joi } from '../../../common/protocols';

export interface NotificationListQuery {
  unread: boolean;
}

export const notificationListQuerySchema = Joi.object<NotificationListQuery>({
  unread: Joi.boolean().default(false),
});
