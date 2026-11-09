import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { startApp } from './support/test-app';

const TOKEN = 'launch-token-0123456789abcdef';

describe('Desktop token', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await startApp({ TBF_DESKTOP_TOKEN: TOKEN });
  });

  afterAll(() => app.close());

  it('refuses requests without the token and lets preflights through', async () => {
    const http = request(app.getHttpServer());
    const refused = await http.get('/api/v1/companies');
    expect(refused.status).toBe(401);
    expect(refused.body.detail).toBe('Token do aplicativo ausente ou inválido');
    expect(
      (await http.get('/api/v1/companies').set('X-TBF-Desktop-Token', 'wrong'))
        .status,
    ).toBe(401);
    expect(
      (await http.get('/api/v1/companies').set('X-TBF-Desktop-Token', TOKEN))
        .status,
    ).toBe(200);
    expect((await http.options('/api/v1/companies')).status).toBeLessThan(400);
  });
});
