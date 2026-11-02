import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { AppConfig } from './infrastructure/environments/registers';
import { Logger, NestLoggerAdapter } from './infrastructure/logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new NestLoggerAdapter(),
    bufferLogs: true,
  });
  configureApp(app);
  app.enableShutdownHooks();
  const { port, host, profile } = app
    .get(ConfigService)
    .getOrThrow<AppConfig>('app');
  await app.listen(port, host);
  Logger.info(`TBFernandes API (${profile}) on http://${host}:${port}`);
}

bootstrap().catch((error: unknown) => {
  Logger.error('Startup failed', error);
  process.exit(1);
});
