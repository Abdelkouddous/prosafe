import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Role } from '../users/enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let users: { countUsers: jest.Mock; create: jest.Mock; findOne: jest.Mock };
  let jwt: { sign: jest.Mock };
  let emailVerification: { createToken: jest.Mock; sendVerificationEmail: jest.Mock };
  const logger: any = { debug: jest.fn() };

  const dto = (email: string) => ({ email, firstName: 'Jane', lastName: 'Doe', password: 'Passw0rdX' });

  beforeEach(() => {
    users = {
      countUsers: jest.fn(),
      create: jest.fn().mockImplementation(async (d) => ({ id: 1, ...d })),
      findOne: jest.fn(),
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt') };
    emailVerification = {
      createToken: jest.fn().mockResolvedValue({ token: 't' }),
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };
    service = new AuthService(logger, jwt as any, users as any, emailVerification as any);
  });

  describe('register', () => {
    it('makes the very first user an admin', async () => {
      users.countUsers.mockResolvedValue(0);
      const res = await service.register(dto('first@example.com'));
      expect(res.status).toBe(201);
      expect(users.create).toHaveBeenCalledWith(expect.anything(), Role.ADMIN);
    });

    it('makes every later user pending', async () => {
      users.countUsers.mockResolvedValue(3);
      const res = await service.register(dto('later@example.com'));
      expect(res.status).toBe(201);
      expect(users.create).toHaveBeenCalledWith(expect.anything(), Role.PENDING);
    });

    it('does not grant admin based on the email address', async () => {
      users.countUsers.mockResolvedValue(5);
      await service.register(dto('admin@prosafe.dz'));
      expect(users.create).toHaveBeenCalledWith(expect.anything(), Role.PENDING);
    });

    it('ignores a role supplied by the client', async () => {
      users.countUsers.mockResolvedValue(5);
      await service.register({ ...dto('x@example.com'), role: 'admin' } as any);
      expect(users.create).toHaveBeenCalledWith(expect.anything(), Role.PENDING);
    });
  });

  describe('login', () => {
    const stored = async (roles: Role[], isActive = true) => ({
      id: 7,
      email: 'u@example.com',
      password: await bcrypt.hash('Passw0rdX', 4),
      roles,
      isActive,
    });

    it('returns a token for valid credentials', async () => {
      users.findOne.mockResolvedValue(await stored([Role.EMPLOYEE]));
      const res = await service.login({ email: 'u@example.com', password: 'Passw0rdX' });
      expect(res.status).toBe(200);
      expect(res.msg.access_token).toBe('signed.jwt');
    });

    it('rejects a wrong password with 401', async () => {
      users.findOne.mockResolvedValue(await stored([Role.EMPLOYEE]));
      const res = await service.login({ email: 'u@example.com', password: 'nope' });
      expect(res.status).toBe(401);
    });

    it('refuses pending accounts with 403', async () => {
      users.findOne.mockResolvedValue(await stored([Role.PENDING], false));
      const res = await service.login({ email: 'u@example.com', password: 'Passw0rdX' });
      expect(res.status).toBe(403);
    });

    it('refuses blocked accounts with 403', async () => {
      users.findOne.mockResolvedValue(await stored([Role.EMPLOYEE], false));
      const res = await service.login({ email: 'u@example.com', password: 'Passw0rdX' });
      expect(res.status).toBe(403);
    });
  });
});
