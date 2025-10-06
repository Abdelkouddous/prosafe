import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from 'src/users/entities/user.entity';
import { randomBytes } from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(EmailVerification)
    private readonly verificationRepo: Repository<EmailVerification>,
    private readonly mailerService: MailerService,
  ) {}

  async createToken(user: User, expiresInMinutes = 60): Promise<EmailVerification> {
    const token = randomBytes(32).toString('hex');
    const entity = this.verificationRepo.create({
      token,
      user,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60_000),
      consumed: false,
    });
    return this.verificationRepo.save(entity);
  }

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verifyUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verify your Prosafe account',
      html: `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif">
          <h2>Welcome to Prosafe!</h2>
          <p>Please verify your email to activate your account.</p>
          <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Verify Email</a></p>
          <p>If the button doesn’t work, open this link:<br/>
          <a href="${verifyUrl}">${verifyUrl}</a></p>
        </div>
      `,
    });
  }

  async verifyToken(token: string): Promise<User | null> {
    const record = await this.verificationRepo.findOne({ where: { token }, relations: ['user'] });
    if (!record) return null;
    const now = new Date();
    if (record.consumed) return null;
    if (record.expiresAt < now) return null;
    record.consumed = true;
    await this.verificationRepo.save(record);
    return record.user;
  }

  async resendForUser(user: User): Promise<EmailVerification> {
    // Invalidate previous tokens for the user using query builder for reliability
    await this.verificationRepo
      .createQueryBuilder()
      .update(EmailVerification)
      .set({ consumed: true })
      .where('user_id = :userId', { userId: user.id })
      .execute();
    const created = await this.createToken(user);
    await this.sendVerificationEmail(user, created.token);
    return created;
  }
}