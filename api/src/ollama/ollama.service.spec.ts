import { OllamaService } from './ollama.service';
import type { OllamaAnalysisResponse } from './interfaces/analysis.interface';

describe('OllamaService', () => {
  const originalEnv = process.env;
  const sampleAnalysis: OllamaAnalysisResponse = {
    hasSuspicious: true,
    suspicionLevel: 'medium',
    categories: ['violence'],
    explanation: 'Обнаружены признаки насилия',
    confidence: 0.75,
  };

  const arrayBufferFromString = (value: string): ArrayBuffer => {
    return new TextEncoder().encode(value).buffer;
  };

  const createImageResponse = (): Response => {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: jest.fn().mockResolvedValue(arrayBufferFromString('image-data')),
    } as unknown as Response;
  };

  const createOllamaResponse = (): Response => {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({
        model: 'gemma3:12b',
        created_at: new Date().toISOString(),
        response: JSON.stringify(sampleAnalysis),
        done: true,
      }),
    } as unknown as Response;
  };

  const createErrorResponse = (status: number, statusText: string): Response => {
    return {
      ok: false,
      status,
      statusText,
    } as unknown as Response;
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      OLLAMA_RETRY_DELAY_MS: '0',
      OLLAMA_TIMEOUT_MS: '5000',
      OLLAMA_MAX_RETRIES: '3',
      OLLAMA_API_URL: undefined,
    };

    Object.defineProperty(global, 'fetch', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (global as { fetch?: typeof fetch }).fetch;
  });

  it('возвращает разобранный ответ модели', async () => {
    const imageResponse = createImageResponse();
    const ollamaResponse = createOllamaResponse();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(imageResponse)
      .mockResolvedValueOnce(ollamaResponse);

    const service = new OllamaService();
    const result = await service.analyzeImage({ imageUrl: 'https://example.com/image.jpg' });

    expect(result).toEqual(sampleAnalysis);
    expect(imageResponse.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(ollamaResponse.json).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('повторяет скачивание изображения при сетевой ошибке', async () => {
    const imageResponse = createImageResponse();
    const ollamaResponse = createOllamaResponse();

    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(imageResponse)
      .mockResolvedValueOnce(ollamaResponse);

    const service = new OllamaService();
    const result = await service.analyzeImage({ imageUrl: 'https://example.com/image.jpg' });

    expect(result).toEqual(sampleAnalysis);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('выбрасывает информативную ошибку, если Ollama не отвечает после повторов', async () => {
    const imageResponse = createImageResponse();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(imageResponse)
      .mockResolvedValueOnce(createErrorResponse(500, 'Internal Server Error'))
      .mockResolvedValueOnce(createErrorResponse(500, 'Internal Server Error'))
      .mockResolvedValueOnce(createErrorResponse(500, 'Internal Server Error'));

    const service = new OllamaService();

    await expect(service.analyzeImage({ imageUrl: 'https://example.com/image.jpg' })).rejects.toThrow(
      'Запрос к Ollama API: 500 Internal Server Error',
    );
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('переключается на следующий хост при ошибке соединения', async () => {
    const imageResponse = createImageResponse();
    const ollamaResponse = createOllamaResponse();

    process.env.OLLAMA_API_URL = 'http://primary:11434 http://secondary:11434';
    process.env.OLLAMA_MAX_RETRIES = '1';

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(imageResponse)
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(ollamaResponse);

    const service = new OllamaService();
    const result = await service.analyzeImage({ imageUrl: 'https://example.com/image.jpg' });

    expect(result).toEqual(sampleAnalysis);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe('http://primary:11434/api/generate');
    expect((global.fetch as jest.Mock).mock.calls[2][0]).toBe('http://secondary:11434/api/generate');
  });

  it('сообщает о недоступности всех хостов', async () => {
    const imageResponse = createImageResponse();

    process.env.OLLAMA_API_URL = 'http://primary:11434,http://secondary:11434';
    process.env.OLLAMA_MAX_RETRIES = '1';

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(imageResponse)
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockRejectedValueOnce(new TypeError('fetch failed'));

    const service = new OllamaService();

    await expect(service.analyzeImage({ imageUrl: 'https://example.com/image.jpg' })).rejects.toThrow(
      'Запрос к Ollama API: все хосты недоступны (http://primary:11434, http://secondary:11434). Последняя ошибка: fetch failed',
    );
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
