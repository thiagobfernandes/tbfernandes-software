import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { create, startApp } from './support/test-app';

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

describe('Time entries API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  it('tracks in real time: start, refuse a second running entry, stop', async () => {
    const projectId = await create(app, '/api/v1/projects', {
      name: 'Apontamentos',
      category: 'professional',
      status: 'active',
      startDate: '2026-11-01',
    });
    const taskId = await create(app, '/api/v1/tasks', {
      title: 'Tela de apontamentos',
      status: 'in_progress',
      priority: 'normal',
      projectId,
    });
    const startedAt = minutesAgo(30);
    const id = await create(app, '/api/v1/time-entries', {
      description: 'Construindo a tela',
      taskId,
      startedAt,
    });

    const running = await http().get(`/api/v1/time-entries/${id}`);
    expect(running.body).toMatchObject({
      description: 'Construindo a tela',
      taskId,
      projectId,
      endedAt: null,
      note: null,
    });
    expect(running.body.durationSeconds).toBeGreaterThanOrEqual(1799);

    const second = await http()
      .post('/api/v1/time-entries')
      .send({ description: 'Outra coisa', startedAt: minutesAgo(1) });
    expect(second.status).toBe(409);
    expect(second.body.rule).toBe('RN-28');

    const stopped = await http()
      .put(`/api/v1/time-entries/${id}`)
      .send({
        description: 'Construindo a tela',
        taskId,
        startedAt,
        endedAt: minutesAgo(0),
      });
    expect(stopped.status).toBe(200);
    expect(stopped.body.endedAt).not.toBeNull();

    const list = await http().get('/api/v1/time-entries');
    const ids = (list.body as { id: string }[]).map((item) => item.id);
    expect(ids).toContain(id);
  });

  it('logs past work and refuses overlaps, future periods and unknown tasks', async () => {
    const day = '2026-11-02';
    await create(app, '/api/v1/time-entries', {
      description: 'Reunião',
      startedAt: `${day}T09:00:00Z`,
      endedAt: `${day}T10:00:00Z`,
    });

    const overlap = await http()
      .post('/api/v1/time-entries')
      .send({
        description: 'Revisão',
        startedAt: `${day}T09:30:00Z`,
        endedAt: `${day}T10:30:00Z`,
      });
    expect(overlap.status).toBe(422);
    expect(overlap.body.rule).toBe('RN-30');

    const touching = await http()
      .post('/api/v1/time-entries')
      .send({
        description: 'Revisão',
        startedAt: `${day}T10:00:00Z`,
        endedAt: `${day}T10:30:00Z`,
      });
    expect(touching.status).toBe(201);

    const future = await http()
      .post('/api/v1/time-entries')
      .send({
        description: 'Amanhã',
        startedAt: new Date(Date.now() + 3_600_000).toISOString(),
      });
    expect(future.status).toBe(422);
    expect(future.body.rule).toBe('RN-29');

    const unknownTask = await http()
      .post('/api/v1/time-entries')
      .send({
        description: 'Sem tarefa',
        startedAt: `${day}T11:00:00Z`,
        endedAt: `${day}T12:00:00Z`,
        taskId: '0192f000-0000-7000-8000-00000000dead',
      });
    expect(unknownTask.status).toBe(404);

    const invalid = await http()
      .post('/api/v1/time-entries')
      .send({ startedAt: 'ontem' });
    expect(invalid.status).toBe(400);
  });

  it('deletes an entry', async () => {
    const id = await create(app, '/api/v1/time-entries', {
      description: 'Para apagar',
      startedAt: '2026-11-03T08:00:00Z',
      endedAt: '2026-11-03T08:30:00Z',
    });
    expect((await http().delete(`/api/v1/time-entries/${id}`)).status).toBe(
      204,
    );
    expect((await http().get(`/api/v1/time-entries/${id}`)).status).toBe(404);
  });
});
