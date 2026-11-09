import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { create, eventually, startApp } from './support/test-app';

interface Interaction {
  id: string;
  followUpTaskId: string | null;
}

const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

describe('Contacts API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  it('checks the company reference and unlinks it when the company is deleted', async () => {
    const unknown = await http()
      .post('/api/v1/contacts')
      .send({ name: 'Ana', companyId: '0192f000-0000-7000-8000-00000000dead' });
    expect(unknown.status).toBe(404);

    const companyId = await create(app, '/api/v1/companies', {
      name: 'Acme',
      relationship: 'client',
      startDate: '2026-01-01',
    });
    const both = await http()
      .post('/api/v1/contacts')
      .send({ name: 'Ana', companyId, companyName: 'Acme Inc' });
    expect(both.status).toBe(422);
    expect(both.body.rule).toBe('RN-23');

    const contactId = await create(app, '/api/v1/contacts', {
      name: 'Ana',
      companyId,
      email: 'Ana@Acme.com',
      specialties: ['Java', ' Java', 'SQL'],
    });
    const contact = await http().get(`/api/v1/contacts/${contactId}`);
    expect(contact.body).toEqual({
      id: contactId,
      name: 'Ana',
      companyId,
      companyName: null,
      role: null,
      email: 'ana@acme.com',
      phone: null,
      profileUrl: null,
      specialties: ['Java', 'SQL'],
      context: null,
      nextContact: null,
      notes: null,
    });

    expect((await http().delete(`/api/v1/companies/${companyId}`)).status).toBe(
      204,
    );
    await eventually(async () => {
      const after = await http().get(`/api/v1/contacts/${contactId}`);
      return (after.body as { companyId: string | null }).companyId === null;
    });
  });

  it('creates a follow-up task once and clears it when the task is deleted', async () => {
    const contactId = await create(app, '/api/v1/contacts', {
      name: 'Bruno',
      nextContact: inDays(3),
    });
    const interactionId = await create(app, '/api/v1/interactions', {
      contactId,
      date: '2026-10-20',
      kind: 'meeting',
      summary: 'Talked about the API',
    });

    const followed = await http()
      .post(`/api/v1/interactions/${interactionId}/follow-up`)
      .send({ dueDate: '2026-11-01' });
    expect(followed.status).toBe(200);
    expect(followed.body.kind).toBe('meeting');
    const taskId = (followed.body as Interaction).followUpTaskId!;
    const task = await http().get(`/api/v1/tasks/${taskId}`);
    expect(task.body).toMatchObject({
      title: 'Follow-up com Bruno',
      status: 'todo',
      dueDate: '2026-11-01',
    });

    const tasksBefore = (await http().get('/api/v1/tasks')).body as unknown[];
    const again = await http()
      .post(`/api/v1/interactions/${interactionId}/follow-up`)
      .send({});
    expect(again.status).toBe(422);
    const tasksAfter = (await http().get('/api/v1/tasks')).body as unknown[];
    expect(tasksAfter).toHaveLength(tasksBefore.length);

    const due = await http().get('/api/v1/contacts?dueWithinDays=7');
    expect(
      (due.body as { id: string }[]).map((contact) => contact.id),
    ).toContain(contactId);
    const notDue = await http().get('/api/v1/contacts?dueWithinDays=1');
    expect(
      (notDue.body as { id: string }[]).map((contact) => contact.id),
    ).not.toContain(contactId);

    expect((await http().delete(`/api/v1/tasks/${taskId}`)).status).toBe(204);
    await eventually(async () => {
      const list = await http().get(
        `/api/v1/interactions?contactId=${contactId}`,
      );
      return (list.body as Interaction[])[0].followUpTaskId === null;
    });
  });

  it('deletes the interactions with the contact', async () => {
    const contactId = await create(app, '/api/v1/contacts', { name: 'Carla' });
    await create(app, '/api/v1/interactions', {
      contactId,
      date: '2026-10-20',
      kind: 'call',
      summary: 'Intro',
    });

    expect((await http().delete(`/api/v1/contacts/${contactId}`)).status).toBe(
      204,
    );
    const left = await http().get(
      `/api/v1/interactions?contactId=${contactId}`,
    );
    expect(left.body).toEqual([]);
  });
});
