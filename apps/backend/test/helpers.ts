import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { deflateSync } from 'zlib';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { dbConfig } from '../src/config/database';

export const PASSWORD = 'Passw0rdTest';
const KEEP_TABLES = ['migrations', 'checklist_template', 'emergency_scenario'];

export async function createApp(): Promise<INestApplication> {
  // The default config loads compiled entities from dist/; under ts-jest the entity classes come from src/,
  // so point TypeORM at the TypeScript entities. The test DB is already migrated.
  Object.assign(dbConfig, { entities: [join(__dirname, '../src/**/*.entity.ts')], migrations: [], migrationsRun: false });
  const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.init();
  return app;
}

/** Empties every table except migrations and the seeded templates/scenarios. Dedicated test DB only. */
export async function resetDb(app: INestApplication): Promise<void> {
  const ds = app.get(DataSource);
  const db = ds.options.database as string;
  if (!/test/i.test(db)) throw new Error(`Refusing to truncate non-test database "${db}"`);
  const rows: { tablename: string }[] = await ds.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  const tables = rows.map((r) => r.tablename).filter((t) => !KEEP_TABLES.includes(t));
  if (tables.length) await ds.query(`TRUNCATE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
}

export interface TestUser {
  email: string;
  id: number;
  token: string;
}

export const auth = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

export function register(app: INestApplication, email: string, extra: Record<string, unknown> = {}) {
  return request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, firstName: 'Test', lastName: email.split('@')[0], password: PASSWORD, ...extra });
}

export function login(app: INestApplication, email: string, password = PASSWORD) {
  return request(app.getHttpServer()).post('/api/auth/login').send({ email, password });
}

async function loginUser(app: INestApplication, email: string): Promise<TestUser> {
  const res = await login(app, email);
  if (res.status !== 200) throw new Error(`login ${email} failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { email, id: res.body.user.id, token: res.body.access_token };
}

export interface Users {
  admin: TestUser;
  manager: TestUser;
  empA: TestUser;
  empB: TestUser;
}

/** Registers admin (first user), manager, empA, empB through the API and returns logged-in users. */
export async function seedUsers(app: INestApplication, prefix = 'e2e'): Promise<Users> {
  const emails = {
    admin: `${prefix}.admin@example.com`,
    manager: `${prefix}.manager@example.com`,
    empA: `${prefix}.empa@example.com`,
    empB: `${prefix}.empb@example.com`,
  };
  const r0 = await register(app, emails.admin);
  if (r0.status !== 201) throw new Error(`register admin failed: ${r0.status} ${JSON.stringify(r0.body)}`);
  const admin = await loginUser(app, emails.admin);
  for (const [key, role] of [['manager', 'sst_manager'], ['empA', 'employee'], ['empB', 'employee']] as const) {
    const r = await register(app, emails[key]);
    if (r.status !== 201) throw new Error(`register ${key} failed: ${r.status}`);
    await request(app.getHttpServer()).put(`/api/auth/users/${emails[key]}/approve`).set(auth(admin));
    // approve may already assign a role; make sure the final role is the wanted one
    const rr = await request(app.getHttpServer()).put(`/api/auth/users/${emails[key]}/role`).set(auth(admin)).send({ role });
    if (![200, 400].includes(rr.status)) throw new Error(`role ${key} failed: ${rr.status} ${JSON.stringify(rr.body)}`);
  }
  return {
    admin,
    manager: await loginUser(app, emails.manager),
    empA: await loginUser(app, emails.empA),
    empB: await loginUser(app, emails.empB),
  };
}

// ---------- tiny PNG generator ----------
const CRC_TABLE = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

/** Valid 1x1 RGB PNG; `seed` changes the pixel colour so every image has a distinct hash. */
export function makePng(seed = 0): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const raw = Buffer.from([0, seed & 0xff, (seed >> 8) & 0xff, (seed >> 16) & 0xff]);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export interface IncidentOpts {
  type?: string;
  severity?: string;
  description?: string;
  seed?: number;
  withImage?: boolean;
}

/** Creates an incident (multipart) with a unique location/image so duplicate detection never triggers. */
export function createIncident(app: INestApplication, user: { token: string }, o: IncidentOpts = {}) {
  const seed = o.seed ?? Math.floor(Math.random() * 1e6);
  let req = request(app.getHttpServer())
    .post('/api/incidents')
    .set(auth(user))
    .field('type', o.type ?? 'safety')
    .field('severity', o.severity ?? 'low')
    .field('description', o.description ?? `e2e incident ${seed}`)
    .field('manualAddress', `Zone e2e ${seed}`);
  if (o.withImage !== false) req = req.attach('media', makePng(seed), { filename: `p${seed}.png`, contentType: 'image/png' });
  return req;
}
