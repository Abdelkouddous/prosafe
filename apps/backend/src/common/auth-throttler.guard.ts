import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

const AUTH_PATHS = /\/auth\/(login|register)\/?$/;

/**
 * Global throttler guard. Login/register are tracked per IP + email so that one attacker IP cannot
 * lock out everybody behind a shared NAT, and a single account cannot be brute forced from many IPs
 * without each IP being limited. Every other route is tracked per IP.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip: string = req.ip ?? 'unknown';
    const path: string = req.originalUrl ?? req.url ?? '';
    if (req.method === 'POST' && AUTH_PATHS.test(path.split('?')[0])) {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
      return `${ip}|${email}`;
    }
    return ip;
  }
}
