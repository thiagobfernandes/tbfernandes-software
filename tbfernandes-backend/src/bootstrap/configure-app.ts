import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import session from 'express-session';
import {
  AppConfig,
  AuthConfig,
} from '../infrastructure/environments/registers';
import { SESSION_COOKIE } from '../modules/identity/infrastructure/security/session';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

/** HTTP settings shared by main.ts and the e2e tests. */
export function configureApp(app: INestApplication): INestApplication {
  const config = app.get(ConfigService);
  const appCfg = config.getOrThrow<AppConfig>('app');
  const auth = config.getOrThrow<AuthConfig>('auth');
  const express = app.getHttpAdapter().getInstance() as Express;

  express.set('query parser', 'extended');
  express.disable('x-powered-by');
  if (appCfg.trustProxy) express.set('trust proxy', 1);

  app.setGlobalPrefix('api/v1', { exclude: ['actuator/health'] });
  app.enableCors({
    origin: appCfg.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    // Paging totals and the new resource's URL are read by the frontend (PLT-09).
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size', 'Location'],
  });
  app.use(cookieParser());
  // In-memory sessions, like the servlet session before: one instance, one person.
  app.use(
    session({
      name: SESSION_COOKIE,
      secret: auth.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: auth.cookieSecure,
        maxAge: SEVEN_DAYS,
      },
    }),
  );

  if (appCfg.swagger) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('TBFernandes Software API')
        .setVersion('v1')
        .setDescription(
          'Personal and professional management platform. Errors use RFC 9457 Problem Details; ' +
            'enums are lower case, as in the frontend types.',
        )
        .build(),
    );
    SwaggerModule.setup('swagger-ui', app, document, {
      jsonDocumentUrl: 'v3/api-docs',
      useGlobalPrefix: false,
    });
  }
  return app;
}
