import { RetryDecorator, IRetryConfig } from '../../decorators/retry.decorator';

describe('RetryDecorator', () => {
  let mockOperation: { execute: jest.Mock };
  let decorator: RetryDecorator;

  beforeEach(() => {
    mockOperation = {
      execute: jest.fn(),
    };
  });

  it('should execute operation successfully on first try', async () => {
    mockOperation.execute.mockResolvedValue('success');
    decorator = new RetryDecorator(mockOperation);

    const result = await decorator.execute();

    expect(result).toBe('success');
    expect(mockOperation.execute).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    mockOperation.execute
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    decorator = new RetryDecorator(mockOperation);

    const result = await decorator.execute();

    expect(result).toBe('success');
    expect(mockOperation.execute).toHaveBeenCalledTimes(2);
  });

  it('should respect max retries limit', async () => {
    const config: IRetryConfig = { maxRetries: 2, baseDelay: 1, backoffMultiplier: 1 };
    mockOperation.execute.mockRejectedValue(new Error('Persistent error'));

    decorator = new RetryDecorator(mockOperation, config);

    await expect(decorator.execute()).rejects.toThrow('Persistent error');
    expect(mockOperation.execute).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should apply backoff multiplier for captcha errors', async () => {
    const config: IRetryConfig = { maxRetries: 2, baseDelay: 100, backoffMultiplier: 2 };
    mockOperation.execute.mockRejectedValue(new Error('Captcha detected'));

    decorator = new RetryDecorator(mockOperation, config);

    const startTime = Date.now();
    await expect(decorator.execute()).rejects.toThrow();
    const endTime = Date.now();

    // Should have delay of baseDelay * backoffMultiplier = 200ms
    expect(endTime - startTime).toBeGreaterThanOrEqual(190);
  });

  it('should not retry on non-retryable errors', async () => {
    mockOperation.execute.mockRejectedValue(new Error('Validation error'));

    decorator = new RetryDecorator(mockOperation);

    await expect(decorator.execute()).rejects.toThrow('Validation error');
    expect(mockOperation.execute).toHaveBeenCalledTimes(1);
  });
});