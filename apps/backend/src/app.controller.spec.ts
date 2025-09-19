import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockAppService = {
      getHello: jest.fn().mockReturnValue('Hello World!'),
    };

    const mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      delete: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: 'AuthService',
          useValue: mockAuthService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should render welcome page with HTML content', () => {
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      appController.getWelcome(mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('PROSAFE'));
      expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Incident Tracking & Declaring App'));
      expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('/api'));
    });
  });

  describe('test-connection', () => {
    it('should return connection successful message', () => {
      expect(appController.testConnection()).toEqual({
        message: 'Backend connection successful!',
      });
    });
  });

  describe('health-check', () => {
    it('should return health check message', () => {
      expect(appController.healthCheck()).toBe('OK');
    });
  });
});
