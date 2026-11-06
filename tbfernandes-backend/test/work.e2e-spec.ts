import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import request from 'supertest';
import type { App } from 'supertest/types';
import { create, startApp } from './support/test-app';

describe('Work API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  it('runs the company, project and task lifecycle', async () => {
    const completed: unknown[] = [];
    app
      .get(EventEmitter2)
      .on('work.task-completed', (event: unknown) => completed.push(event));

    const companyId = await create(app, '/api/v1/companies', {
      name: 'Software house',
      relationship: 'contractor',
      startDate: '2025-03-10',
    });
    const projectId = await create(app, '/api/v1/projects', {
      name: 'Telemetry support',
      companyId,
      category: 'professional',
      status: 'active',
      startDate: '2026-09-01',
    });

    const created = await http()
      .post('/api/v1/tasks')
      .send({
        title: 'Investigate ingestion alert',
        projectId,
        status: 'in_progress',
        priority: 'urgent',
        checklist: { done: 2, total: 5 },
      });
    expect(created.status).toBe(201);
    expect(created.headers.location).toBe(`/api/v1/tasks/${created.body.id}`);
    expect(created.body).toMatchObject({
      status: 'in_progress',
      priority: 'urgent',
      checklist: { done: 2, total: 5 },
    });

    const done = await http()
      .patch(`/api/v1/tasks/${created.body.id}/status`)
      .send({ status: 'done' });
    expect(done.status).toBe(200);
    expect(done.body.completedAt).not.toBeNull();
    await new Promise((resolve) => setImmediate(resolve));
    expect(completed).toHaveLength(1);

    const list = await http().get(
      `/api/v1/tasks?projectId=${projectId}&status=done`,
    );
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it('pages lists when asked and reports the total', async () => {
    const page = await http().get('/api/v1/tasks?page=0&size=2');
    expect(page.status).toBe(200);
    expect(page.body).toHaveLength(2);
    expect(Number(page.headers['x-total-count'])).toBeGreaterThan(2);
    expect(page.headers['x-page-size']).toBe('2');
  });

  it('returns Problem Details with field errors for an invalid request', async () => {
    const response = await http()
      .post('/api/v1/companies')
      .send({ relationship: 'client' });
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain(
      'application/problem+json',
    );
    expect(response.body.errors.name).toBeDefined();
  });

  it('refuses an active project for a closed company (RN-03)', async () => {
    const companyId = await create(app, '/api/v1/companies', {
      name: 'Previous agency',
      relationship: 'client',
      status: 'closed',
      startDate: '2023-02-01',
    });
    const response = await http().post('/api/v1/projects').send({
      name: 'Revival',
      companyId,
      category: 'professional',
      status: 'active',
      startDate: '2026-10-01',
    });
    expect(response.status).toBe(422);
    expect(response.body.rule).toBe('RN-03');
  });

  it('deletes only a company without projects (RN-01)', async () => {
    const busy = await create(app, '/api/v1/companies', {
      name: 'Busy',
      relationship: 'client',
      startDate: '2026-01-01',
    });
    await create(app, '/api/v1/projects', {
      name: 'P',
      companyId: busy,
      category: 'personal',
      startDate: '2026-01-01',
    });
    const empty = await create(app, '/api/v1/companies', {
      name: 'Empty',
      relationship: 'client',
      startDate: '2026-01-01',
    });

    const refused = await http().delete(`/api/v1/companies/${busy}`);
    expect(refused.status).toBe(409);
    expect(refused.body.rule).toBe('RN-01');
    expect((await http().delete(`/api/v1/companies/${empty}`)).status).toBe(
      204,
    );
    expect((await http().get(`/api/v1/companies/${empty}`)).status).toBe(404);
  });

  it('keeps the tasks of a deleted project, without project', async () => {
    const projectId = await create(app, '/api/v1/projects', {
      name: 'Short lived',
      category: 'personal',
      startDate: '2026-01-01',
    });
    const taskId = await create(app, '/api/v1/tasks', {
      title: 'Survivor',
      projectId,
    });

    expect((await http().delete(`/api/v1/projects/${projectId}`)).status).toBe(
      204,
    );
    const task = await http().get(`/api/v1/tasks/${taskId}`);
    expect(task.status).toBe(200);
    expect(task.body.projectId).toBeNull();
  });

  it('filters overdue tasks and counts them on the dashboard', async () => {
    await create(app, '/api/v1/tasks', {
      title: 'Very late',
      status: 'todo',
      dueDate: '2020-01-01',
    });
    await create(app, '/api/v1/tasks', {
      title: 'Late but done',
      status: 'done',
      dueDate: '2020-01-01',
    });

    const overdue = await http().get('/api/v1/tasks?overdue=true');
    const titles = (overdue.body as Array<{ title: string }>).map(
      (task) => task.title,
    );
    expect(titles).toContain('Very late');
    expect(titles).not.toContain('Late but done');

    const summary = await http().get('/api/v1/dashboard/summary');
    expect(summary.status).toBe(200);
    expect(summary.body.overdueTasks).toBeGreaterThan(0);
  });

  it('replaces a task on PUT, checklist items included, and ignores unknown fields', async () => {
    const taskId = await create(app, '/api/v1/tasks', {
      title: 'With checklist',
      checklistItems: [{ title: 'a' }, { title: 'b', done: true }],
    });
    const current = (await http().get(`/api/v1/tasks/${taskId}`))
      .body as Record<string, any>;
    expect(current.checklist).toEqual({ done: 1, total: 2 });

    const updated = await http()
      .put(`/api/v1/tasks/${taskId}`)
      .send({
        ...current,
        title: 'Renamed',
        checklistItems: [current.checklistItems[1]],
        createdAt: 'ignored',
      });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe('Renamed');
    expect(updated.body.checklistItems).toEqual([current.checklistItems[1]]);
  });

  it('refuses completing a blocked task (RN-07)', async () => {
    const taskId = await create(app, '/api/v1/tasks', {
      title: 'Waiting',
      status: 'blocked',
    });
    const response = await http()
      .patch(`/api/v1/tasks/${taskId}/status`)
      .send({ status: 'done' });
    expect(response.status).toBe(422);
    expect(response.body.rule).toBe('RN-07');
  });

  it('answers 404 for an unknown id and 400 for a malformed one', async () => {
    expect(
      (await http().get('/api/v1/tasks/0192f000-0000-7000-8000-00000000ffff'))
        .status,
    ).toBe(404);
    expect((await http().get('/api/v1/tasks/not-a-uuid')).status).toBe(400);
  });
});
