import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { auth, createApp, resetDb, seedUsers, Users } from './helpers';

describe('Risks, matrix and LMRA (e2e)', () => {
  let app: INestApplication;
  let u: Users;
  const http = () => request(app.getHttpServer());
  let riskId: number;

  const cell = (matrix: any, gravity: number, probability: number) =>
    matrix.cells.find((c: any) => c.gravity === gravity && c.probability === probability);

  beforeAll(async () => {
    app = await createApp();
    await resetDb(app);
    u = await seedUsers(app, 'risk');
  });
  afterAll(async () => {
    await app.close();
  });

  it('matrix starts with 25 empty cells', async () => {
    const res = await http().get('/api/risks/matrix').set(auth(u.manager)).expect(200);
    expect(res.body.cells).toHaveLength(25);
    expect(res.body.total).toBe(0);
    expect(cell(res.body, 4, 2)).toMatchObject({ count: 0, score: 8 });
  });

  it('employee proposes a risk -> status proposed; managers are notified', async () => {
    const res = await http()
      .post('/api/risks')
      .set(auth(u.empA))
      .send({ title: 'Câble au sol', hazardCategory: 'chute', zone: 'Atelier', gravity: 4, probability: 2 })
      .expect(201);
    expect(res.body).toMatchObject({ status: 'proposed', score: 8, proposedById: u.empA.id });
    riskId = res.body.id;
    const notifs = await http().get('/api/notifications').set(auth(u.manager)).expect(200);
    expect(notifs.body.data.some((n: any) => n.type === 'alert')).toBe(true);
  });

  it('proposed risk is not in the validated matrix yet', async () => {
    const res = await http().get('/api/risks/matrix').set(auth(u.manager)).expect(200);
    expect(res.body.total).toBe(0);
    expect(cell(res.body, 4, 2).count).toBe(0);
  });

  it('proposed risk is visible to its author but not to another employee (404)', async () => {
    await http().get(`/api/risks/${riskId}`).set(auth(u.empA)).expect(200);
    await http().get(`/api/risks/${riskId}`).set(auth(u.empB)).expect(404);
    const listB = await http().get('/api/risks').set(auth(u.empB)).expect(200);
    expect(listB.body.total).toBe(0);
  });

  it('employee cannot validate (403); manager validates -> matrix cell count increments', async () => {
    await http().patch(`/api/risks/${riskId}`).set(auth(u.empA)).send({ status: 'validated' }).expect(403);
    const res = await http().patch(`/api/risks/${riskId}`).set(auth(u.manager)).send({ status: 'validated' }).expect(200);
    expect(res.body.status).toBe('validated');
    expect(res.body.validatedById).toBe(u.manager.id);
    const m = await http().get('/api/risks/matrix').set(auth(u.manager)).expect(200);
    expect(m.body.total).toBe(1);
    expect(cell(m.body, 4, 2)).toMatchObject({ count: 1, riskIds: [riskId] });
    // employees see validated risks in the catalogue
    const listB = await http().get('/api/risks').set(auth(u.empB)).expect(200);
    expect(listB.body).toMatchObject({ total: 1, page: 1, limit: 20 });
  });

  it('manager-created risk is validated directly; evaluate moves the matrix cell', async () => {
    const created = await http()
      .post('/api/risks')
      .set(auth(u.manager))
      .send({ title: 'Produit chimique', hazardCategory: 'chimique', gravity: 2, probability: 2 })
      .expect(201);
    expect(created.body.status).toBe('validated');
    const ev = await http().patch(`/api/risks/${created.body.id}/evaluate`).set(auth(u.manager)).send({ gravity: 5, probability: 5 }).expect(200);
    expect(ev.body).toMatchObject({ score: 25, level: 'critical' });
    const m = await http().get('/api/risks/matrix').set(auth(u.manager)).expect(200);
    expect(cell(m.body, 5, 5).count).toBe(1);
    expect(cell(m.body, 2, 2).count).toBe(0);
    expect(m.body.total).toBe(2);
  });

  it('risk validation: bad gravity / missing title -> 400', async () => {
    await http().post('/api/risks').set(auth(u.empA)).send({ title: 't', hazardCategory: 'c', gravity: 9 }).expect(400);
    await http().post('/api/risks').set(auth(u.empA)).send({ hazardCategory: 'c' }).expect(400);
    await http().patch(`/api/risks/${riskId}/evaluate`).set(auth(u.manager)).send({ gravity: 0, probability: 1 }).expect(400);
  });

  it('LMRA with an uncontrolled hazard creates a proposed risk', async () => {
    const res = await http()
      .post('/api/risks/lmra')
      .set(auth(u.empB))
      .send({
        task: 'Maintenance toiture',
        location: 'Toit',
        decision: 'go',
        hazards: [
          { label: 'Vent fort', present: true, controlled: false },
          { label: 'Harnais', present: true, controlled: true },
          { label: 'Chute objets', present: false, controlled: false },
        ],
      })
      .expect(201);
    expect(res.body.riskIds).toHaveLength(1);
    const risk = await http().get(`/api/risks/${res.body.riskIds[0]}`).set(auth(u.manager)).expect(200);
    expect(risk.body).toMatchObject({ title: 'Vent fort', status: 'proposed', zone: 'Toit', proposedById: u.empB.id });
    const proposed = await http().get('/api/risks?status=proposed').set(auth(u.manager)).expect(200);
    expect(proposed.body.data.map((r: any) => r.title)).toContain('Vent fort');
  });

  it('LMRA history: employee sees own only, manager sees all', async () => {
    const own = await http().get('/api/risks/lmra').set(auth(u.empB)).expect(200);
    expect(own.body).toMatchObject({ total: 1, page: 1, limit: 20 });
    const other = await http().get('/api/risks/lmra').set(auth(u.empA)).expect(200);
    expect(other.body.total).toBe(0);
    const all = await http().get('/api/risks/lmra').set(auth(u.manager)).expect(200);
    expect(all.body.total).toBe(1);
  });

  it('LMRA validation: invalid decision / missing hazards -> 400', async () => {
    await http().post('/api/risks/lmra').set(auth(u.empB)).send({ task: 't', decision: 'maybe', hazards: [] }).expect(400);
    await http().post('/api/risks/lmra').set(auth(u.empB)).send({ task: 't', decision: 'go' }).expect(400);
  });

  it('delete is admin only (manager 403, admin 204)', async () => {
    await http().delete(`/api/risks/${riskId}`).set(auth(u.manager)).expect(403);
    await http().delete(`/api/risks/${riskId}`).set(auth(u.admin)).expect(204);
    await http().get(`/api/risks/${riskId}`).set(auth(u.manager)).expect(404);
  });
});
