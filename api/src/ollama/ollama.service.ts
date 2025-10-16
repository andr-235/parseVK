import { Injectable, Logger } from '@nestjs/common';
import type {
  OllamaAnalysisRequest,
  OllamaAnalysisResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
} from './interfaces/analysis.interface';

class HttpError extends Error {
  constructor(readonly status: number, statusText: string) {
    super(`${status} ${statusText}`.trim());
    this.name = 'HttpError';
  }
}

class OperationError extends Error {
  constructor(
    readonly description: string,
    readonly originalError: unknown,
    details: string,
  ) {
    super(`${description}: ${details}`);
    this.name = 'OperationError';
  }
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly apiUrls: string[];
  private readonly model: string;
  private readonly maxRetries: number;
  private readonly requestTimeoutMs: number;
  private readonly retryDelayMs: number;
  private readonly imageUserAgent: string;

  constructor() {
    this.apiUrls = this.parseApiUrls(process.env.OLLAMA_API_URL);
    this.model = process.env.OLLAMA_MODEL || 'gemma3:12b';
    this.maxRetries = this.parseNumber(process.env.OLLAMA_MAX_RETRIES, 3, 1);
    this.requestTimeoutMs = this.parseNumber(process.env.OLLAMA_TIMEOUT_MS, 30_000, 1);
    this.retryDelayMs = this.parseNumber(process.env.OLLAMA_RETRY_DELAY_MS, 1_000, 0);
    this.imageUserAgent = process.env.IMAGE_FETCH_USER_AGENT || 'parsevk-bot/1.0 (+https://parsevk.local)';
  }

  async analyzeImage(request: OllamaAnalysisRequest): Promise<OllamaAnalysisResponse> {
    const imageBase64 = await this.fetchImageAsBase64(request.imageUrl);
    const prompt = this.buildAnalysisPrompt(request.prompt);

    const payload: OllamaGenerateRequest = {
      model: this.model,
      prompt,
      images: [imageBase64],
      stream: false,
      format: 'json',
    };

    const data = await this.callOllamaWithFallback(payload);

    try {
      const parsed = JSON.parse(data.response) as OllamaAnalysisResponse;
      return parsed;
    } catch (error) {
      this.logger.error('Не удалось распарсить ответ Ollama как JSON', error instanceof Error ? error.stack : String(error));
      throw new Error('Некорректный формат ответа от модели');
    }
  }

  private async callOllamaWithFallback(payload: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    const description = 'Запрос к Ollama API';
    const connectivityErrors: OperationError[] = [];
    let failure: unknown;

    for (let index = 0; index < this.apiUrls.length; index += 1) {
      const baseUrl = this.apiUrls[index];
      const endpoint = this.buildGenerateUrl(baseUrl);

      try {
        return await this.fetchWithRetry<OllamaGenerateResponse>(
          endpoint,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
          description,
          async (response) => (await response.json()) as OllamaGenerateResponse,
        );
      } catch (error) {
        const hasAlternativeHost = index < this.apiUrls.length - 1;

        if (
          hasAlternativeHost &&
          error instanceof OperationError &&
          this.isRetryableError(error.originalError)
        ) {
          connectivityErrors.push(error);

          this.logger.warn(
            `${description}: хост ${baseUrl} недоступен (${this.describeError(error.originalError)}), пробуем следующий`,
          );

          continue;
        }

        failure = error;
        break;
      }
    }

    if (connectivityErrors.length) {
      const lastConnectivityError = connectivityErrors[connectivityErrors.length - 1]?.originalError;
      const primaryError =
        failure instanceof OperationError ? failure.originalError : failure ?? lastConnectivityError;
      const hostList = this.apiUrls.join(', ');
      const details = `все хосты недоступны (${hostList}). Последняя ошибка: ${this.describeError(primaryError)}`;
      throw this.createOperationError(description, primaryError ?? new Error('все хосты недоступны'), details);
    }

    if (failure) {
      throw failure;
    }

    throw this.createOperationError(description, new Error('не заданы адреса Ollama API'));
  }

