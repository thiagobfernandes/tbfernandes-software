import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { DateTime } from 'luxon';
import { Clock } from '../../common/application';
import { IsoDate } from '../../common/domain';
import { appConfig } from '../environments/registers';

@Injectable()
export class SystemClock extends Clock {
  private readonly zone: string;

  constructor(@Inject(appConfig.KEY) config: ConfigType<typeof appConfig>) {
    super();
    this.zone = config.timeZone;
  }

  now(): Date {
    return new Date();
  }

  today(): IsoDate {
    return DateTime.now().setZone(this.zone).toISODate()!;
  }

  startOfWeek(): Date {
    return DateTime.now().setZone(this.zone).startOf('week').toJSDate();
  }
}
