import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { create, startApp } from './support/test-app';

const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

describe('Learning API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());
  const ids = (body: unknown) =>
    (body as { id: string }[]).map((item) => item.id);

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  it('links skills to a study and lists the materials of the study', async () => {
    const skill = await create(app, '/api/v1/skills', {
      name: 'Spring Modulith',
      level: 2,
    });
    const study = await create(app, '/api/v1/studies', {
      name: 'Modulith deep dive',
      status: 'in_progress',
      skillIds: [skill],
    });
    const material = await create(app, '/api/v1/materials', {
      studyId: study,
      title: 'Reference docs',
      type: 'docs',
    });

    expect((await http().get(`/api/v1/studies/${study}`)).body).toEqual({
      id: study,
      name: 'Modulith deep dive',
      description: null,
      status: 'in_progress',
      goalId: null,
      skillIds: [skill],
      startDate: null,
      dueDate: null,
      nextActivity: null,
    });
    const materials = await http().get(`/api/v1/materials?studyId=${study}`);
    expect(ids(materials.body)).toEqual([material]);
    expect(
      (await http().get(`/api/v1/materials/${material}`)).body,
    ).toMatchObject({ status: 'to_consume', type: 'docs' });

    expect((await http().delete(`/api/v1/studies/${study}`)).status).toBe(204);
    expect(
      (await http().get(`/api/v1/materials/${material}`)).body,
    ).toMatchObject({ studyId: null });
  });

  it('checks references and rules', async () => {
    expect(
      (await http().post('/api/v1/skills').send({ name: 'Too good', level: 6 }))
        .status,
    ).toBe(422);
    expect(
      (
        await http()
          .post('/api/v1/studies')
          .send({
            name: 'Ghost',
            skillIds: ['0192f000-0000-7000-8000-00000000dead'],
          })
      ).status,
    ).toBe(404);
    const obtained = await http()
      .post('/api/v1/certifications')
      .send({ name: 'OCP', issuer: 'Oracle', status: 'obtained' });
    expect(obtained.status).toBe(422);
    expect(obtained.body.rule).toBe('RN-14');

    await create(app, '/api/v1/skills', { name: 'Unique', level: 3 });
    const repeated = await http()
      .post('/api/v1/skills')
      .send({ name: 'Unique', level: 4 });
    expect(repeated.status).toBe(409);
  });

  it('lists obtained certifications expiring within a window', async () => {
    const soon = await create(app, '/api/v1/certifications', {
      name: 'Soon',
      issuer: 'X',
      status: 'obtained',
      obtainedAt: inDays(-730),
      expiresAt: inDays(30),
    });
    const later = await create(app, '/api/v1/certifications', {
      name: 'Later',
      issuer: 'X',
      status: 'obtained',
      obtainedAt: inDays(-365),
      expiresAt: inDays(300),
    });

    const expiring = ids(
      (await http().get('/api/v1/certifications?expiringWithinDays=60')).body,
    );
    expect(expiring).toContain(soon);
    expect(expiring).not.toContain(later);
  });

  it('keeps educations newest first', async () => {
    await create(app, '/api/v1/educations', {
      institution: 'USP',
      course: 'Computer Science',
      degree: 'BSc',
      status: 'completed',
      startDate: '2015-02-01',
      endDate: '2019-12-01',
    });
    const recent = await create(app, '/api/v1/educations', {
      institution: 'FIAP',
      course: 'Software Architecture',
      degree: 'MBA',
      status: 'in_progress',
      startDate: '2025-03-01',
    });
    const list = await http().get('/api/v1/educations');
    expect(ids(list.body)[0]).toBe(recent);
  });
});
