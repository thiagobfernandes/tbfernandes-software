import {
  Controller,
  Get,
  HttpCode,
  MessageEvent,
  Post,
  Put,
  Sse,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { interval, map, merge, Observable } from 'rxjs';
import { OwnerContext } from '../../../common/application';
import { IdParam, ValidatedQuery } from '../../../common/decorators';
import { NotificationService } from '../application/notification.service';
import { RemindersService } from '../application/reminders.service';
import type { NotificationListQuery } from '../protocols';
import {
  notificationListQuerySchema,
  NotificationMapper,
  NotificationResponse,
  NotificationSummaryResponse,
} from '../protocols';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly reminders: RemindersService,
    private readonly owner: OwnerContext,
  ) {}

  /** Checks the reminders first, so a due task shows up even between timer runs. */
  @Get()
  @ApiQuery({ name: 'unread', required: false })
  async list(
    @ValidatedQuery(notificationListQuerySchema) query: NotificationListQuery,
  ): Promise<NotificationResponse[]> {
    await this.reminders.check(this.owner.currentOwnerId());
    return (await this.notifications.list(query.unread)).map((item) =>
      NotificationMapper.toResponse(item),
    );
  }

  @Get('summary')
  async summary(): Promise<NotificationSummaryResponse> {
    return { unread: await this.notifications.unreadCount() };
  }

  /** Server-Sent Events `notification` with each new one, `ping` every 25 s. */
  @Sse('events')
  events(): Observable<MessageEvent> {
    const pushed = this.notifications.stream().pipe(
      map((notification): MessageEvent => ({
        type: 'notification',
        data: NotificationMapper.toResponse(notification),
      })),
    );
    const heartbeat = interval(25_000).pipe(
      map((): MessageEvent => ({ type: 'ping', data: {} })),
    );
    return merge(pushed, heartbeat);
  }

  @Put(':id/read')
  async markRead(@IdParam() id: string): Promise<NotificationResponse> {
    return NotificationMapper.toResponse(await this.notifications.markRead(id));
  }

  @Post('read-all')
  @HttpCode(204)
  async markAllRead(): Promise<void> {
    await this.notifications.markAllRead();
  }
}
