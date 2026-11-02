import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { uuidv7 } from '../src/common/domain';
import { migrationLocations } from '../src/infrastructure/environments/registers';
import { SqlMigrator } from '../src/infrastructure/database/migrations/sql-migrator';
import { startApp } from './support/test-app';

describe('Platform', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  describe('client ids (ADR-007)', () => {
    const company = (name: string) => ({
      name,
      relationship: 'client',
      startDate: '2026-01-01',
    });

    it('uses the client id once and refuses it a second time', async () => {
      const id = uuidv7();
      const created = await http()
        .post('/api/v1/companies')
        .set('X-Client-Id', id)
        .send(company('Client id'));
      expect(created.status).toBe(201);
      expect(created.body.id).toBe(id);

      const again = await http()
        .post('/api/v1/companies')
        .set('X-Client-Id', id)
        .send(company('Other'));
      expect(again.status).toBe(409);
      expect(again.body.rule).toBe('ADR-007');
      expect((await http().get(`/api/v1/companies/${id}`)).body.name).toBe(
        'Client id',
      );
    });

    it('gives child records server ids', async () => {
      const id = uuidv7();
      const task = await http()
        .post('/api/v1/tasks')
        .set('X-Client-Id', id)
        .send({
          title: 'With checklist',
          checklistItems: [{ title: 'a' }, { title: 'b' }],
        });
      expect(task.status).toBe(201);
      expect(task.body.id).toBe(id);
      expect(task.body.checklistItems[0].id).not.toBe(id);
    });

    it('rejects a header that is not a UUID', async () => {
      const response = await http()
        .post('/api/v1/companies')
        .set('X-Client-Id', 'not-a-uuid')
        .send({});
      expect(response.status).toBe(400);
    });
  });

  it('answers the health check', async () => {
    expect((await http().get('/actuator/health')).body).toEqual({
      status: 'UP',
    });
  });

  it('serves the OpenAPI document the frontend types come from', async () => {
    const docs = await http().get('/v3/api-docs');
    expect(docs.status).toBe(200);
    expect(docs.body.paths['/api/v1/tasks']).toBeDefined();
    expect(docs.body.components.schemas.LoginRequest).toBeDefined();
  });

  it('finds nothing to apply when migrations run again', async () => {
    const applied = await new SqlMigrator(
      app.get(DataSource),
      migrationLocations('test'),
    ).migrate();
    expect(applied).toBe(0);
  });
});
