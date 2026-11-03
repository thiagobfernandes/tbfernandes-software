import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { LanguageModel } from '../src/modules/assistant/application/language.model';
import type { Passage, StructuredQuery } from '../src/modules/assistant/domain';
import { StructuredQueries } from '../src/modules/assistant/domain';
import { create, startApp } from './support/test-app';

interface Ref {
  kind: string;
  label: string;
  href: string;
  excerpt: string | null;
}

const short = () => randomUUID().slice(0, 8);

/** Port of AssistantApiIntegrationTests: no model, rules and keyword retrieval. */
describe('Assistant API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());
  const ask = (question: unknown) =>
    http().post('/api/v1/assistant/questions').send({ question });

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  it('answers about a project with links to real records, and draws the graph', async () => {
    const name = `Assistant ${short()}`;
    const companyId = await create(app, '/api/v1/companies', {
      name: `Acme ${name}`,
      relationship: 'client',
      startDate: '2026-01-01',
    });
    const projectId = await create(app, '/api/v1/projects', {
      name,
      companyId,
      category: 'professional',
      status: 'active',
      startDate: '2026-01-01',
    });
    await create(app, '/api/v1/tasks', {
      title: 'Draft the contract',
      projectId,
    });
    const noteId = await create(app, '/api/v1/notes', {
      title: `Scope of ${name}`,
      body: 'Only phase 1',
      projectIds: [projectId],
    });

    const answer = await ask(`What about ${name.toLowerCase()}?`);
    expect(answer.status).toBe(200);
    expect(answer.body.source).toBe('rules');
    expect(answer.body.text).toContain('0 de 1 tarefas concluídas');
    expect(answer.body.query).toBeNull();
    const hrefs = (answer.body.references as Ref[]).map((r) => r.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        `/projects/view?id=${projectId}`,
        `/knowledge?note=${noteId}`,
      ]),
    );

    const graph = await http().get('/api/v1/graph');
    expect(graph.status).toBe(200);
    const edges = graph.body.edges as Array<{ source: string; target: string }>;
    expect(
      edges.filter((e) => e.source === `note:${noteId}`).map((e) => e.target),
    ).toEqual([`project:${projectId}`]);
    const nodes = graph.body.nodes as Array<{ id: string; kind: string }>;
    expect(
      nodes.filter((n) => n.id === `company:${companyId}`).map((n) => n.kind),
    ).toEqual(['company']);
  });

  it('measures goal progress by milestones', async () => {
    const name = `Goal ${short()}`;
    const goalId = await create(app, '/api/v1/goals', {
      name,
      area: 'career',
      status: 'active',
      desiredResult: 'Done',
    });
    await create(app, '/api/v1/milestones', {
      goalId,
      title: 'First',
      done: true,
    });
    await create(app, '/api/v1/milestones', { goalId, title: 'Second' });

    const answer = await ask('How are my goals?');
    expect(answer.body.text).toContain(`- **${name}**: 50% (1/2 marcos)`);
  });

  it('without a model, shows the passages of the notes for an open question', async () => {
    const word = `zq${short()}`;
    const noteId = await create(app, '/api/v1/notes', {
      title: `Servidor ${word}`,
      body: 'O nginx encaminha /api para o backend.',
    });

    const answer = await ask(`Explique o servidor ${word}`);
    expect(answer.status).toBe(200);
    expect(answer.body.source).toBe('search');
    const refs = answer.body.references as Ref[];
    expect(refs[0].excerpt).toContain('O nginx encaminha /api');
    expect(refs.map((r) => r.href)).toEqual([`/knowledge?note=${noteId}`]);
  });

  it('needs a question', async () => {
    expect((await ask('  ')).status).toBe(400);
    expect((await ask('x'.repeat(501))).status).toBe(400);
  });
});

class FakeModel extends LanguageModel {
  query: StructuredQuery | null = null;
  rewrite: string | null = null;
  fromPassages: string | null = null;
  passages: Passage[] = [];
  failing = false;

