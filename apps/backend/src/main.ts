import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestMethod } from '@nestjs/common';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);

    // Security middleware
    // Behind Railway's proxy: trust N hops so req.ip (used by the throttler) is the real client IP.
    app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
    // cross-origin resource policy so the admin web (other origin) can display /files/:id media
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    // CORS: CORS_ORIGINS (comma-separated) overrides the defaults.
    const envOrigins = (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    // Restrictive by default; permissive (any origin) only when NODE_ENV === 'development'.
    const defaultOrigins: (string | RegExp)[] | string =
      process.env.NODE_ENV === 'development'
        ? '*'
        : [
            'https://prosafe-admin-psi.vercel.app',
            'https://prosafe-admin-92x9gdh09-abdelkouddous-projects.vercel.app',
            'https://prosafe-admin.vercel.app',
            /^https:\/\/prosafe-admin-.*\.vercel\.app$/, // Vercel preview deployments
          ];
    app.enableCors({
      origin: envOrigins.length > 0 ? envOrigins : defaultOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    // Global prefix and pipes
    app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.GET }],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('PROSAFE API')
      .setDescription("API de l'application SST PROSAFE")
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`Application is running on: ${configService.get('APP_URL', 'http://localhost')}:${port}`);
  } catch (error) {
    console.error('Error during application bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();
