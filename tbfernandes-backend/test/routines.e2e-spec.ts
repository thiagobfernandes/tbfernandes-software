import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { create, startApp } from './support/test-app';

/** Today as the app's clock sees it (TBF_TIME_ZONE defaults to São Paulo). */
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
}).format(new Date());

const plusDays = (day: string, days: number) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

describe('Routines API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  it('creates a daily routine linked to a task and takes its project (RN-34)', async () => {
    const projectId = await create(app, '/api/v1/projects', {
      name: 'Certificação AWS',
      category: 'study',
      status: 'active',
      startDate: '2026-11-01',
    });
    const taskId = await create(app, '/api/v1/tasks', {
      title: 'Passar na prova',
      status: 'in_progress',
      priority: 'high',
      projectId,
    });
    const id = await create(app, '/api/v1/routines', {
      title: 'Estudar 30 minutos',
      taskId,
      startTime: '07:00',
      targetMinutes: 30,
      startDate: '2026-11-01',
    });

    const routine = await http().get(`/api/v1/routines/${id}`);
    expect(routine.body).toMatchObject({
      title: 'Estudar 30 minutos',
      taskId,
      projectId,
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      startTime: '07:00:00',
      targetMinutes: 30,
      active: true,
    });

    const invalid = await http()
      .post('/api/v1/routines')
      .send({ title: 'Sem dias', weekdays: [], startDate: '2026-11-01' });
    expect(invalid.status).toBe(400);
  });

  it('links a routine to a goal without any project', async () => {
    const goalId = await create(app, '/api/v1/goals', {
      name: 'Falar inglês fluente',
      area: 'learning',
      desiredResult: 'Conversar 30 minutos sem travar',
    });
    const id = await create(app, '/api/v1/routines', {
      title: 'Praticar inglês',
      goalId,
      weekdays: [1, 3, 5],
      startDate: '2026-11-01',
    });

    const routine = await http().get(`/api/v1/routines/${id}`);
    expect(routine.body).toMatchObject({
      goalId,
      projectId: null,
      taskId: null,
      weekdays: [1, 3, 5],
    });

    const unlinked = await http().put(`/api/v1/routines/${id}`).send({
      title: 'Praticar inglês',
      goalId: null,
      startDate: '2026-11-01',
    });
    expect(unlinked.status).toBe(200);
    expect(unlinked.body.goalId).toBeNull();
  });

  it('checks a day once, refuses the future and unchecks (RN-32, RN-33)', async () => {
    const routineId = await create(app, '/api/v1/routines', {
      title: 'Revisar a agenda',
      startDate: '2026-11-01',
    });

    const checkId = await create(app, '/api/v1/routine-checks', {
      routineId,
      date: today,
    });
    const again = await http()
      .post('/api/v1/routine-checks')
      .send({ routineId, date: today });
    expect(again.status).toBe(409);
    expect(again.body.rule).toBe('RN-33');

    const future = await http()
      .post('/api/v1/routine-checks')
      .send({ routineId, date: plusDays(today, 1) });
    expect(future.status).toBe(422);
    expect(future.body.rule).toBe('RN-32');

    const noted = await http()
      .put(`/api/v1/routine-checks/${checkId}`)
      .send({ routineId, date: today, note: 'Feito cedo' });
    expect(noted.body).toMatchObject({ date: today, note: 'Feito cedo' });

    const listed = await http().get(
      `/api/v1/routine-checks?routineId=${routineId}&from=${today}`,
    );
    expect(listed.body).toHaveLength(1);

    await http().delete(`/api/v1/routine-checks/${checkId}`).expect(204);
    const after = await http().get(
      `/api/v1/routine-checks?routineId=${routineId}`,
    );
    expect(after.body).toHaveLength(0);
  });

  it('refuses checks on a paused routine (RN-32)', async () => {
    const routineId = await create(app, '/api/v1/routines', {
      title: 'Pausada',
      startDate: '2026-11-01',
      active: false,
    });
    const response = await http()
      .post('/api/v1/routine-checks')
      .send({ routineId, date: today });
    expect(response.status).toBe(422);
  });

  it('links time entries to the routine and keeps them when it is deleted (RN-34)', async () => {
    const taskId = await create(app, '/api/v1/tasks', {
      title: 'Ler documentação',
      status: 'todo',
      priority: 'normal',
    });
    const routineId = await create(app, '/api/v1/routines', {
      title: 'Leitura diária',
      taskId,
      startDate: '2026-11-01',
    });
    const checkId = await create(app, '/api/v1/routine-checks', {
      routineId,
      date: today,
    });
    const entryId = await create(app, '/api/v1/time-entries', {
      description: 'Leitura diária',
      routineId,
      startedAt: '2026-11-04T06:00:00Z',
      endedAt: '2026-11-04T06:30:00Z',
    });

    const entry = await http().get(`/api/v1/time-entries/${entryId}`);
    expect(entry.body).toMatchObject({ routineId, taskId });

    await http().delete(`/api/v1/routines/${routineId}`).expect(204);
    const kept = await http().get(`/api/v1/time-entries/${entryId}`);
    expect(kept.body).toMatchObject({ routineId: null, taskId });
    await http().get(`/api/v1/routine-checks/${checkId}`).expect(404);
  });

  it('unlinks the routine from a deleted task', async () => {
    const taskId = await create(app, '/api/v1/tasks', {
      title: 'Temporária',
      status: 'todo',
      priority: 'normal',
    });
    const routineId = await create(app, '/api/v1/routines', {
      title: 'Ligada à temporária',
      taskId,
      startDate: '2026-11-01',
    });
    await http().delete(`/api/v1/tasks/${taskId}`).expect(204);
    const routine = await http().get(`/api/v1/routines/${routineId}`);
    expect(routine.body.taskId).toBeNull();
  });
});