  private check() {
    if (this.failing) throw new Error('Provider down');
  }

  toQuery(): Promise<StructuredQuery | null> {
    this.check();
    return Promise.resolve(this.query);
  }

  answer(): Promise<string | null> {
    this.check();
    return Promise.resolve(this.rewrite);
  }

  answerFromPassages(_q: string, found: Passage[]): Promise<string | null> {
    this.check();
    this.passages = found;
    return Promise.resolve(this.fromPassages);
  }
}

/** Port of AssistantModelApiIntegrationTests: a fake model over real data (AST-03, AST-04). */
describe('Assistant API with a language model', () => {
  let app: INestApplication<App>;
  const fake = new FakeModel();
  const ask = (question: string) =>
    request(app.getHttpServer())
      .post('/api/v1/assistant/questions')
      .send({ question });

  beforeAll(async () => {
    app = await startApp({}, (builder) =>
      builder.overrideProvider(LanguageModel).useValue(fake),
    );
  });

  afterAll(() => app.close());

  beforeEach(() => {
    Object.assign(fake, {
      query: null,
      rewrite: null,
      fromPassages: null,
      passages: [],
      failing: false,
    });
  });

  it('answers an open question from the notes and cites them', async () => {
    const word = `zq${short()}`;
    const noteId = await create(app, '/api/v1/notes', {
      title: `Deploy ${word}`,
      body: `Rode o script deploy-${word}.sh depois do build.`,
    });
    fake.fromPassages = 'Rode o script depois do build [1].';

    const answer = await ask(`Explique o deploy ${word}`);
    expect(answer.status).toBe(200);
    expect(answer.body.source).toBe('rag');
    expect(answer.body.text).toBe('Rode o script depois do build [1].');
    const refs = answer.body.references as Ref[];
    expect(refs.map((r) => r.href)).toEqual([`/knowledge?note=${noteId}`]);
    expect(refs[0].excerpt).toContain(`deploy-${word}.sh`);
    expect(fake.passages.map((p) => p.title)).toEqual([`Deploy ${word}`]);
  });

  it('answers with the passages when the model fails', async () => {
    const word = `zq${short()}`;
    await create(app, '/api/v1/notes', {
      title: `Backup ${word}`,
      body: 'Copie a pasta pg.',
    });
    fake.failing = true;

    const answer = await ask(`Explique o backup ${word}`);
    expect(answer.status).toBe(200);
    expect(answer.body.source).toBe('search');
    expect(answer.body.references[0].excerpt).toBe('Copie a pasta pg.');
  });

  it("runs the model's query and links only to real records", async () => {
    const title = `Query ${randomUUID()}`;
    await create(app, '/api/v1/tasks', { title });
    fake.query = StructuredQueries.of({
      subject: 'TASKS',
      text: title,
      openOnly: true,
    });

    const answer = await ask('Quais tarefas?');
    expect(answer.status).toBe(200);
    expect(answer.body.source).toBe('query');
    expect(answer.body.query.subject).toBe('tasks');
    expect(answer.body.query.sort).toBe('due_date');
    expect(answer.body.text).toContain(title);
    expect((answer.body.references as Ref[]).map((r) => r.label)).toEqual([
      title,
    ]);
  });

  it('keeps the references of the query in the rewritten text', async () => {
    const title = `Rewrite ${randomUUID()}`;
    await create(app, '/api/v1/tasks', { title });
    fake.query = StructuredQueries.of({ subject: 'TASKS', text: title });
    fake.rewrite = 'Texto do modelo';

    const answer = await ask('Quais tarefas?');
    expect(answer.body.source).toBe('model');
    expect(answer.body.text).toBe('Texto do modelo');
    expect((answer.body.references as Ref[]).map((r) => r.label)).toEqual([
      title,
    ]);
  });

  it('still answers with rules when the model fails', async () => {
    fake.failing = true;
    const answer = await ask('Como estão as metas?');
    expect(answer.status).toBe(200);
    expect(answer.body.source).toBe('rules');
  });
});
