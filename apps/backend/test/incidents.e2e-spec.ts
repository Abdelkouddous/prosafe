import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { auth, createApp, createIncident, makePng, resetDb, seedUsers, Users } from './helpers';

const binaryParser = (res: any, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

describe('Incidents, files and rewards (e2e)', () => {
  let app: INestApplication;
  let u: Users;
  const http = () => request(app.getHttpServer());

  let a1: { id: number; incidentId: string };
  let a2: { id: number; incidentId: string };
  let b1: { id: number; incidentId: string };
  const png1 = makePng(101);

  beforeAll(async () => {
    app = await createApp();
    await resetDb(app);
    u = await seedUsers(app, 'inc');
  });
  afterAll(async () => {
    await app.close();
  });

  describe('creation', () => {
    it('employee creates an incident with a real PNG -> 201 + reward', async () => {
      const res = await http()
        .post('/api/incidents')
        .set(auth(u.empA))
        .field('type', 'safety')
        .field('severity', 'medium')
        .field('description', 'Sol glissant')
        .field('manualAddress', 'Atelier 1')
        .attach('media', png1, { filename: 'photo.png', contentType: 'image/png' })
        .expect(201);
      expect(res.body.incidentId).toMatch(/^INC-\d{8}-[A-Z0-9]{6}$/);
      expect(res.body.reward.pointsAwarded).toBeGreaterThan(0);
      expect(res.body.reward.totalPoints).toBe(res.body.reward.pointsAwarded);
      a1 = { id: res.body.id, incidentId: res.body.incidentId };
    });

    it('fake image (text bytes named .png) -> 400 and nothing is created', async () => {
      const before = await http().get('/api/incidents').set(auth(u.empA)).expect(200);
      await http()
        .post('/api/incidents')
        .set(auth(u.empA))
        .field('type', 'safety')
        .field('severity', 'low')
        .field('manualAddress', 'Atelier fake')
        .attach('media', Buffer.from('this is definitely not a png'), { filename: 'fake.png', contentType: 'image/png' })
        .expect(400);
      const after = await http().get('/api/incidents').set(auth(u.empA)).expect(200);
      expect(after.body.total).toBe(before.body.total);
    });

    it('unsupported mime type (text/plain) -> 400', async () => {
      await http()
        .post('/api/incidents')
        .set(auth(u.empA))
        .field('type', 'safety')
        .field('severity', 'low')
        .field('manualAddress', 'Atelier txt')
        .attach('media', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' })
        .expect(400);
    });

    it('invalid DTO (bad enum / missing location) -> 400', async () => {
      await http().post('/api/incidents').set(auth(u.empA)).field('type', 'nope').field('severity', 'low').field('manualAddress', 'x').expect(400);
      await http().post('/api/incidents').set(auth(u.empA)).field('type', 'safety').field('severity', 'low').expect(400);
    });

    it('same photo re-submitted by the same user -> 409 (duplicate)', async () => {
      await http()
        .post('/api/incidents')
        .set(auth(u.empA))
        .field('type', 'safety')
        .field('severity', 'low')
        .field('manualAddress', 'Atelier dup')
        .attach('media', png1, { filename: 'photo.png', contentType: 'image/png' })
        .expect(409);
    });

    it('creates more incidents (A: near_miss high, B: equipment_failure low)', async () => {
      const r2 = await createIncident(app, u.empA, { type: 'near_miss', severity: 'high', seed: 202 }).expect(201);
      a2 = { id: r2.body.id, incidentId: r2.body.incidentId };
      const r3 = await createIncident(app, u.empB, { type: 'equipment_failure', severity: 'low', seed: 303 }).expect(201);
      b1 = { id: r3.body.id, incidentId: r3.body.incidentId };
    });
  });

  describe('visibility, filters, pagination', () => {
    it('employee A cannot read employee B incident (404, by id and by code)', async () => {
      await http().get(`/api/incidents/${b1.id}`).set(auth(u.empA)).expect(404);
      await http().get(`/api/incidents/${b1.incidentId}`).set(auth(u.empA)).expect(404);
      await http().get(`/api/incidents/${b1.id}`).set(auth(u.empB)).expect(200);
    });

    it('employee list only shows own incidents (reporterId filter is ignored)', async () => {
      const res = await http().get('/api/incidents').set(auth(u.empA)).expect(200);
      expect(res.body.total).toBe(2);
      expect(res.body.data.map((i: any) => i.incidentId).sort()).toEqual([a1.incidentId, a2.incidentId].sort());
      const spoof = await http().get(`/api/incidents?reporterId=${u.empB.id}`).set(auth(u.empA)).expect(200);
      expect(spoof.body.data.every((i: any) => i.reportedBy === u.empA.id)).toBe(true);
      const mine = await http().get('/api/incidents/my-incidents').set(auth(u.empB)).expect(200);
      expect(mine.body).toHaveLength(1);
    });

    it('manager sees all incidents with the paginated shape', async () => {
      const res = await http().get('/api/incidents').set(auth(u.manager)).expect(200);
      expect(Object.keys(res.body).sort()).toEqual(['data', 'limit', 'page', 'total']);
      expect(res.body).toMatchObject({ total: 3, page: 1, limit: 20 });
      expect(res.body.data).toHaveLength(3);
    });

    it('filters by type and severity', async () => {
      const t = await http().get('/api/incidents?type=near_miss').set(auth(u.manager)).expect(200);
      expect(t.body.total).toBe(1);
      expect(t.body.data[0].incidentId).toBe(a2.incidentId);
      const s = await http().get('/api/incidents?severity=low').set(auth(u.manager)).expect(200);
      expect(s.body.total).toBe(1);
      expect(s.body.data[0].incidentId).toBe(b1.incidentId);
      expect(s.body.data.every((i: any) => i.severity === 'low')).toBe(true);
    });

    it('filters by status', async () => {
      const open = await http().get('/api/incidents?status=open').set(auth(u.manager)).expect(200);
      expect(open.body.total).toBe(3);
      const closed = await http().get('/api/incidents?status=closed').set(auth(u.manager)).expect(200);
      expect(closed.body).toMatchObject({ total: 0, data: [] });
    });

    it('pagination: limit=2 page=2 -> 1 item, total 3', async () => {
      const res = await http().get('/api/incidents?limit=2&page=2').set(auth(u.manager)).expect(200);
      expect(res.body).toMatchObject({ total: 3, page: 2, limit: 2 });
      expect(res.body.data).toHaveLength(1);
    });

    it('invalid query (status enum, limit > 100, page 0) -> 400', async () => {
      await http().get('/api/incidents?status=bogus').set(auth(u.manager)).expect(400);
      await http().get('/api/incidents?limit=1000').set(auth(u.manager)).expect(400);
      await http().get('/api/incidents?page=0').set(auth(u.manager)).expect(400);
    });
  });

  describe('files', () => {
    it('GET /api/files/:id returns the uploaded bytes with an image content-type', async () => {
      const detail = await http().get(`/api/incidents/${a1.id}`).set(auth(u.empA)).expect(200);
      expect(detail.body.media).toHaveLength(1);
      const fileId = detail.body.media[0].id;
      expect(detail.body.media[0].mimeType).toBe('image/png');
      const res = await http().get(`/api/files/${fileId}`).set(auth(u.empA)).buffer(true).parse(binaryParser).expect(200);
      expect(res.headers['content-type']).toMatch(/^image\/png/);
      expect(Buffer.compare(res.body, png1)).toBe(0);
    });

    it('GET /api/files/:id without token -> 401; unknown id -> 404', async () => {
      await http().get('/api/files/1').expect(401);
      await http().get('/api/files/999999').set(auth(u.empA)).expect(404);
    });
  });

  describe('status, history, evaluation', () => {
    it('status change writes history (open -> investigating)', async () => {
      await http()
        .patch(`/api/incidents/${a1.id}/status`)
        .set(auth(u.manager))
        .send({ status: 'investigating', comment: 'On it' })
        .expect(200);
      const detail = await http().get(`/api/incidents/${a1.id}`).set(auth(u.manager)).expect(200);
      expect(detail.body.status).toBe('investigating');
      const hist = detail.body.history.map((h: any) => [h.fromStatus, h.toStatus, h.comment]);
      expect(hist).toEqual([
        [null, 'open', null],
        ['open', 'investigating', 'On it'],
      ]);
    });

    it('invalid transition (investigating -> open) -> 400; invalid enum -> 400', async () => {
      await http().patch(`/api/incidents/${a1.id}/status`).set(auth(u.manager)).send({ status: 'bogus' }).expect(400);
      await http().patch(`/api/incidents/${a1.id}/status`).set(auth(u.manager)).send({ status: 'open' }).expect(400);
    });

    it('`rejected` is only allowed with status closed -> 400', async () => {
      await http().patch(`/api/incidents/${a1.id}/status`).set(auth(u.manager)).send({ status: 'resolved', rejected: true }).expect(400);
    });

    it('evaluation sets riskScore = gravity x probability', async () => {
      const res = await http()
        .patch(`/api/incidents/${a1.id}/evaluation`)
        .set(auth(u.manager))
        .send({ gravity: 4, probability: 3, rootCause: 'Fuite' })
        .expect(200);
      expect(res.body.riskScore).toBe(12);
      expect(res.body.evaluation).toMatchObject({ gravity: 4, probability: 3, riskScore: 12, rootCause: 'Fuite' });
      await http().patch(`/api/incidents/${a1.id}/evaluation`).set(auth(u.manager)).send({ gravity: 9, probability: 3 }).expect(400);
      await http().patch(`/api/incidents/${a1.id}/evaluation`).set(auth(u.empA)).send({ gravity: 2, probability: 2 }).expect(403);
    });

    it('reject (closed + rejected) revokes the reporter points', async () => {
      const before = await http().get('/api/rewards/me/summary').set(auth(u.empB)).expect(200);
      expect(before.body.totalPoints).toBeGreaterThan(0);
      const res = await http()
        .patch(`/api/incidents/${b1.id}/status`)
        .set(auth(u.manager))
        .send({ status: 'closed', rejected: true, comment: 'Faux signalement' })
        .expect(200);
      expect(res.body.status).toBe('closed');
      const after = await http().get('/api/rewards/me/summary').set(auth(u.empB)).expect(200);
      expect(after.body.totalPoints).toBe(0);
      // the other employee keeps their points
      const other = await http().get('/api/rewards/me/summary').set(auth(u.empA)).expect(200);
      expect(other.body.totalPoints).toBeGreaterThan(0);
    });

    it('unknown incident -> 404', async () => {
      await http().patch('/api/incidents/999999/status').set(auth(u.manager)).send({ status: 'closed' }).expect(404);
    });
  });
});
