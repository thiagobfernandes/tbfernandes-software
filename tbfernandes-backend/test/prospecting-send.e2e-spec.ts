import { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Clock } from '../src/common/application';
import { startApp } from './support/test-app';

const KEY = 'test-ingest-key-with-at-least-32-chars';
const HOUR = 60 * 60 * 1000;

describe('Prospecting send requests', () => {
  let app: INestApplication<App>;
  let now = new Date('2026-11-16T12:00:00Z');
  const http = () => request(app.getHttpServer());
  const worker = (method: 'put' | 'post' | 'get', path: string) =>
    http()
      [method](`/api/v1/webhooks/prospecting${path}`)
      .set('x-ingest-key', KEY);

  beforeAll(async () => {
    app = await startApp({ PROSPECTING_INGEST_KEY: KEY }, (builder) =>
      builder.overrideProvider(Clock).useValue({
        now: () => now,
        today: () => now.toISOString().slice(0, 10),
        startOfWeek: () => now,
        dayOf: (instant: Date) => instant.toISOString().slice(0, 10),
      }),
    );
    await app.listen(0);
    for (const id of ['a', 'b', 'c']) {
      await worker('put', `/leads/${id}`).send({ name: id, status: 'new' });
    }
  });

  afterAll(() => app.close());

  it('waits an hour unless approved, and is claimed only once (RN-37)', async () => {
    const asked = await worker('post', '/leads/a/send-requests').send({
      stage: 'first',
      body: 'Oi!',
    });
    expect(asked.status).toBe(200);
    expect(asked.body).toMatchObject({
      externalId: 'a',
      status: 'pending',
      autoSendAt: '2026-11-16T13:00:00Z',
    });
    const again = await worker('post', '/leads/a/send-requests').send({
      stage: 'first',
      body: 'Outro texto',
    });
    expect(again.body.id).toBe(asked.body.id);

    expect((await worker('get', '/send-requests/ready')).body).toEqual([]);
    const early = await worker('post', `/send-requests/${asked.body.id}/claim`);
    expect(early.status).toBe(422);

    now = new Date(now.getTime() + HOUR);
    const ready = await worker('get', '/send-requests/ready');
    expect((ready.body as { id: string }[]).map((item) => item.id)).toEqual([
      asked.body.id,
    ]);
    const claimed = await worker(
      'post',
      `/send-requests/${asked.body.id}/claim`,
    );
    expect(claimed.body.status).toBe('sending');
    expect(
      (await worker('post', `/send-requests/${asked.body.id}/claim`)).status,
    ).toBe(422);
    const done = await worker(
      'post',
      `/send-requests/${asked.body.id}/result`,
    ).send({ sent: true });
    expect(done.body.status).toBe('sent');
  });

  it('tells the connected worker about an approval at once, over SSE', async () => {
    const asked = await worker('post', '/leads/b/send-requests').send({
      stage: 'first',
      body: 'Oi!',
    });
    const server = app.getHttpServer() as unknown as {
      address(): AddressInfo;
    };
    const { port } = server.address();
    const controller = new AbortController();
    const stream = await fetch(
      `http://127.0.0.1:${port}/api/v1/webhooks/prospecting/events`,
      { headers: { 'x-ingest-key': KEY }, signal: controller.signal },
    );
    expect(stream.headers.get('content-type')).toContain('text/event-stream');
    expect(
      (await http().get('/api/v1/prospecting/worker')).body.connected,
    ).toBe(true);

    const approved = await http()
      .put(`/api/v1/prospecting/send-requests/${asked.body.id}`)
      .send({ status: 'approved' });
    expect(approved.body.status).toBe('approved');

    const reader = stream.body!.getReader();
    let text = '';
    while (!text.includes('event: send')) {
      const chunk = await reader.read();
      text += new TextDecoder().decode(chunk.value);
    }
    controller.abort();
    expect(text).toContain(asked.body.id);
    expect((await worker('get', '/send-requests/ready')).body).toHaveLength(1);
  });

  it('never sends a cancelled request, nor one to a lead that opted out', async () => {
    const asked = await worker('post', '/leads/c/send-requests').send({
      stage: 'first',
      body: 'Oi!',
    });
    await http()
      .put(`/api/v1/prospecting/send-requests/${asked.body.id}`)
      .send({ status: 'cancelled' });
    now = new Date(now.getTime() + 2 * HOUR);
    expect(
      (await worker('post', `/send-requests/${asked.body.id}/claim`)).status,
    ).toBe(422);
    const repeated = await worker('post', '/leads/c/send-requests').send({
      stage: 'first',
      body: 'Oi!',
    });
    expect(repeated.body.status).toBe('cancelled');

    await worker('post', '/leads/c/messages').send({
      direction: 'inbound',
      stage: 'opt_out',
      body: 'sair',
      sentAt: now.toISOString(),
    });
    const followUp = await worker('post', '/leads/c/send-requests').send({
      stage: 'follow_up_1',
      body: 'Oi de novo',
    });
    expect(followUp.status).toBe(422);
    expect(followUp.body.rule).toBe('RN-35');

    expect(
      (await http().get('/api/v1/prospecting/send-requests?status=cancelled'))
        .body,
    ).toHaveLength(1);
  });
});
