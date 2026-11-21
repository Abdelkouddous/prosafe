import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestMethod } from '@nestjs/common';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Security middleware
    app.use(helmet());
    // CORS: CORS_ORIGINS (comma-separated) overrides the defaults.
    const envOrigins = (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const defaultOrigins =
      process.env.NODE_ENV === 'production'
        ? [
            'https://prosafe-admin-psi.vercel.app',
            'https://prosafe-admin-92x9gdh09-abdelkouddous-projects.vercel.app',
            'https://prosafe-admin.vercel.app',
            /^https:\/\/prosafe-admin-.*\.vercel\.app$/, // Vercel preview deployments
            /^http:\/\/localhost:\d+$/, // local development ports
          ]
        : '*';
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
