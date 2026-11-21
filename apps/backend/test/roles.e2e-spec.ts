import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { auth, createApp, createIncident, register, resetDb, seedUsers, Users } from './helpers';

describe('Role matrix (e2e)', () => {
  let app: INestApplication;
  let u: Users;
  let incidentId: number;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createApp();
    await resetDb(app);
    u = await seedUsers(app, 'roles');
    const inc = await createIncident(app, u.empA).expect(201);
    incidentId = inc.body.id;
    // throw-away users to delete
    for (const n of [1, 2]) await register(app, `roles.victim${n}@example.com`).expect(201);
  });
  afterAll(async () => {
    await app.close();
  });

  type Call = (token?: string) => request.Test;
  const withToken = (t: request.Test, token?: string) => (token ? t.set('Authorization', `Bearer ${token}`) : t);

  interface Row {
    name: string;
    call: Call;
    forbidden: 'employee' | 'sst_manager';
    allowed: 'sst_manager' | 'admin';
    okStatus: number | number[];
  }

  const inventoryBody = () => ({
    name: 'Casque',
    sku: `SKU-${Math.random().toString(36).slice(2, 10)}`,
    description: 'Casque de chantier',
    quantity: 10,
    price: 20,
    min_stock_level: 2,
    category: 'ppe',
  });

  const rows: Row[] = [
    {
      name: 'GET /api/admin/dashboard/stats',
      call: (t) => withToken(http().get('/api/admin/dashboard/stats'), t),
      forbidden: 'employee',
      allowed: 'sst_manager',
      okStatus: 200,
    },
    {
      name: 'PATCH /api/incidents/:id/status',
      call: (t) => withToken(http().patch(`/api/incidents/${incidentId}/status`).send({ status: 'investigating' }), t),
      forbidden: 'employee',
      allowed: 'sst_manager',
      okStatus: 200,
    },
    {
      name: 'POST /api/inventory',
      call: (t) => withToken(http().post('/api/inventory').send(inventoryBody()), t),
      forbidden: 'employee',
      allowed: 'sst_manager',
      okStatus: 201,
    },
    {
      name: 'POST /api/trainings',
      call: (t) => withToken(http().post('/api/trainings').send({ title: `Formation ${Math.random()}` }), t),
      forbidden: 'employee',
      allowed: 'sst_manager',
      okStatus: 201,
    },
    {
      name: 'GET /api/stats/kpis',
      call: (t) => withToken(http().get('/api/stats/kpis'), t),
      forbidden: 'employee',
      allowed: 'sst_manager',
      okStatus: 200,
    },
    {
      name: 'GET /api/reports/incidents?format=pdf',
      call: (t) => withToken(http().get('/api/reports/incidents?format=pdf'), t),
      forbidden: 'employee',
      allowed: 'sst_manager',
      okStatus: 200,
    },
    {
      name: 'POST /api/emergency/trigger',
      call: (t) => withToken(http().post('/api/emergency/trigger').send({ message: 'Test role matrix' }), t),
      forbidden: 'employee',
      allowed: 'sst_manager',
      okStatus: [200, 201],
    },
    {
      name: 'GET /api/feedback',
      call: (t) => withToken(http().get('/api/feedback'), t),
      forbidden: 'employee',
      allowed: 'sst_manager',
      okStatus: 200,
    },
    {
      name: 'GET /api/users',
      call: (t) => withToken(http().get('/api/users'), t),
      forbidden: 'employee',
      allowed: 'sst_manager',
      okStatus: 200,
    },
    {
      name: 'DELETE /api/auth/users/:email (admin only)',
      call: (t) => withToken(http().delete(`/api/auth/users/roles.victim${t === u.admin.token ? 1 : 2}@example.com`), t),
      forbidden: 'sst_manager',
      allowed: 'admin',
      okStatus: 200,
    },
  ];

  describe.each(rows)('$name', (row) => {
    it('no token -> 401', async () => {
      await row.call(undefined).expect(401);
    });
    it('invalid token -> 401', async () => {
      await row.call('not.a.jwt').expect(401);
    });
    it(`${row.forbidden} -> 403`, async () => {
      const token = row.forbidden === 'employee' ? u.empA.token : u.manager.token;
      await row.call(token).expect(403);
    });
    it(`${row.allowed} -> 2xx`, async () => {
      const token = row.allowed === 'admin' ? u.admin.token : u.manager.token;
      const res = await row.call(token);
      const ok = Array.isArray(row.okStatus) ? row.okStatus : [row.okStatus];
      expect(ok).toContain(res.status);
    });
  });

  it('admin is also allowed on manager routes (GET /api/stats/kpis)', async () => {
    await http().get('/api/stats/kpis').set(auth(u.admin)).expect(200);
  });

  it('employee is allowed on employee routes (GET /api/stats/overview, GET /api/rewards/me/summary)', async () => {
    await http().get('/api/stats/overview').set(auth(u.empA)).expect(200);
    await http().get('/api/rewards/me/summary').set(auth(u.empA)).expect(200);
  });
});
