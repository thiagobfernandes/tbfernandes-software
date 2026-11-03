import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { DesktopRuntime } from './infrastructure/desktop/desktop-runtime';
import { AppConfig } from './infrastructure/environments/registers';
import { Logger, NestLoggerAdapter } from './infrastructure/logger';

async function bootstrap(): Promise<void> {
  // Desktop: the embedded PostgreSQL must be up before the app reads DB_* and connects.
  const desktop =
    process.env.TBF_PROFILE === 'desktop' ? await DesktopRuntime.start() : null;
  try {
    // The configuration is read here, so it sees the embedded database's DB_* values.
    const app = await NestFactory.create(AppModule, {
      logger: new NestLoggerAdapter(),
      bufferLogs: true,
    });
    configureApp(app);
    const { port, host, profile } = app
      .get(ConfigService)
      .getOrThrow<AppConfig>('app');
    if (desktop) {
      desktop.onExit(() => app.close());
      desktop.watchParent(Number(process.env.TBF_PARENT_PID) || null);
      for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        process.once(signal, () => void desktop.exit());
      }
    } else {
      app.enableShutdownHooks();
    }
    await app.listen(port, host);
    Logger.info(`TBFernandes API (${profile}) on http://${host}:${port}`);
  } catch (error) {
    await desktop?.postgres.stop();
    throw error;
  }
}

bootstrap().catch((error: unknown) => {
  Logger.error('Startup failed', error);
  process.exit(1);
});
