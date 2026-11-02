import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from './common/common.module';
import {
  ClientIdMiddleware,
  LoggerMiddleware,
  RequestContextMiddleware,
} from './common/middlewares';
import { DatabaseModule } from './infrastructure/database/database.module';
import { DesktopTokenMiddleware } from './infrastructure/desktop/desktop-token.middleware';
import { EnvironmentModule } from './infrastructure/environments/environment.module';
import {
  authConfig,
  desktopConfig,
} from './infrastructure/environments/registers';
import { ContactsModule } from './modules/contacts/contacts.module';
import { FinanceModule } from './modules/finance';
import { IdentityModule } from './modules/identity/identity.module';
import { CsrfMiddleware } from './modules/identity/infrastructure/security/csrf.middleware';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { WorkModule } from './modules/work/work.module';

@Module({
  imports: [
    EnvironmentModule,
    DatabaseModule.forRoot(),
    EventEmitterModule.forRoot({ wildcard: false }),
    CommonModule,
    IdentityModule,
    WorkModule,
    KnowledgeModule,
    ContactsModule,
    FinanceModule,
  ],
})
export class AppModule implements NestModule {
  constructor(
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
    @Inject(desktopConfig.KEY)
    private readonly desktop: ConfigType<typeof desktopConfig>,
  ) {}

  /** Order matters: context first, then the log line, then the checks that can refuse a request. */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, LoggerMiddleware)
      .forRoutes('*path');
    if (this.desktop.token) {
      const token = this.desktop.token;
      consumer
        .apply((req: Request, res: Response, next: NextFunction) =>
          new DesktopTokenMiddleware(token).use(req, res, next),
        )
        .forRoutes('*path');
    }
    consumer.apply(ClientIdMiddleware).forRoutes('*path');
    if (this.auth.mode === 'session')
      consumer.apply(CsrfMiddleware).forRoutes('*path');
  }
}
