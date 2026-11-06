import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { create, eventually, startApp } from './support/test-app';

describe('Goals API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  const goal = (
    name: string,
    parentId: string | null,
    indicator: object | null,
  ) =>
    create(app, '/api/v1/goals', {
      name,
      area: 'career',
      desiredResult: 'Done',
      parentId,
      indicator,
    });

  it('answers with the frontend shape and records indicator progress', async () => {
    const id = await goal('Ship MVP', null, {
      label: 'Features',
      current: 3,
      target: 8,
      unit: 'features',
    });

    expect((await http().get(`/api/v1/goals/${id}`)).body).toEqual({
      id,
      name: 'Ship MVP',
      description: null,
      area: 'career',
      status: 'planned',
      priority: 'normal',
      currentState: null,
      desiredResult: 'Done',
      doneCriteria: null,
      dueDate: null,
      indicator: { label: 'Features', current: 3, target: 8, unit: 'features' },
      parentId: null,
    });

    const progress = await http()
      .patch(`/api/v1/goals/${id}/indicator`)
      .send({ current: 5 });
    expect(progress.status).toBe(200);
    expect(progress.body.indicator.current).toBe(5);

    const noIndicator = await goal('Plain', null, null);
    const refused = await http()
      .patch(`/api/v1/goals/${noIndicator}/indicator`)
      .send({ current: 1 });
    expect(refused.status).toBe(422);
    expect(refused.body.rule).toBe('RN-21');
  });

  it('does not let a sub-goal become the parent of its parent (RN-19)', async () => {
    const parent = await goal('Parent', null, null);
    const child = await goal('Child', parent, null);

    const cycle = await http().put(`/api/v1/goals/${parent}`).send({
      name: 'Parent',
      area: 'career',
      desiredResult: 'Done',
      parentId: child,
    });
    expect(cycle.status).toBe(422);
    expect(cycle.body.rule).toBe('RN-19');

    const unknown = await http().post('/api/v1/goals').send({
      name: 'Orphan',
      area: 'career',
      desiredResult: 'Done',
      parentId: '0192f000-0000-7000-8000-00000000dead',
    });
    expect(unknown.status).toBe(404);
  });

  it('deletes sub-goals and milestones with the goal (RN-09)', async () => {
    const parent = await goal('To delete', null, null);
    const child = await goal('Child of deleted', parent, null);
    const milestone = await create(app, '/api/v1/milestones', {
      goalId: parent,
      title: 'First step',
    });
    expect(
      (await http().get(`/api/v1/milestones?goalId=${parent}`)).body,
    ).toEqual([
      {
        id: milestone,
        goalId: parent,
        title: 'First step',
        dueDate: null,
        done: false,
      },
    ]);

    expect((await http().delete(`/api/v1/goals/${parent}`)).status).toBe(204);

    expect((await http().get(`/api/v1/goals/${child}`)).status).toBe(404);
    const remaining = (await http().get('/api/v1/milestones')).body as {
      id: string;
    }[];
    expect(
      remaining.map((remainingMilestone) => remainingMilestone.id),
    ).not.toContain(milestone);
  });

  it('activates the goal and counts a completed linked task (GOL-05)', async () => {
    const goalId = await goal('Close tasks', null, {
      label: 'Tasks closed',
      current: 0,
      target: 10,
      unit: 'tasks',
    });
    const taskId = await create(app, '/api/v1/tasks', {
      title: 'Linked',
      status: 'todo',
      goalId,
    });

    const done = await http()
      .patch(`/api/v1/tasks/${taskId}/status`)
      .send({ status: 'done' });
    expect(done.status).toBe(200);

    await eventually(
      async () =>
        (await http().get(`/api/v1/goals/${goalId}`)).body.status === 'active',
    );
    expect(
      (await http().get(`/api/v1/goals/${goalId}`)).body.indicator.current,
    ).toBe(1);
    const links = await http().get(`/api/v1/goals/${goalId}/links`);
    expect(
      (links.body.tasks as { id: string }[]).map((task) => task.id),
    ).toEqual([taskId]);
  });

  it('lists the purchases linked to a goal', async () => {
    const goalId = await create(app, '/api/v1/goals', {
      name: 'Home office',
      area: 'finance',
      desiredResult: 'Desk bought',
    });
    const id = await create(app, '/api/v1/finance/purchases', {
      name: 'Desk',
      estimated: 3000,
      reserved: 1000,
      monthlySaving: 600,
      goalId,
    });

    const links = await http().get(`/api/v1/goals/${goalId}/links`);

    expect(links.body).toEqual({
      projects: [],
      tasks: [],
      studies: [],
      purchases: [
        {
          id,
          name: 'Desk',
          status: 'planned',
          goalId,
          estimated: 3000,
          reserved: 1000,
          missing: 2000,
          ready: false,
          months: 4,
          onTime: null,
        },
      ],
    });
  });
});
