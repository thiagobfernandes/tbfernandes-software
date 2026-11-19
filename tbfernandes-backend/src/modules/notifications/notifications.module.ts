import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ContactsModule } from '../contacts';
import { WorkModule } from '../work';
import { NotificationChannel } from './application/notification-channel';
import { NotificationService } from './application/notification.service';
import { OwnerDirectory } from './application/owner-directory';
import { ProspectingEventsListener } from './application/prospecting-events.listener';
import { RemindersService } from './application/reminders.service';
import { NotificationRepository } from './domain';
import { InMemoryNotificationChannel } from './infrastructure/channel/in-memory-notification-channel';
import { ConfigOwnerDirectory } from './infrastructure/config-owner-directory';
import { NotificationEntity } from './infrastructure/persistence/notification.entity';
import { TypeOrmNotificationRepository } from './infrastructure/persistence/typeorm-notification.repository';
import { ReminderScheduler } from './infrastructure/reminder-scheduler';
import { NotificationController } from './web/notification.controller';

@Module({
  imports: [
    WorkModule,
    ContactsModule,
    DatabaseModule.forFeature([NotificationEntity]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    RemindersService,
    ProspectingEventsListener,
    ReminderScheduler,
    {
      provide: NotificationRepository,
      useClass: TypeOrmNotificationRepository,
    },
    { provide: NotificationChannel, useClass: InMemoryNotificationChannel },
    { provide: OwnerDirectory, useClass: ConfigOwnerDirectory },
  ],
})
export class NotificationsModule {}
