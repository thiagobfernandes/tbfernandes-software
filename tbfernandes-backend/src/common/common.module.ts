import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Clock, IdGenerator } from './application';
import { ProblemDetailsFilter } from './filters/problem-details.filter';
import { PagingInterceptor } from './interceptors/paging.interceptor';
import { HealthController } from './web/health.controller';
import { RequestIdGenerator } from '../infrastructure/ids/request-id-generator';
import { SystemClock } from '../infrastructure/time/system-clock';

@Global()
@Module({
  controllers: [HealthController],
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: IdGenerator, useClass: RequestIdGenerator },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: PagingInterceptor },
  ],
  exports: [Clock, IdGenerator],
})
export class CommonModule {}
