import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

/**
 * Starts the whole app (real HTTP stack, use cases and PostgreSQL) with the given
 * environment. Modules are loaded after the variables are set, because the configuration is
 * read when they load.
 */
export async function startApp(
  env: Record<string, string> = {},
  override: (builder: TestingModuleBuilder) => TestingModuleBuilder = (
    builder,
  ) => builder,
): Promise<INestApplication<App>> {
  Object.assign(process.env, {
    TBF_PROFILE: 'test',
    LOG_LEVEL: 'silent',
    ...env,
  });
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { Logger } =
    require('../../src/infrastructure/logger') as typeof import('../../src/infrastructure/logger');
  Logger.configure({ silent: true });
  const { AppModule } =
    require('../../src/app.module') as typeof import('../../src/app.module');
  const { configureApp } =
    require('../../src/bootstrap/configure-app') as typeof import('../../src/bootstrap/configure-app');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const moduleRef = await override(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>({
    logger: false,
  });
  configureApp(app);
  await app.init();
  return app;
}

export async function create(
  app: INestApplication<App>,
  uri: string,
  body: object,
): Promise<string> {
  const response = await request(app.getHttpServer()).post(uri).send(body);
  if (response.status !== 201) {
    throw new Error(
      `POST ${uri} answered ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }
  return (response.body as { id: string }).id;
}

/** Waits for work done by event listeners after the request answered. */
export async function eventually(
  check: () => Promise<boolean>,
  timeoutMs = 5000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error('Condition not met in time');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
