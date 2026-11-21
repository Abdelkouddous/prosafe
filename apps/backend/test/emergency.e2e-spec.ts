import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { auth, createApp, resetDb, seedUsers, Users } from './helpers';

describe('Emergency (e2e)', () => {
  let app: INestApplication;
  let u: Users;
  const http = () => request(app.getHttpServer());
  let eventId: number;

  beforeAll(async () => {
    app = await createApp();
    await resetDb(app);
    u = await seedUsers(app, 'emg');
  });
  afterAll(async () => {
    await app.close();
  });

  it('employee cannot trigger (403)', async () => {
    await http().post('/api/emergency/trigger').set(auth(u.empA)).send({ message: 'x' }).expect(403);
  });

  it('trigger without message -> 400', async () => {
    await http().post('/api/emergency/trigger').set(auth(u.manager)).send({}).expect(400);
  });

  it('manager triggers an emergency -> active event', async () => {
    const res = await http().post('/api/emergency/trigger').set(auth(u.manager)).send({ message: 'Incendie bâtiment B', zone: 'B' });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toMatchObject({ message: 'Incendie bâtiment B', zone: 'B', active: true, triggeredById: u.manager.id });
    eventId = res.body.id;
    const events = await http().get('/api/emergency/events?active=true').set(auth(u.empA)).expect(200);
    expect(events.body).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(events.body.data[0].id).toBe(eventId);
  });

  it('every user (admin, manager, employees) gets an emergency notification', async () => {
    for (const user of [u.admin, u.manager, u.empA, u.empB]) {
      const res = await http().get('/api/notifications').set(auth(user)).expect(200);
      expect(res.body).toMatchObject({ page: 1, limit: 20 });
      const n = res.body.data.find((x: any) => x.type === 'emergency');
      expect(n).toBeDefined();
      expect(n.body).toContain('Incendie bâtiment B');
    }
  });

  it('triggering with an unknown scenario -> 404', async () => {
    await http().post('/api/emergency/trigger').set(auth(u.manager)).send({ message: 'x', scenarioId: 999999 }).expect(404);
  });

  it('manager closes the event; it is no longer active', async () => {
    await http().patch(`/api/emergency/events/${eventId}/close`).set(auth(u.manager)).expect(200);
    const events = await http().get('/api/emergency/events?active=true').set(auth(u.empA)).expect(200);
    expect(events.body.total).toBe(0);
  });

  it('employee can read scenarios (seeded) but not create one', async () => {
    const res = await http().get('/api/emergency/scenarios').set(auth(u.empA)).expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    await http().post('/api/emergency/scenarios').set(auth(u.empA)).send({ title: 't', type: 'fire', steps: [] }).expect(403);
  });
});
