import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { APIError } from 'vk-io';
import { VkApiRetryService } from './vk-api-retry.service.js';

describe('VkApiRetryService', () => {
  let service: VkApiRetryService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'vkApiRetryMaxAttempts') return 3;
        if (key === 'vkApiRetryInitialDelayMs') return 100;
        if (key === 'vkApiRetryMaxDelayMs') return 1000;
        if (key === 'vkApiRetryMultiplier') return 2;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VkApiRetryService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<VkApiRetryService>(VkApiRetryService);
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  it('должен выполнять успешный запрос без retry', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const result = await service.executeWithRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('должен повторять запрос при retryable ошибке', async () => {
    const error = new APIError({ message: 'Too many requests' } as never);
    error.code = 6;
    const fn = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    const result = await service.executeWithRetry(fn, {
      maxAttempts: 2,
      initialDelayMs: 10,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('должен выбрасывать ошибку при non-retryable ошибке', async () => {
    const error = new APIError({ message: 'Access denied' } as never);
    error.code = 15;
    const fn = jest.fn().mockRejectedValue(error);

    await expect(service.executeWithRetry(fn)).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
