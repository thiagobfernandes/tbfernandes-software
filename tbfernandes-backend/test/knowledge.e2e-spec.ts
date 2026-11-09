import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { create, eventually, startApp } from './support/test-app';

interface Item {
  id: string;
  projectIds: string[];
}

describe('Knowledge API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  it('finds a note by text and tag and drops the link when the project is deleted', async () => {
    const projectId = await create(app, '/api/v1/projects', {
      name: 'Knowledge base',
      category: 'study',
      startDate: '2026-10-01',
    });
    const noteId = await create(app, '/api/v1/notes', {
      title: 'Flyway naming',
      body: 'Versioned migrations never change after release.',
      tags: ['Database', ' flyway '],
      projectIds: [projectId],
    });

    const note = await http().get(`/api/v1/notes/${noteId}`);
    expect(note.body).toMatchObject({
      tags: ['database', 'flyway'],
      projectIds: [projectId],
      taskIds: [],
    });
    expect(note.body.createdAt).toMatch(/Z$/);

    const byText = await http().get('/api/v1/notes?q=migrations');
    const byTitle = await http().get('/api/v1/notes?q=flyw');
    const byTag = await http().get('/api/v1/notes?tag=flyway');
    for (const found of [byText, byTitle, byTag]) {
      expect((found.body as Item[]).map((item) => item.id)).toContain(noteId);
    }

    expect((await http().delete(`/api/v1/projects/${projectId}`)).status).toBe(
      204,
    );
    await eventually(async () => {
      const after = await http().get(`/api/v1/notes/${noteId}`);
      return (after.body as Item).projectIds.length === 0;
    });
  });

  it('rejects a link to an unknown task', async () => {
    const response = await http()
      .post('/api/v1/notes')
      .send({
        title: 'Orphan',
        taskIds: ['0192f000-0000-7000-8000-00000000dead'],
      });
    expect(response.status).toBe(404);
  });

  it('stores snippet code verbatim and filters by language', async () => {
    const code = '  if (x) {\n\treturn y;\n  }\n';
    const id = await create(app, '/api/v1/snippets', {
      title: 'Guard',
      language: 'Java',
      code,
    });

    const snippet = await http().get(`/api/v1/snippets/${id}`);
    expect(snippet.body).toMatchObject({ code, language: 'java' });
    const found = await http().get('/api/v1/snippets?language=Java&q=guard');
    expect((found.body as Item[]).map((item) => item.id)).toContain(id);
  });

  it('keeps the method step order and needs at least one step', async () => {
    const id = await create(app, '/api/v1/methods', {
      title: 'Code review',
      summary: 'How I review',
      category: 'quality',
      steps: [
        { title: 'Read the ticket' },
        { title: 'Run it' },
        { title: 'Comment', detail: 'kindly' },
      ],
      examples: [{ title: 'Comment', content: 'nit: rename' }],
      lastReviewed: '2026-10-20',
    });

    const method = await http().get(`/api/v1/methods/${id}`);
    expect(method.body).toMatchObject({
      category: 'quality',
      steps: [
        { title: 'Read the ticket', detail: null },
        { title: 'Run it', detail: null },
        { title: 'Comment', detail: 'kindly' },
      ],
      examples: [{ title: 'Comment', content: 'nit: rename' }],
    });

    const updated = await http()
      .put(`/api/v1/methods/${id}`)
      .send({ ...method.body, steps: [{ title: 'Only one' }] });
    expect(updated.status).toBe(200);
    expect(updated.body.steps).toEqual([{ title: 'Only one', detail: null }]);

    const empty = await http().post('/api/v1/methods').send({
      title: 'Empty',
      summary: 'x',
      category: 'quality',
      steps: [],
      lastReviewed: '2026-10-20',
    });
    expect(empty.status).toBe(400);
  });
});
