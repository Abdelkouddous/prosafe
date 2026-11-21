import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { auth, createApp, resetDb, seedUsers, Users } from './helpers';

describe('Trainings (e2e)', () => {
  let app: INestApplication;
  let u: Users;
  const http = () => request(app.getHttpServer());
  let trainingId: number;
  let sessionId: number;
  let enrollmentA: number;

  beforeAll(async () => {
    app = await createApp();
    await resetDb(app);
    u = await seedUsers(app, 'trn');
  });
  afterAll(async () => {
    await app.close();
  });

  it('manager creates a training (validityMonths 12)', async () => {
    const res = await http()
      .post('/api/trainings')
      .set(auth(u.manager))
      .send({ title: 'Extincteurs', category: 'fire_safety', validityMonths: 12, durationHours: 2 })
      .expect(201);
    expect(res.body).toMatchObject({ title: 'Extincteurs', validityMonths: 12, isActive: true });
    trainingId = res.body.id;
  });

  it('invalid training DTO -> 400 (empty title, unknown field)', async () => {
    await http().post('/api/trainings').set(auth(u.manager)).send({ title: '' }).expect(400);
    await http().post('/api/trainings').set(auth(u.manager)).send({ title: 'x', bogus: 1 }).expect(400);
  });

  it('catalogue list has the paginated shape', async () => {
    const res = await http().get('/api/trainings').set(auth(u.empA)).expect(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(res.body.data[0].id).toBe(trainingId);
  });

  it('manager creates a session with capacity 1', async () => {
    const startAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const res = await http()
      .post('/api/trainings/sessions')
      .set(auth(u.manager))
      .send({ trainingId, startAt, capacity: 1, location: 'Salle A' })
      .expect(201);
    expect(res.body).toMatchObject({ trainingId, capacity: 1, status: 'planned' });
    sessionId = res.body.id;
  });

  it('employee cannot create a session (403)', async () => {
    await http().post('/api/trainings/sessions').set(auth(u.empA)).send({ trainingId, startAt: new Date().toISOString() }).expect(403);
  });

  it('employee A enrolls -> 201', async () => {
    const res = await http().post(`/api/trainings/sessions/${sessionId}/enroll`).set(auth(u.empA)).send({}).expect(201);
    expect(res.body).toMatchObject({ sessionId, userId: u.empA.id, status: 'registered' });
    enrollmentA = res.body.id;
  });

  it('employee A enrolling twice -> 409', async () => {
    await http().post(`/api/trainings/sessions/${sessionId}/enroll`).set(auth(u.empA)).send({}).expect(409);
  });

  it('employee B enrolling in the full session -> 409', async () => {
    const res = await http().post(`/api/trainings/sessions/${sessionId}/enroll`).set(auth(u.empB)).send({}).expect(409);
    expect(JSON.stringify(res.body)).toMatch(/full/i);
  });

  it('employee cannot enroll someone else (403)', async () => {
    await http().post(`/api/trainings/sessions/${sessionId}/enroll`).set(auth(u.empB)).send({ userId: u.manager.id }).expect(403);
  });

  it('session shows enrolledCount 1 and enrolledByMe for A', async () => {
    const res = await http().get('/api/trainings/sessions').set(auth(u.empA)).expect(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(res.body.data[0]).toMatchObject({ enrolledCount: 1, enrolledByMe: true });
  });

  it('employee cannot update an enrollment (403)', async () => {
    await http().patch(`/api/trainings/enrollments/${enrollmentA}`).set(auth(u.empA)).send({ status: 'passed' }).expect(403);
  });

  it('manager marks A passed -> GET /trainings/me has expiresAt ~ +12 months', async () => {
    const upd = await http().patch(`/api/trainings/enrollments/${enrollmentA}`).set(auth(u.manager)).send({ status: 'passed', score: 90 }).expect(200);
    expect(upd.body.status).toBe('passed');
    const me = await http().get('/api/trainings/me').set(auth(u.empA)).expect(200);
    expect(me.body).toMatchObject({ total: 1, page: 1 });
    const e = me.body.data[0];
    expect(e.status).toBe('passed');
    expect(e.score).toBe(90);
    expect(e.expiresAt).toBeTruthy();
    const months = (new Date(e.expiresAt).getTime() - new Date(e.completedAt).getTime()) / (30 * 86_400_000);
    expect(months).toBeGreaterThan(11.5);
    expect(months).toBeLessThan(12.5);
    expect(e.isExpired).toBe(false);
  });

  it('B sees no trainings of their own', async () => {
    const me = await http().get('/api/trainings/me').set(auth(u.empB)).expect(200);
    expect(me.body.total).toBe(0);
  });

  it('invalid enrollment update (status enum, score > 100) -> 400', async () => {
    await http().patch(`/api/trainings/enrollments/${enrollmentA}`).set(auth(u.manager)).send({ status: 'bogus' }).expect(400);
    await http().patch(`/api/trainings/enrollments/${enrollmentA}`).set(auth(u.manager)).send({ score: 101 }).expect(400);
  });

  it('a training with enrollments cannot be deleted (409)', async () => {
    await http().delete(`/api/trainings/${trainingId}`).set(auth(u.manager)).expect(409);
  });
});
