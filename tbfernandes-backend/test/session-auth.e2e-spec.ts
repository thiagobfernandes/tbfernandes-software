import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppUser, AppUserRepository } from '../src/modules/identity/domain';
import { PasswordHasher } from '../src/modules/identity/application/password-hasher';
import { JwtService } from '@nestjs/jwt';
import { startApp } from './support/test-app';

const OWNER = {
  email: 'owner@tbfernandes.local',
  password: 'correct horse battery',
};

describe('Session auth', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await startApp({
      TBF_AUTH_MODE: 'session',
      TBF_AUTH_BOOTSTRAP_EMAIL: OWNER.email,
      TBF_AUTH_BOOTSTRAP_PASSWORD: OWNER.password,
      TBF_LOGIN_ATTEMPTS_PER_MINUTE: '100',
    });
  });

  afterAll(() => app.close());

  /** A browser-like agent: keeps cookies and echoes the CSRF cookie in X-XSRF-TOKEN. */
  async function agentWithCsrf() {
    const agent = request.agent(app.getHttpServer());
    const session = await agent.get('/api/v1/auth/session');
    const cookie = ([] as string[])
      .concat(session.headers['set-cookie'] ?? [])
      .find((header) => header.startsWith('XSRF-TOKEN='));
    const token = decodeURIComponent(cookie!.split(';')[0].split('=')[1]);
    return { agent, token };
  }

  async function login(email: string, password: string) {
    const { agent, token } = await agentWithCsrf();
    const response = await agent
      .post('/api/v1/auth/login')
      .set('X-XSRF-TOKEN', token)
      .send({ email, password });
    expect(response.status).toBe(204);
    return { agent, token };
  }

  it('needs a session for the API and the CSRF token for login', async () => {
    const http = request(app.getHttpServer());
    expect((await http.get('/api/v1/companies')).status).toBe(401);
    expect((await http.post('/api/v1/auth/login').send(OWNER)).status).toBe(
      403,
    );

    const { agent, token } = await agentWithCsrf();
    const wrong = await agent
      .post('/api/v1/auth/login')
      .set('X-XSRF-TOKEN', token)
      .send({ ...OWNER, password: 'wrong' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.detail).toBe('E-mail ou senha incorretos');

    const owner = await login(OWNER.email, OWNER.password);
    const me = await owner.agent.get('/api/v1/me');
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email: OWNER.email, hasPassword: true });
    expect((await owner.agent.get('/api/v1/auth/session')).body).toEqual({
      mode: 'session',
      signedIn: true,
    });

    expect(
      (
        await owner.agent
          .post('/api/v1/auth/logout')
          .set('X-XSRF-TOKEN', owner.token)
      ).status,
    ).toBe(204);
    expect((await owner.agent.get('/api/v1/me')).status).toBe(401);
  });

  it('keeps owners apart', async () => {
    const hasher = app.get(PasswordHasher);
    const other = AppUser.create('0192f000-0000-7000-8000-0000000000aa', {
      name: 'Other',
      email: 'other@example.com',
      locale: null,
      timeZone: null,
    });
    other.changePasswordHash(await hasher.hash('another long password'));
    await app.get(AppUserRepository).save(other);

    const otherSession = await login(
      'other@example.com',
      'another long password',
    );
    const created = await otherSession.agent
      .post('/api/v1/companies')
      .set('X-XSRF-TOKEN', otherSession.token)
      .send({ name: 'Private', relationship: 'own', startDate: '2026-01-01' });
    expect(created.status).toBe(201);

    const owner = await login(OWNER.email, OWNER.password);
    expect(
      (await owner.agent.get(`/api/v1/companies/${created.body.id}`)).status,
    ).toBe(404);
    expect(
      (await otherSession.agent.get(`/api/v1/companies/${created.body.id}`))
        .status,
    ).toBe(200);
  });

  it('changes the password only with the current one (RN-25)', async () => {
    const owner = await login(OWNER.email, OWNER.password);
    const wrong = await owner.agent
      .put('/api/v1/me/password')
      .set('X-XSRF-TOKEN', owner.token)
      .send({ current: 'nope', next: 'a brand new long password' });
    expect(wrong.status).toBe(422);
    expect(wrong.body.rule).toBe('RN-25');
    const short = await owner.agent
      .put('/api/v1/me/password')
      .set('X-XSRF-TOKEN', owner.token)
      .send({ current: OWNER.password, next: 'short' });
    expect(short.status).toBe(422);
  });

  it('signs in with an httpOnly JWT cookie and refuses forged tokens', async () => {
    const { agent, token } = await agentWithCsrf();
    const response = await agent
      .post('/api/v1/auth/login')
      .set('X-XSRF-TOKEN', token)
      .send(OWNER);
    const cookie = ([] as string[])
      .concat(response.headers['set-cookie'] ?? [])
      .find((header) => header.startsWith('TBF_TOKEN='));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);

    const http = request(app.getHttpServer());
    const garbage = await http.get('/api/v1/me').set('Cookie', 'TBF_TOKEN=abc');
    expect(garbage.status).toBe(401);

    const foreign = new JwtService({ secret: 'x'.repeat(40) }).sign({
      sub: '0192f000-0000-7000-8000-000000000001',
    });
    const forged = await http
      .get('/api/v1/me')
      .set('Cookie', `TBF_TOKEN=${foreign}`);
    expect(forged.status).toBe(401);
    expect(
      (
        await http
          .get('/api/v1/auth/session')
          .set('Cookie', `TBF_TOKEN=${foreign}`)
      ).body.signedIn,
    ).toBe(false);
  });
});

describe('Login rate limit', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await startApp({
      TBF_AUTH_MODE: 'session',
      TBF_AUTH_BOOTSTRAP_EMAIL: OWNER.email,
      TBF_AUTH_BOOTSTRAP_PASSWORD: OWNER.password,
      TBF_LOGIN_ATTEMPTS_PER_MINUTE: '2',
    });
  });

  afterAll(async () => {
    process.env.TBF_LOGIN_ATTEMPTS_PER_MINUTE = '100';
    await app.close();
  });

  it('answers 429 after too many attempts', async () => {
    const agent = request.agent(app.getHttpServer());
    const session = await agent.get('/api/v1/auth/session');
    const cookie = ([] as string[])
      .concat(session.headers['set-cookie'] ?? [])
      .find((header) => header.startsWith('XSRF-TOKEN='));
    const token = decodeURIComponent(cookie!.split(';')[0].split('=')[1]);
    const attempt = () =>
      agent
        .post('/api/v1/auth/login')
        .set('X-XSRF-TOKEN', token)
        .send({ ...OWNER, password: 'wrong password!' });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.detail).toBe(
      'Muitas tentativas de login. Tente de novo em um minuto.',
    );
  });
});
