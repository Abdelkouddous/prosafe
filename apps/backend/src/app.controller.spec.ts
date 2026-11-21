import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('renders the welcome page linking to the Swagger docs', () => {
    const res = { setHeader: jest.fn(), send: jest.fn() };
    appController.getWelcome(res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('/api/docs'));
  });

  it('health-check reports up', () => {
    expect(JSON.parse(appController.healthCheck())).toEqual({ message: 'up' });
  });
});
