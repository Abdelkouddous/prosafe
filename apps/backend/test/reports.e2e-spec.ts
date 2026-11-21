import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { auth, createApp, createIncident, resetDb, seedUsers, Users } from './helpers';

const binaryParser = (res: any, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let u: Users;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createApp();
    await resetDb(app);
    u = await seedUsers(app, 'rep');
    await createIncident(app, u.empA, { seed: 11 }).expect(201);
  });
  afterAll(async () => {
    await app.close();
  });

  const get = (path: string, user = u.manager) => http().get(path).set(auth(user)).buffer(true).parse(binaryParser);

  it.each(['incidents', 'equipment', 'trainings', 'risks', 'audits'])('PDF report "%s" starts with %%PDF', async (kind) => {
    const res = await get(`/api/reports/${kind}?format=pdf`).expect(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect((res.body as Buffer).subarray(0, 4).toString('latin1')).toBe('%PDF');
  });

  it.each(['incidents', 'equipment', 'trainings', 'risks', 'audits'])('XLSX report "%s" starts with PK', async (kind) => {
    const res = await get(`/api/reports/${kind}?format=xlsx`).expect(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml/);
    expect((res.body as Buffer).subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('default format is PDF', async () => {
    const res = await get('/api/reports/incidents').expect(200);
    expect((res.body as Buffer).subarray(0, 4).toString('latin1')).toBe('%PDF');
  });

  it('invalid format / unknown kind / bad date -> 400', async () => {
    await get('/api/reports/incidents?format=docx').expect(400);
    await get('/api/reports/nope?format=pdf').expect(400);
    await get('/api/reports/incidents?from=garbage').expect(400);
  });

  it('employee -> 403, no token -> 401', async () => {
    await get('/api/reports/incidents?format=pdf', u.empA).expect(403);
    await http().get('/api/reports/incidents?format=pdf').expect(401);
  });
});
