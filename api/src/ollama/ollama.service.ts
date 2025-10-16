import { Injectable, Logger } from '@nestjs/common';
import type {
  OllamaAnalysisRequest,
  OllamaAnalysisResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
} from './interfaces/analysis.interface';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly apiUrl: string;
  private readonly model: string;

  constructor() {
    this.apiUrl = process.env.OLLAMA_API_URL || 'http://ollama:11434';
    this.model = process.env.OLLAMA_MODEL || 'gemma3:12b';
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

    const response = await fetch(`${this.apiUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = `Ollama API error: ${response.status} ${response.statusText}`;
      this.logger.error(message);
      throw new Error(message);
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    try {
      const parsed = JSON.parse(data.response) as OllamaAnalysisResponse;
      return parsed;
    } catch (error) {
      this.logger.error('Не удалось распарсить ответ Ollama как JSON', error instanceof Error ? error.stack : String(error));
      throw new Error('Некорректный формат ответа от модели');
    }
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
    const response = await fetch(imageUrl);

    if (!response.ok) {
      const message = `Не удалось скачать изображение: ${response.status} ${response.statusText}`;
      this.logger.error(message);
      throw new Error(message);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString('base64');
  }
}
