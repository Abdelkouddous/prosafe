import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { auth, createApp, resetDb, seedUsers, Users } from './helpers';

describe('Audits (e2e)', () => {
  let app: INestApplication;
  let u: Users;
  const http = () => request(app.getHttpServer());
  let template: any;
  let auditId: number;

  beforeAll(async () => {
    app = await createApp();
    await resetDb(app);
    u = await seedUsers(app, 'aud');
  });
  afterAll(async () => {
    await app.close();
  });

  it('employee cannot access audits (403); no token -> 401', async () => {
    await http().get('/api/audits').expect(401);
    await http().get('/api/audits').set(auth(u.empA)).expect(403);
    await http().post('/api/audits').set(auth(u.empA)).send({}).expect(403);
  });

  it('the seeded ISO 45001 template is available', async () => {
    const res = await http().get('/api/audits/templates').set(auth(u.manager)).expect(200);
    template = res.body.find((t: any) => /ISO 45001/i.test(t.standard) || /ISO 45001/i.test(t.name));
    expect(template).toBeDefined();
    expect(template.items.length).toBeGreaterThanOrEqual(2);
  });

  it('manager creates an audit from the template', async () => {
    const res = await http()
      .post('/api/audits')
      .set(auth(u.manager))
      .send({ title: 'Audit interne T1', scheduledAt: new Date(Date.now() + 14 * 86_400_000).toISOString(), templateId: template.id, zone: 'Usine' })
      .expect(201);
    expect(res.body).toMatchObject({ title: 'Audit interne T1', status: 'planned', templateId: template.id });
    auditId = res.body.id;
  });

  it('invalid audit DTO (no templateId / bad date) -> 400; unknown template -> 404', async () => {
    await http().post('/api/audits').set(auth(u.manager)).send({ title: 't', scheduledAt: new Date().toISOString() }).expect(400);
    await http().post('/api/audits').set(auth(u.manager)).send({ title: 't', scheduledAt: 'garbage', templateId: template.id }).expect(400);
    await http().post('/api/audits').set(auth(u.manager)).send({ title: 't', scheduledAt: new Date().toISOString(), templateId: 999999 }).expect(404);
  });

  it('PUT responses (1 conform, 1 non_conform) with createActions -> corrective action + score 50', async () => {
    const [i1, i2] = template.items;
    const res = await http()
      .put(`/api/audits/${auditId}/responses`)
      .set(auth(u.manager))
      .send({
        createActions: true,
        responses: [
          { itemId: i1.id, result: 'conform' },
          { itemId: i2.id, result: 'non_conform', comment: 'Extincteur absent' },
        ],
      })
      .expect(200);
    expect(res.body.status).toBe('in_progress');
    expect(res.body.score).toBe(50);
    expect(res.body.summary).toMatchObject({ conform: 1, nonConform: 1 });
    expect(res.body.correctiveActions).toHaveLength(1);

    const actions = await http().get(`/api/corrective-actions?sourceType=audit&sourceId=${auditId}`).set(auth(u.manager)).expect(200);
    expect(actions.body).toMatchObject({ total: 1, page: 1 });
    expect(actions.body.data[0]).toMatchObject({ sourceType: 'audit', sourceId: auditId });
    expect(actions.body.data[0].title).toContain(i2.question.slice(0, 20));
  });

  it('re-submitting does not duplicate the corrective action; changing result recomputes score', async () => {
    const [i1, i2] = template.items;
    const res = await http()
      .put(`/api/audits/${auditId}/responses`)
      .set(auth(u.manager))
      .send({ createActions: true, responses: [{ itemId: i1.id, result: 'conform' }, { itemId: i2.id, result: 'non_conform' }] })
      .expect(200);
    expect(res.body.correctiveActions).toHaveLength(1);
    const res2 = await http()
      .put(`/api/audits/${auditId}/responses`)
      .set(auth(u.manager))
      .send({ responses: [{ itemId: i2.id, result: 'conform' }] })
      .expect(200);
    expect(res2.body.score).toBe(100);
  });

  it('unknown item / invalid result / empty responses -> 400', async () => {
    await http().put(`/api/audits/${auditId}/responses`).set(auth(u.manager)).send({ responses: [{ itemId: 99999, result: 'conform' }] }).expect(400);
    await http().put(`/api/audits/${auditId}/responses`).set(auth(u.manager)).send({ responses: [{ itemId: 1, result: 'maybe' }] }).expect(400);
    await http().put(`/api/audits/${auditId}/responses`).set(auth(u.manager)).send({ responses: [] }).expect(400);
  });

  it('audit calendar list has the paginated shape', async () => {
    const res = await http().get('/api/audits').set(auth(u.manager)).expect(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, limit: 20 });
    const none = await http().get('/api/audits?status=completed').set(auth(u.manager)).expect(200);
    expect(none.body.total).toBe(0);
  });
});
