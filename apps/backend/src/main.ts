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
    app.enableCors({
      // Allow all origins in development, specific origins in production
      origin:
        process.env.NODE_ENV === 'production'
          ? [
              'https://prosafe-admin-psi.vercel.app',
              'https://prosafe-admin.vercel.app', // In case you change the domain
              'http://localhost:5173', // For local development
              'http://localhost:3000', // For local development
            ]
          : '*',
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
      .setTitle('Prime Nestjs')
      .setDescription('Boilerplate for nestjs')
      .setVersion('2.0.0')
      .addBearerAuth()
      .addTag('api')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`Application is running on: ${configService.get('APP_URL', 'http://localhost')}:${port}`);
  } catch (error) {
    console.error('Error during application bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();
