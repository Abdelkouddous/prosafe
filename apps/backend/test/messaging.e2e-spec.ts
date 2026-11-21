import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { auth, createApp, resetDb, seedUsers, Users } from './helpers';

describe('Messaging (e2e)', () => {
  let app: INestApplication;
  let u: Users;
  const http = () => request(app.getHttpServer());
  let convId: number;

  beforeAll(async () => {
    app = await createApp();
    await resetDb(app);
    u = await seedUsers(app, 'msg');
  });
  afterAll(async () => {
    await app.close();
  });

  it('employee creates a conversation without recipient -> SST manager is a participant', async () => {
    const res = await http()
      .post('/api/conversations')
      .set(auth(u.empA))
      .send({ subject: 'Question EPI', body: 'Où trouver des gants ?' })
      .expect(201);
    convId = res.body.id;
    expect(res.body.subject).toBe('Question EPI');
  });

  it('manager sees the conversation in their list (paginated) and can read it', async () => {
    const list = await http().get('/api/conversations').set(auth(u.manager)).expect(200);
    expect(list.body).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(list.body.data[0].id).toBe(convId);
    await http().get(`/api/conversations/${convId}`).set(auth(u.manager)).expect(200);
    const msgs = await http().get(`/api/conversations/${convId}/messages`).set(auth(u.manager)).expect(200);
    expect(msgs.body.total).toBe(1);
    expect(msgs.body.data[0].body).toBe('Où trouver des gants ?');
  });

  it('manager receives a message notification', async () => {
    const res = await http().get('/api/notifications').set(auth(u.manager)).expect(200);
    expect(res.body.data.some((n: any) => n.type === 'message')).toBe(true);
  });

  it('another employee gets 404 on the conversation, its messages, read and post', async () => {
    await http().get(`/api/conversations/${convId}`).set(auth(u.empB)).expect(404);
    await http().get(`/api/conversations/${convId}/messages`).set(auth(u.empB)).expect(404);
    await http().post(`/api/conversations/${convId}/messages`).set(auth(u.empB)).send({ body: 'intrus' }).expect(404);
    await http().patch(`/api/conversations/${convId}/read`).set(auth(u.empB)).expect(404);
    const list = await http().get('/api/conversations').set(auth(u.empB)).expect(200);
    expect(list.body.total).toBe(0);
  });

  it('manager replies, employee A sees the reply (2 messages, oldest first)', async () => {
    await http().post(`/api/conversations/${convId}/messages`).set(auth(u.manager)).send({ body: 'Au magasin.' }).expect(201);
    const msgs = await http().get(`/api/conversations/${convId}/messages`).set(auth(u.empA)).expect(200);
    expect(msgs.body.data.map((m: any) => m.body)).toEqual(['Où trouver des gants ?', 'Au magasin.']);
  });

  it('validation: empty body / missing subject -> 400; no token -> 401', async () => {
    await http().post(`/api/conversations/${convId}/messages`).set(auth(u.empA)).send({ body: '' }).expect(400);
    await http().post('/api/conversations').set(auth(u.empA)).send({ body: 'x' }).expect(400);
    await http().get('/api/conversations').expect(401);
  });

  it('manager must provide a recipientId (400); employee cannot target another employee (403)', async () => {
    await http().post('/api/conversations').set(auth(u.manager)).send({ subject: 's', body: 'b' }).expect(400);
    await http().post('/api/conversations').set(auth(u.empA)).send({ subject: 's', body: 'b', recipientId: u.empB.id }).expect(403);
  });
});
