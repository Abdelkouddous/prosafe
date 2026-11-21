import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health-check (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/api/health-check').expect(200);
    expect(JSON.parse(res.text)).toEqual({ message: 'up' });
  });

  it('rejects unauthenticated access to protected routes', () => {
    return request(app.getHttpServer()).get('/api/incidents').expect(401);
  });
});
