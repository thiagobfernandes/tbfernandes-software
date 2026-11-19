import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { appConfig } from '../../../infrastructure/environments/registers';
import { Logger } from '../../../infrastructure/logger';
import { OwnerDirectory } from '../application/owner-directory';
import { RemindersService } from '../application/reminders.service';

const EVERY_MS = 15 * 60 * 1000;

/** Runs the reminders every 15 minutes (not in tests, which call them directly). */
@Injectable()
export class ReminderScheduler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly reminders: RemindersService,
    private readonly owners: OwnerDirectory,
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  onApplicationBootstrap(): void {
    if (this.app.profile === 'test') return;
    this.timer = setInterval(() => void this.run(), EVERY_MS);
    this.timer.unref();
    void this.run();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async run(): Promise<void> {
    for (const ownerId of this.owners.owners()) {
      try {
        await this.reminders.check(ownerId);
      } catch (error) {
        Logger.warn(`Reminders failed: ${(error as Error).message}`);
      }
    }
  }
}
