import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { LoggerModule } from 'src/logger/logger.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    LoggerModule,
    PassportModule.register({ defaultStrategy: 'jwt', property: 'user', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        privateKey: configService.get<string>('keys.privateKey'),
        publicKey: configService.get<string>('keys.publicKey'),
        signOptions: { expiresIn: '24h', algorithm: 'RS256' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    MailerModule,
    TypeOrmModule.forFeature([User, EmailVerification]),
  ],
  providers: [AuthService, JwtStrategy, EmailVerificationService],
  exports: [AuthService, JwtModule, PassportModule],
  controllers: [AuthController],
})
export class AuthModule {}
