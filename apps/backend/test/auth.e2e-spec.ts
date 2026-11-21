import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { auth, createApp, login, PASSWORD, register, resetDb } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  const adminEmail = 'auth.admin@example.com';
  const userEmail = 'auth.user@example.com';

  beforeAll(async () => {
    app = await createApp();
    await resetDb(app);
  });
  afterAll(async () => {
    await app.close();
  });

  it('first registered user becomes admin and can log in', async () => {
    await register(app, adminEmail).expect(201);
    const res = await login(app, adminEmail).expect(200);
    expect(res.body.user.roles).toEqual(['admin']);
    expect(typeof res.body.access_token).toBe('string');
    adminToken = res.body.access_token;
  });

  it('second user is pending and cannot log in (403)', async () => {
    await register(app, userEmail).expect(201);
    await login(app, userEmail).expect(403);
  });

  it('rejects wrong password (401) and unknown user (401)', async () => {
    await login(app, userEmail, 'Wrong0Password').expect(401);
    await login(app, 'nobody@example.com').expect(401);
  });

  it('after approval the user can log in (200) as employee', async () => {
    await request(app.getHttpServer()).put(`/api/auth/users/${userEmail}/approve`).set(auth({ token: adminToken })).expect(200);
    const res = await login(app, userEmail).expect(200);
    expect(res.body.user.roles).toEqual(['employee']);
  });

  it('register with a `role` field is rejected (400) and creates no user', async () => {
    await register(app, 'auth.evil@example.com', { role: 'admin' }).expect(400);
    // no account was created: the credentials do not work
    await login(app, 'auth.evil@example.com').expect(401);
  });

  it('register validation: invalid email, weak password, duplicate -> 400', async () => {
    await register(app, 'not-an-email').expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'auth.weak@example.com', firstName: 'a', lastName: 'b', password: 'weak' })
      .expect(400);
    await register(app, userEmail).expect(400);
  });

  it('GET /auth/me returns the user without password nor token fields', async () => {
    const res = await request(app.getHttpServer()).get('/api/auth/me').set(auth({ token: adminToken })).expect(200);
    expect(res.body.user.email).toBe(adminEmail);
    const keys = Object.keys(res.body.user).map((k) => k.toLowerCase());
    expect(keys).not.toContain('password');
    expect(keys.filter((k) => k.includes('token'))).toEqual([]);
    expect(JSON.stringify(res.body)).not.toContain(adminToken);
  });

  it('GET /auth/me without token -> 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('login rate limit: 6th attempt for the same ip+email -> 429', async () => {
    const email = 'auth.throttle@example.com';
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await login(app, email, PASSWORD)).status);
    expect(codes.slice(0, 5)).not.toContain(429);
    expect(codes[5]).toBe(429);
  });
});
