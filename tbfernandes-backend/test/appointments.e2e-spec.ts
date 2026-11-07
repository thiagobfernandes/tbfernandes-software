import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { create, startApp } from './support/test-app';

describe('Appointments API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  it('schedules, refuses overlaps and unlinks a deleted task', async () => {
    const taskId = await create(app, '/api/v1/tasks', {
      title: 'Revisar PR',
      status: 'todo',
      priority: 'normal',
    });
    const appointmentId = await create(app, '/api/v1/appointments', {
      title: 'Revisão',
      date: '2026-11-06',
      startTime: '09:15',
      endTime: '11:00:00',
      taskId,
    });

    const saved = await http().get(`/api/v1/appointments/${appointmentId}`);
    expect(saved.body).toEqual({
      id: appointmentId,
      title: 'Revisão',
      date: '2026-11-06',
      startTime: '09:15:00',
      endTime: '11:00:00',
      taskId,
      note: null,
    });

    const overlap = await http().post('/api/v1/appointments').send({
      title: 'Outra',
      date: '2026-11-06',
      startTime: '10:00:00',
      endTime: '12:00:00',
    });
    expect(overlap.status).toBe(422);
    expect(overlap.body.rule).toBe('RN-27');

    const backwards = await http().post('/api/v1/appointments').send({
      title: 'Ao contrário',
      date: '2026-11-06',
      startTime: '14:00:00',
      endTime: '13:00:00',
    });
    expect(backwards.body.rule).toBe('RN-26');

    const moved = await http()
      .put(`/api/v1/appointments/${appointmentId}`)
      .send({
        title: 'Revisão',
        date: '2026-11-06',
        startTime: '09:00:00',
        endTime: '11:00:00',
        taskId,
      });
    expect(moved.status).toBe(200);

    expect((await http().delete(`/api/v1/tasks/${taskId}`)).status).toBe(204);
    const unlinked = await http().get(`/api/v1/appointments/${appointmentId}`);
    expect(unlinked.body.taskId).toBeNull();

    expect(
      (await http().delete(`/api/v1/appointments/${appointmentId}`)).status,
    ).toBe(204);
  });
});