  private buildAnalysisPrompt(customPrompt?: string): string {
    if (customPrompt?.trim()) {
      return customPrompt;
    }

    return `You are an expert content moderator analyzing images for potentially illegal or harmful content.

Carefully examine this image and check for the following categories:
- Violence: weapons, fighting, blood, injuries, threats
- Drugs: drug paraphernalia, drug use, drug dealing imagery
- Weapons: firearms, knives, explosives, ammunition
- NSFW: explicit sexual content, nudity
- Extremism: extremist symbols, terrorist propaganda, hate symbols
- Hate Speech: discriminatory symbols, racist imagery

Respond ONLY with valid JSON in this exact format:
{
  "hasSuspicious": boolean,
  "suspicionLevel": "none" | "low" | "medium" | "high",
  "categories": string[],
  "explanation": "Brief explanation of findings in Russian",
  "confidence": number between 0 and 1
}

Rules:
- suspicionLevel "none": no suspicious content detected
- suspicionLevel "low": minor concerns, ambiguous content
- suspicionLevel "medium": clear indicators of problematic content
- suspicionLevel "high": definite illegal or harmful content
- categories: array of detected category names (empty if none)
- confidence: your confidence in the analysis (0.0 to 1.0)
- explanation: concise reasoning in Russian (max 200 characters)

Return ONLY the JSON object, no additional text.`;
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    const arrayBuffer = await this.fetchWithRetry<ArrayBuffer>(
      imageUrl,
      {
        headers: {
          'User-Agent': this.imageUserAgent,
          Accept: 'image/*',
        },
      },
      'Загрузка изображения',
      async (response) => await response.arrayBuffer(),
      (status) => status === 429 || status >= 500,
    );

    return Buffer.from(arrayBuffer).toString('base64');
  }

  private async fetchWithRetry<T>(
    url: string,
    init: RequestInit,
    description: string,
    parser: (response: Response) => Promise<T>,
    retryableStatus: (status: number) => boolean = (status) => status >= 500,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

      try {
        const response = await fetch(url, { ...init, signal: controller.signal });

        if (!response.ok) {
          const httpError = new HttpError(response.status, response.statusText);

          if (retryableStatus(response.status) && attempt < this.maxRetries) {
            this.logger.warn(
              `${description}: ${httpError.message}. Повторная попытка ${attempt + 1}/${this.maxRetries}`,
            );
            await this.delay(attempt);
            continue;
          }

          throw httpError;
        }

        return await parser(response);
      } catch (error) {
        lastError = error;

        if (attempt >= this.maxRetries || !this.isRetryableError(error)) {
          const finalError = this.createOperationError(description, error);
          this.logger.error(finalError.message, error instanceof Error ? error.stack : undefined);
          throw finalError;
        }

        this.logger.warn(
          `${description}: ${this.describeError(error)}. Повторная попытка ${attempt + 1}/${this.maxRetries}`,
        );
        await this.delay(attempt);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw this.createOperationError(description, lastError);
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof HttpError) {
      return error.status >= 500 || error.status === 429;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return true;
      }

      const message = error.message?.toLowerCase?.() ?? '';
      return (
        message.includes('fetch failed') ||
        message.includes('econnreset') ||
        message.includes('econnrefused') ||
        message.includes('timeout') ||
        message.includes('socket') ||
        message.includes('temporarily unavailable')
      );
    }

    return false;
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpError) {
      return error.message;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return 'превышен таймаут ожидания ответа';
      }

      return error.message;
    }

    return String(error);
  }

  private createOperationError(description: string, error: unknown, detailsOverride?: string): OperationError {
    const details = detailsOverride ?? this.describeError(error);
    return new OperationError(description, error, details);
  }

  private async delay(attempt: number): Promise<void> {
    const delayMs = this.retryDelayMs * attempt;

    if (delayMs <= 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private parseApiUrls(raw: string | undefined): string[] {
    const fallback = 'http://ollama:11434';

    if (!raw?.trim()) {
      return [fallback];
    }

    const urls = raw
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => this.normalizeBaseUrl(value));

    const unique = Array.from(new Set(urls));

    return unique.length > 0 ? unique : [fallback];
  }

  private normalizeBaseUrl(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) {
      return trimmed;
    }

    return trimmed.replace(/\/+$/, '');
  }

  private buildGenerateUrl(baseUrl: string): string {
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return new URL('api/generate', normalizedBase).toString();
  }

  private parseNumber(raw: string | undefined, defaultValue: number, minValue: number): number {
    if (!raw) {
      return defaultValue;
    }

    const parsed = Number.parseInt(raw, 10);

    if (Number.isNaN(parsed) || parsed < minValue) {
      return defaultValue;
    }

    return parsed;
  }
}
