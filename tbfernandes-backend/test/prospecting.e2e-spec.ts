import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { startApp } from './support/test-app';

const KEY = 'test-ingest-key-with-at-least-32-chars';
const LEAD = {
  name: 'Clínica Sorriso',
  city: 'Maringá',
  whatsapp: '5544999990000',
  classification: 'hot',
  status: 'new',
};

describe('Prospecting API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());
  const ingest = (method: 'put' | 'post' | 'get', path: string, key = KEY) =>
    http()
      [method](`/api/v1/webhooks/prospecting${path}`)
      .set('x-ingest-key', key);

  beforeAll(async () => {
    app = await startApp({ PROSPECTING_INGEST_KEY: KEY });
  });

  afterAll(() => app.close());

  it('refuses the worker without the right key', async () => {
    expect((await ingest('put', '/leads/x', 'wrong').send(LEAD)).status).toBe(
      401,
    );
    expect(
      (await http().put('/api/v1/webhooks/prospecting/leads/x').send(LEAD))
        .status,
    ).toBe(401);
  });

  it('upserts leads, records messages once and summarizes the funnel', async () => {
    const created = await ingest('put', '/leads/maringa--sorriso').send(LEAD);
    expect(created.status).toBe(200);
    const again = await ingest('put', '/leads/maringa--sorriso').send({
      ...LEAD,
      city: 'Sarandi',
    });
    expect(again.body.id).toBe(created.body.id);
    expect(again.body.city).toBe('Sarandi');

    const first = {
      direction: 'outbound',
      stage: 'first',
      body: 'Oi! Tudo bem?',
      sentAt: '2026-11-16T12:00:00Z',
    };
    const sent = await ingest('post', '/leads/maringa--sorriso/messages').send(
      first,
    );
    expect(sent.status).toBe(201);
    const repeated = await ingest(
      'post',
      '/leads/maringa--sorriso/messages',
    ).send(first);
    expect(repeated.status).toBe(200);
    expect(repeated.body.id).toBe(sent.body.id);

    const reply = await ingest('post', '/leads/maringa--sorriso/messages').send(
      {
        direction: 'inbound',
        stage: 'opt_out',
        body: 'sair',
        sentAt: '2026-11-16T13:00:00Z',
      },
    );
    expect(reply.status).toBe(201);
    const blocked = await ingest(
      'post',
      '/leads/maringa--sorriso/messages',
    ).send({
      ...first,
      stage: 'follow_up_1',
      sentAt: '2026-11-20T12:00:00Z',
    });
    expect(blocked.status).toBe(422);
    expect(blocked.body.rule).toBe('RN-35');

    const unknown = await ingest('post', '/leads/nobody/messages').send(first);
    expect(unknown.status).toBe(404);

    const lead = await http().get(
      `/api/v1/prospecting/leads/${created.body.id}`,
    );
    expect(lead.body).toMatchObject({
      status: 'opted_out',
      firstContactAt: '2026-11-16T12:00:00Z',
      lastReplyAt: '2026-11-16T13:00:00Z',
    });
    const messages = await http().get(
      `/api/v1/prospecting/messages?leadId=${created.body.id}`,
    );
    const stages = (messages.body as { stage: string }[]).map(
      (item) => item.stage,
    );
    expect(stages).toEqual(['opt_out', 'first']);

    const summary = await http().get('/api/v1/prospecting/summary');
    expect(summary.body).toMatchObject({
      leads: 1,
      contacted: 1,
      replied: 1,
      optedOut: 1,
      replyRate: 1,
    });
    const viaKey = await ingest('get', '/summary');
    expect(viaKey.body.leads).toBe(1);
  });

  it('lets the user review the outcome, which the worker keeps', async () => {
    const lead = await ingest('put', '/leads/sarandi--dente').send(LEAD);
    const reviewed = await http()
      .put(`/api/v1/prospecting/leads/${lead.body.id}`)
      .send({ status: 'converted', notes: 'Fechou' });
    expect(reviewed.body).toMatchObject({
      status: 'converted',
      notes: 'Fechou',
    });

    await ingest('put', '/leads/sarandi--dente').send({
      ...LEAD,
      status: 'active',
    });
    const after = await http().get(`/api/v1/prospecting/leads/${lead.body.id}`);
    expect(after.body.status).toBe('converted');

    const converted = await http().get(
      '/api/v1/prospecting/leads?status=converted',
    );
    expect(converted.body).toHaveLength(1);

    expect(
      (await http().delete(`/api/v1/prospecting/leads/${lead.body.id}`)).status,
    ).toBe(204);
  });
});
