import { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import type { App } from 'supertest/types';
import { create, eventually, startApp } from './support/test-app';

const KEY = 'test-ingest-key-with-at-least-32-chars';

interface Item {
  id: string;
  kind: string;
  title: string;
  href: string | null;
  readAt: string | null;
}

describe('Notifications API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());
  const worker = (method: 'put' | 'post', path: string) =>
    http()
      [method](`/api/v1/webhooks/prospecting${path}`)
      .set('x-ingest-key', KEY);
  const list = async () =>
    (await http().get('/api/v1/notifications')).body as Item[];

  beforeAll(async () => {
    app = await startApp({ PROSPECTING_INGEST_KEY: KEY });
    await app.listen(0);
  });

  afterAll(() => app.close());

  it('turns prospecting events into notifications, pushed over SSE', async () => {
    const server = app.getHttpServer() as unknown as { address(): AddressInfo };
    const controller = new AbortController();
    const stream = await fetch(
      `http://127.0.0.1:${server.address().port}/api/v1/notifications/events`,
      { signal: controller.signal },
    );

    const lead = await worker('put', '/leads/ntf--clinica').send({
      name: 'Clínica Aviso',
      status: 'new',
    });
    await worker('post', '/leads/ntf--clinica/send-requests').send({
      stage: 'first',
      body: 'Oi!',
    });

    const reader = stream.body!.getReader();
    let text = '';
    while (!text.includes('event: notification')) {
      const chunk = await reader.read();
      text += new TextDecoder().decode(chunk.value);
    }
    controller.abort();
    expect(text).toContain('prospecting_approval');

    await worker('post', '/leads/ntf--clinica/messages').send({
      direction: 'outbound',
      stage: 'first',
      body: 'Oi!',
      sentAt: '2026-11-16T12:00:00Z',
    });
    await worker('post', '/leads/ntf--clinica/messages').send({
      direction: 'inbound',
      stage: 'auto_reply',
      body: 'Seja bem-vindo!',
      sentAt: '2026-11-16T12:00:02Z',
    });
    await worker('post', '/leads/ntf--clinica/messages').send({
      direction: 'inbound',
      stage: 'reply',
      body: 'Pode mandar a ideia',
      sentAt: '2026-11-16T13:00:00Z',
    });
    await worker('post', '/leads/ntf--clinica/messages').send({
      direction: 'inbound',
      stage: 'opt_out',
      body: 'sair',
      sentAt: '2026-11-16T14:00:00Z',
    });

    await eventually(async () => {
      const kinds = (await list())
        .filter((item) => item.href === `/prospecting?lead=${lead.body.id}`)
        .map((item) => item.kind);
      return (
        kinds.includes('prospecting_approval') &&
        kinds.includes('prospecting_reply') &&
        kinds.includes('prospecting_opt_out')
      );
    });
    const replies = (await list()).filter(
      (item) => item.kind === 'prospecting_reply',
    );
    expect(replies).toHaveLength(1);
  });

  it('reminds of tasks due today and contacts due, once', async () => {
    const today = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'America/Sao_Paulo',
    });
    await create(app, '/api/v1/tasks', {
      title: 'Entregar o relatório',
      status: 'todo',
      priority: 'normal',
      dueDate: today,
    });
    await create(app, '/api/v1/contacts', {
      name: 'Rafael Aviso',
      nextContact: today,
    });

    const first = await list();
    expect(first.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        'Vence hoje: Entregar o relatório',
        'Hora de falar com Rafael Aviso',
      ]),
    );
    const again = await list();
    expect(again).toHaveLength(first.length);
  });

  it('marks one or all as read', async () => {
    const [one] = await list();
    const read = await http().put(`/api/v1/notifications/${one.id}/read`);
    expect(read.body.readAt).not.toBeNull();
    const before = (await http().get('/api/v1/notifications/summary')).body;
    expect((await http().post('/api/v1/notifications/read-all')).status).toBe(
      204,
    );
    const after = (await http().get('/api/v1/notifications/summary')).body;
    expect(after.unread).toBe(0);
    expect(before.unread).toBeGreaterThan(0);
    expect(
      (await http().get('/api/v1/notifications?unread=true')).body,
    ).toHaveLength(0);
  });
});
