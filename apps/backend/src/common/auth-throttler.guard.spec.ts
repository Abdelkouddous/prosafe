import { AppThrottlerGuard } from './auth-throttler.guard';

describe('AppThrottlerGuard tracker', () => {
  const tracker = (req: any) => (AppThrottlerGuard.prototype as any).getTracker.call({}, req);

  it('keys login/register by IP + normalised email', async () => {
    expect(await tracker({ ip: '1.2.3.4', method: 'POST', originalUrl: '/api/auth/login', body: { email: ' A@B.com ' } })).toBe('1.2.3.4|a@b.com');
    expect(await tracker({ ip: '1.2.3.4', method: 'POST', originalUrl: '/api/auth/register?x=1', body: { email: 'c@d.com' } })).toBe('1.2.3.4|c@d.com');
  });

  it('keys other routes by IP only', async () => {
    expect(await tracker({ ip: '1.2.3.4', method: 'GET', originalUrl: '/api/incidents', body: {} })).toBe('1.2.3.4');
    expect(await tracker({ ip: '1.2.3.4', method: 'POST', originalUrl: '/api/incidents', body: { email: 'x@y.z' } })).toBe('1.2.3.4');
  });
});
