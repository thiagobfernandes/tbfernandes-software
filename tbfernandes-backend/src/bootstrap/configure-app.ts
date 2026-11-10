import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import { AppConfig } from '../infrastructure/environments/registers';

export function configureApp(app: INestApplication): INestApplication {
  const config = app.get(ConfigService);
  const appCfg = config.getOrThrow<AppConfig>('app');
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
