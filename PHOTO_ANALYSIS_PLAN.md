# План интеграции Ollama gemma3:12b для анализа фото авторов

## Обзор
Интеграция мультимодальной LLM модели **gemma3:12b** через Ollama для анализа фотографий пользователей VK на предмет противоправного контента.

### Основной workflow:
1. Пользователь открывает карточку автора → переход на `/authors/:id`
2. На странице деталей автора нажимает "Анализировать фото"
3. Backend получает все фото автора через VK API (vk-io)
4. Каждое фото отправляется в Ollama gemma3:12b с промптом для детектирования
5. Результаты анализа сохраняются в БД
6. Пользователь переходит к аналитике → галерея фото + результаты LLM

---

## 1. Docker Setup

### Добавить сервис Ollama в docker-compose.yml

**Вариант B: Использовать внешний Ollama (на сервере деплоя)**
Просто добавить environment variable для API:
```yaml
api:
  environment:
    OLLAMA_API_URL: ${OLLAMA_API_URL:-http://192.168.88.12:11434}
```

### Проверить наличие модели на сервере
```bash
ssh deployer@192.168.88.12 "ollama list"
```

Если gemma3:12b не установлена:
```bash
ssh deployer@192.168.88.12 "ollama pull gemma3:12b"
```

---

## 2. Database Schema (Prisma)

### Создать новую модель PhotoAnalysis

**Файл:** `api/prisma/schema.prisma`

```prisma
enum SuspicionLevel {
  NONE
  LOW
  MEDIUM
  HIGH
}

model PhotoAnalysis {
  id              Int             @id @default(autoincrement())
  authorId        Int
  author          Author          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  photoUrl        String          // URL фото из VK
  photoVkId       String          // VK photo ID (format: {owner_id}_{photo_id})
  analysisResult  String          @db.Text // JSON с полным ответом LLM
  hasSuspicious   Boolean         @default(false) // флаг подозрительного контента
  suspicionLevel  SuspicionLevel  @default(NONE) // уровень подозрительности
  categories      String[]        // категории: ["violence", "drugs", "weapons"]
  confidence      Float?          // уверенность модели (0-1)
  explanation     String?         @db.Text // текстовое объяснение от LLM
  analyzedAt      DateTime        @default(now())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([authorId, photoVkId]) // одно фото анализируется один раз
  @@index([authorId, hasSuspicious]) // для поиска подозрительных фото автора
  @@index([suspicionLevel]) // для фильтрации по уровню
  @@index([analyzedAt(sort: Desc)]) // для сортировки по времени анализа
}
```

### Обновить модель Author
```prisma
model Author {
  // ... существующие поля
  photoAnalyses    PhotoAnalysis[] // добавить связь
}
```

### Выполнить миграцию
```bash
cd api
npx prisma migrate dev --name add_photo_analysis_table
npx prisma generate
```

---

## 3. Backend - OllamaModule (новый модуль)

### Структура файлов
```
api/src/ollama/
├── ollama.module.ts
├── ollama.service.ts
├── interfaces/
│   └── analysis.interface.ts
└── dto/
    └── analysis-response.dto.ts
```

### api/src/ollama/interfaces/analysis.interface.ts
```typescript
export interface OllamaAnalysisRequest {
  imageUrl: string;
  prompt: string;
}

export interface OllamaAnalysisResponse {
  hasSuspicious: boolean;
  suspicionLevel: 'none' | 'low' | 'medium' | 'high';
  categories: string[];
  explanation: string;
  confidence: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  images?: string[]; // base64 encoded images
  stream?: boolean;
  format?: 'json';
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}
```

### api/src/ollama/ollama.service.ts
```typescript
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
  private readonly model = 'gemma3:12b';

  constructor() {
    this.apiUrl = process.env.OLLAMA_API_URL || 'http://ollama:11434';
  }

  async analyzeImage(request: OllamaAnalysisRequest): Promise<OllamaAnalysisResponse> {
    const { imageUrl, prompt } = request;

    // Скачать изображение и конвертировать в base64
    const imageBase64 = await this.fetchImageAsBase64(imageUrl);

    // Сформировать промпт для LLM
    const analysisPrompt = this.buildAnalysisPrompt(prompt);

    // Отправить запрос к Ollama
    const ollamaRequest: OllamaGenerateRequest = {
      model: this.model,
      prompt: analysisPrompt,
      images: [imageBase64],
      stream: false,
      format: 'json',
    };

    const response = await fetch(`${this.apiUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaRequest),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    // Парсинг JSON ответа от LLM
    try {
      const parsed = JSON.parse(data.response) as OllamaAnalysisResponse;
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse Ollama response as JSON', error);
      throw new Error('Invalid response format from LLM');
    }
  }

  private buildAnalysisPrompt(customPrompt?: string): string {
    const defaultPrompt = `
You are an expert content moderator analyzing images for potentially illegal or harmful content.

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
  "explanation": "Brief explanation of findings",
  "confidence": number between 0 and 1
}

Rules:
- suspicionLevel "none": no suspicious content detected
- suspicionLevel "low": minor concerns, ambiguous content
- suspicionLevel "medium": clear indicators of problematic content
- suspicionLevel "high": definite illegal or harmful content
- categories: array of detected category names (empty if none)
- confidence: your confidence in the analysis (0.0 to 1.0)
- explanation: concise reasoning for your determination (max 200 characters)

Return ONLY the JSON object, no additional text.
`;

    return customPrompt || defaultPrompt;
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  }
}
```

### api/src/ollama/ollama.module.ts
```typescript
import { Module } from '@nestjs/common';
import { OllamaService } from './ollama.service';

@Module({
  providers: [OllamaService],
  exports: [OllamaService],
})
export class OllamaModule {}
```

---

## 4. Backend - Расширение VkService

### Добавить метод getUserPhotos в api/src/vk/vk.service.ts

```typescript
export interface VkPhoto {
  id: number;
  owner_id: number;
  photo_id: string; // format: {owner_id}_{id}
  album_id: number;
  date: number;
  text?: string;
  sizes: Array<{ type: string; url: string; width: number; height: number }>;
}

async getUserPhotos(options: {
  userId: number;
  count?: number;
  offset?: number;
}): Promise<VkPhoto[]> {
  const { userId, count = 100, offset = 0 } = options;

  try {
    const response = await this.vk.api.photos.getAll({
      owner_id: userId,
      count: Math.min(count, 200),
      offset,
      extended: 0,
      photo_sizes: 1,
    });

    const items = response.items ?? [];

    return items.map((photo) => ({
      id: photo.id,
      owner_id: photo.owner_id,
      photo_id: `${photo.owner_id}_${photo.id}`,
      album_id: photo.album_id,
      date: photo.date,
      text: photo.text,
      sizes: photo.sizes ?? [],
    }));
  } catch (error) {
    if (error instanceof APIError) {
      this.logger.error(`VK API error fetching photos: ${error.message}`);
    }
    throw error;
  }
}

// Helper: получить URL максимального размера фото
getMaxPhotoSize(sizes: VkPhoto['sizes']): string | null {
  if (!sizes.length) {
    return null;
  }

  // Приоритет размеров: w > z > y > x > m > s
  const priority = ['w', 'z', 'y', 'x', 'm', 's'];

  for (const type of priority) {
    const size = sizes.find((s) => s.type === type);
    if (size) {
      return size.url;
    }
  }

  return sizes[0].url;
}
```

---

## 5. Backend - PhotoAnalysisModule (новый модуль)

### Структура файлов
```
api/src/photo-analysis/
├── photo-analysis.module.ts
├── photo-analysis.service.ts
├── photo-analysis.controller.ts
└── dto/
    ├── analyze-photos.dto.ts
    └── photo-analysis-response.dto.ts
```

### api/src/photo-analysis/dto/analyze-photos.dto.ts
```typescript
import { IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyzePhotosDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  force?: boolean = false; // пере-анализировать уже проанализированные фото
}
```

### api/src/photo-analysis/dto/photo-analysis-response.dto.ts
```typescript
export class PhotoAnalysisItemDto {
  id: number;
  authorId: number;
  photoUrl: string;
  photoVkId: string;
  hasSuspicious: boolean;
  suspicionLevel: string;
  categories: string[];
  confidence: number | null;
  explanation: string | null;
  analyzedAt: string;
}

export class PhotoAnalysisListDto {
  items: PhotoAnalysisItemDto[];
  total: number;
  suspiciousCount: number;
  analyzedCount: number;
}

export class AnalyzeProgressDto {
  status: 'processing' | 'completed' | 'failed';
  totalPhotos: number;
  processedPhotos: number;
  progress: number; // 0-1
  message?: string;
}
```

### api/src/photo-analysis/photo-analysis.service.ts
```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { VkService } from '../vk/vk.service';
import { OllamaService } from '../ollama/ollama.service';
import type { AnalyzePhotosDto } from './dto/analyze-photos.dto';
import type {
  PhotoAnalysisListDto,
  PhotoAnalysisItemDto,
} from './dto/photo-analysis-response.dto';

@Injectable()
export class PhotoAnalysisService {
  private readonly logger = new Logger(PhotoAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vkService: VkService,
    private readonly ollamaService: OllamaService,
  ) {}

  async analyzeAuthorPhotos(
    authorId: number,
    options: AnalyzePhotosDto,
  ): Promise<PhotoAnalysisListDto> {
    const { limit = 50, force = false } = options;

    // Проверить существование автора
    const author = await this.prisma.author.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID ${authorId} not found`);
    }

    // Получить фото автора из VK
    const photos = await this.vkService.getUserPhotos({
      userId: author.vkUserId,
      count: limit,
    });

    this.logger.log(
      `Fetched ${photos.length} photos for author ${authorId} (VK ID: ${author.vkUserId})`,
    );

    if (!photos.length) {
      return {
        items: [],
        total: 0,
        suspiciousCount: 0,
        analyzedCount: 0,
      };
    }

    const results: PhotoAnalysisItemDto[] = [];

    for (const photo of photos) {
      const photoUrl = this.vkService.getMaxPhotoSize(photo.sizes);
      if (!photoUrl) {
        this.logger.warn(`No photo URL found for photo ${photo.photo_id}`);
        continue;
      }

      // Проверить, было ли фото уже проанализировано
      if (!force) {
        const existing = await this.prisma.photoAnalysis.findUnique({
          where: {
            authorId_photoVkId: {
              authorId,
              photoVkId: photo.photo_id,
            },
          },
        });

        if (existing) {
          this.logger.debug(`Photo ${photo.photo_id} already analyzed, skipping`);
          results.push(this.mapPhotoAnalysis(existing));
          continue;
        }
      }

      // Анализ через Ollama
      try {
        const analysis = await this.ollamaService.analyzeImage({
          imageUrl: photoUrl,
          prompt: undefined, // использовать default prompt
        });

        // Сохранить результат в БД
        const saved = await this.prisma.photoAnalysis.upsert({
          where: {
            authorId_photoVkId: {
              authorId,
              photoVkId: photo.photo_id,
            },
          },
          update: {
            photoUrl,
            analysisResult: JSON.stringify(analysis),
            hasSuspicious: analysis.hasSuspicious,
            suspicionLevel: analysis.suspicionLevel.toUpperCase(),
            categories: analysis.categories,
            confidence: analysis.confidence,
            explanation: analysis.explanation,
            analyzedAt: new Date(),
          },
          create: {
            authorId,
            photoUrl,
            photoVkId: photo.photo_id,
            analysisResult: JSON.stringify(analysis),
            hasSuspicious: analysis.hasSuspicious,
            suspicionLevel: analysis.suspicionLevel.toUpperCase(),
            categories: analysis.categories,
            confidence: analysis.confidence,
            explanation: analysis.explanation,
          },
        });

        results.push(this.mapPhotoAnalysis(saved));
        this.logger.log(`Analyzed photo ${photo.photo_id}: ${analysis.suspicionLevel}`);
      } catch (error) {
        this.logger.error(
          `Failed to analyze photo ${photo.photo_id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    const suspiciousCount = results.filter((r) => r.hasSuspicious).length;

    return {
      items: results,
      total: results.length,
      suspiciousCount,
      analyzedCount: results.length,
    };
  }

  async getAnalysisResults(authorId: number): Promise<PhotoAnalysisListDto> {
    const analyses = await this.prisma.photoAnalysis.findMany({
      where: { authorId },
      orderBy: { analyzedAt: 'desc' },
    });

    const suspiciousCount = analyses.filter((a) => a.hasSuspicious).length;

    return {
      items: analyses.map((a) => this.mapPhotoAnalysis(a)),
      total: analyses.length,
      suspiciousCount,
      analyzedCount: analyses.length,
    };
  }

  async getSuspiciousPhotos(authorId: number): Promise<PhotoAnalysisListDto> {
    const analyses = await this.prisma.photoAnalysis.findMany({
      where: {
        authorId,
        hasSuspicious: true,
      },
      orderBy: { suspicionLevel: 'desc' },
    });

    return {
      items: analyses.map((a) => this.mapPhotoAnalysis(a)),
      total: analyses.length,
      suspiciousCount: analyses.length,
      analyzedCount: analyses.length,
    };
  }

  async deleteAnalysisResults(authorId: number): Promise<void> {
    await this.prisma.photoAnalysis.deleteMany({
      where: { authorId },
    });
  }

  private mapPhotoAnalysis(analysis: any): PhotoAnalysisItemDto {
    return {
      id: analysis.id,
      authorId: analysis.authorId,
      photoUrl: analysis.photoUrl,
      photoVkId: analysis.photoVkId,
      hasSuspicious: analysis.hasSuspicious,
      suspicionLevel: analysis.suspicionLevel,
      categories: analysis.categories,
      confidence: analysis.confidence,
      explanation: analysis.explanation,
      analyzedAt: analysis.analyzedAt.toISOString(),
    };
  }
}
```

### api/src/photo-analysis/photo-analysis.controller.ts
```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { PhotoAnalysisService } from './photo-analysis.service';
import { AnalyzePhotosDto } from './dto/analyze-photos.dto';
import type { PhotoAnalysisListDto } from './dto/photo-analysis-response.dto';

@Controller('photo-analysis')
export class PhotoAnalysisController {
  constructor(private readonly photoAnalysisService: PhotoAnalysisService) {}

  @Post('analyze/:authorId')
  async analyzeAuthorPhotos(
    @Param('authorId', ParseIntPipe) authorId: number,
    @Body() dto: AnalyzePhotosDto,
  ): Promise<PhotoAnalysisListDto> {
    return this.photoAnalysisService.analyzeAuthorPhotos(authorId, dto);
  }

  @Get(':authorId')
  async getAnalysisResults(
    @Param('authorId', ParseIntPipe) authorId: number,
  ): Promise<PhotoAnalysisListDto> {
    return this.photoAnalysisService.getAnalysisResults(authorId);
  }

  @Get(':authorId/suspicious')
  async getSuspiciousPhotos(
    @Param('authorId', ParseIntPipe) authorId: number,
  ): Promise<PhotoAnalysisListDto> {
    return this.photoAnalysisService.getSuspiciousPhotos(authorId);
  }

  @Delete(':authorId')
  async deleteAnalysisResults(
    @Param('authorId', ParseIntPipe) authorId: number,
  ): Promise<{ message: string }> {
    await this.photoAnalysisService.deleteAnalysisResults(authorId);
    return { message: 'Analysis results deleted successfully' };
  }
}
```

### api/src/photo-analysis/photo-analysis.module.ts
```typescript
import { Module } from '@nestjs/common';
import { PhotoAnalysisController } from './photo-analysis.controller';
import { PhotoAnalysisService } from './photo-analysis.service';
import { PrismaService } from '../prisma.service';
import { VkModule } from '../vk/vk.module';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
  imports: [VkModule, OllamaModule],
  controllers: [PhotoAnalysisController],
  providers: [PhotoAnalysisService, PrismaService],
  exports: [PhotoAnalysisService],
})
export class PhotoAnalysisModule {}
```

### Обновить api/src/app.module.ts
```typescript
import { PhotoAnalysisModule } from './photo-analysis/photo-analysis.module';
import { OllamaModule } from './ollama/ollama.module';

@Module({
  imports: [
    // ... существующие
    OllamaModule,
    PhotoAnalysisModule,
  ],
})
export class AppModule {}
```

---

## 6. Frontend - Types

### front/src/types/photoAnalysis.ts (новый файл)
```typescript
export type SuspicionLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'

export interface PhotoAnalysis {
  id: number
  authorId: number
  photoUrl: string
  photoVkId: string
  hasSuspicious: boolean
  suspicionLevel: SuspicionLevel
  categories: string[]
  confidence: number | null
  explanation: string | null
  analyzedAt: string
}

export interface PhotoAnalysisResponse {
  items: PhotoAnalysis[]
  total: number
  suspiciousCount: number
  analyzedCount: number
}

export interface AnalyzePhotosOptions {
  limit?: number
  force?: boolean
}
```

### Обновить front/src/types/index.ts
```typescript
export * from './photoAnalysis'
```

---

## 7. Frontend - API Service

### front/src/api/photoAnalysisApi.ts (новый файл)
```typescript
import { apiRequest } from './apiRequest'
import type {
  PhotoAnalysisResponse,
  AnalyzePhotosOptions,
} from '../types/photoAnalysis'

export const photoAnalysisApi = {
  /**
   * Запустить анализ фото автора
   */
  analyzeAuthor: async (
    authorId: number,
    options?: AnalyzePhotosOptions
  ): Promise<PhotoAnalysisResponse> => {
    return apiRequest<PhotoAnalysisResponse>({
      method: 'POST',
      url: `/photo-analysis/analyze/${authorId}`,
      body: options,
    })
  },

  /**
   * Получить все результаты анализа для автора
   */
  getResults: async (authorId: number): Promise<PhotoAnalysisResponse> => {
    return apiRequest<PhotoAnalysisResponse>({
      method: 'GET',
      url: `/photo-analysis/${authorId}`,
    })
  },

  /**
   * Получить только подозрительные фото
   */
  getSuspicious: async (authorId: number): Promise<PhotoAnalysisResponse> => {
    return apiRequest<PhotoAnalysisResponse>({
      method: 'GET',
      url: `/photo-analysis/${authorId}/suspicious`,
    })
  },

  /**
   * Удалить результаты анализа
   */
  deleteResults: async (authorId: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>({
      method: 'DELETE',
      url: `/photo-analysis/${authorId}`,
    })
  },
}
```

---

## 8. Frontend - Store

### front/src/stores/photoAnalysisStore.ts (новый файл)
```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { photoAnalysisApi } from '../api/photoAnalysisApi'
import type { PhotoAnalysis, AnalyzePhotosOptions } from '../types/photoAnalysis'

interface PhotoAnalysisState {
  // State
  analyses: PhotoAnalysis[]
  isAnalyzing: boolean
  isLoading: boolean
  total: number
  suspiciousCount: number
  analyzedCount: number
  filter: 'all' | 'suspicious'

  // Actions
  analyzeAuthor: (authorId: number, options?: AnalyzePhotosOptions) => Promise<void>
  fetchResults: (authorId: number) => Promise<void>
  fetchSuspicious: (authorId: number) => Promise<void>
  deleteResults: (authorId: number) => Promise<void>
  setFilter: (filter: 'all' | 'suspicious') => void
  clearResults: () => void
}

export const usePhotoAnalysisStore = create<PhotoAnalysisState>()(
  devtools(
    (set, get) => ({
      // Initial state
      analyses: [],
      isAnalyzing: false,
      isLoading: false,
      total: 0,
      suspiciousCount: 0,
      analyzedCount: 0,
      filter: 'all',

      // Actions
      analyzeAuthor: async (authorId, options) => {
        set({ isAnalyzing: true })
        try {
          const response = await photoAnalysisApi.analyzeAuthor(authorId, options)
          set({
            analyses: response.items,
            total: response.total,
            suspiciousCount: response.suspiciousCount,
            analyzedCount: response.analyzedCount,
            isAnalyzing: false,
          })
        } catch (error) {
          set({ isAnalyzing: false })
          throw error
        }
      },

      fetchResults: async (authorId) => {
        set({ isLoading: true })
        try {
          const response = await photoAnalysisApi.getResults(authorId)
          set({
            analyses: response.items,
            total: response.total,
            suspiciousCount: response.suspiciousCount,
            analyzedCount: response.analyzedCount,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      fetchSuspicious: async (authorId) => {
        set({ isLoading: true })
        try {
          const response = await photoAnalysisApi.getSuspicious(authorId)
          set({
            analyses: response.items,
            suspiciousCount: response.suspiciousCount,
            analyzedCount: response.analyzedCount,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      deleteResults: async (authorId) => {
        set({ isLoading: true })
        try {
          await photoAnalysisApi.deleteResults(authorId)
          set({
            analyses: [],
            total: 0,
            suspiciousCount: 0,
            analyzedCount: 0,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      setFilter: (filter) => {
        set({ filter })
      },

      clearResults: () => {
        set({
          analyses: [],
          total: 0,
          suspiciousCount: 0,
          analyzedCount: 0,
          filter: 'all',
        })
      },
    }),
    { name: 'PhotoAnalysisStore' }
  )
)
```

### Обновить front/src/stores/index.ts
```typescript
export { usePhotoAnalysisStore } from './photoAnalysisStore'
```

---

## 9. Frontend - Components

### front/src/components/SuspicionLevelBadge.tsx (новый)
```tsx
import { Badge } from '@/components/ui/badge'
import type { SuspicionLevel } from '@/types/photoAnalysis'

interface SuspicionLevelBadgeProps {
  level: SuspicionLevel
  className?: string
}

const levelConfig: Record<
  SuspicionLevel,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  NONE: { label: 'Не обнаружено', variant: 'secondary' },
  LOW: { label: 'Низкий', variant: 'outline' },
  MEDIUM: { label: 'Средний', variant: 'default' },
  HIGH: { label: 'Высокий', variant: 'destructive' },
}

export function SuspicionLevelBadge({ level, className }: SuspicionLevelBadgeProps) {
  const config = levelConfig[level]

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
```

### front/src/components/PhotoAnalysisCard.tsx (новый)
```tsx
import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SuspicionLevelBadge } from '@/components/SuspicionLevelBadge'
import type { PhotoAnalysis } from '@/types/photoAnalysis'

interface PhotoAnalysisCardProps {
  analysis: PhotoAnalysis
}

const categoryLabels: Record<string, string> = {
  violence: 'Насилие',
  drugs: 'Наркотики',
  weapons: 'Оружие',
  nsfw: 'NSFW',
  extremism: 'Экстремизм',
  'hate speech': 'Разжигание ненависти',
}

const PhotoAnalysisCardComponent = ({ analysis }: PhotoAnalysisCardProps) => {
  const analyzedDate = new Date(analysis.analyzedAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const confidencePercent = analysis.confidence ? Math.round(analysis.confidence * 100) : null

  return (
    <Card className="overflow-hidden border border-border/60 bg-background-secondary/90 shadow-soft-md">
      <div className="relative aspect-square">
        <img
          src={analysis.photoUrl}
          alt={`Photo ${analysis.photoVkId}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {analysis.hasSuspicious && (
          <div className="absolute right-2 top-2">
            <Badge variant="destructive" className="shadow-lg">
              Подозрительно
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Уровень:</span>
          <SuspicionLevelBadge level={analysis.suspicionLevel} />
        </div>

        {analysis.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {analysis.categories.map((category) => (
              <Badge key={category} variant="outline" className="text-xs">
                {categoryLabels[category.toLowerCase()] || category}
              </Badge>
            ))}
          </div>
        )}

        {analysis.explanation && (
          <p className="text-sm text-text-primary/90 rounded-lg border border-border/40 bg-background-primary/60 p-3 leading-relaxed">
            {analysis.explanation}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>{analyzedDate}</span>
          {confidencePercent && (
            <span className="font-medium">
              Уверенность: {confidencePercent}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const PhotoAnalysisCard = memo(PhotoAnalysisCardComponent)
```

---

## 10. Frontend - Pages

### front/src/pages/AuthorDetails.tsx (новый)
```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { usePhotoAnalysisStore } from '@/stores'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import toast from 'react-hot-toast'

function AuthorDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const authorId = Number(id)

  const [hasAnalysis, setHasAnalysis] = useState(false)
  const [suspiciousCount, setSuspiciousCount] = useState(0)

  const isAnalyzing = usePhotoAnalysisStore((state) => state.isAnalyzing)
  const analyzeAuthor = usePhotoAnalysisStore((state) => state.analyzeAuthor)
  const fetchResults = usePhotoAnalysisStore((state) => state.fetchResults)

  useEffect(() => {
    // Проверить, есть ли уже результаты анализа
    const checkExistingAnalysis = async () => {
      try {
        const response = await fetchResults(authorId)
        setHasAnalysis(response.total > 0)
        setSuspiciousCount(response.suspiciousCount)
      } catch (error) {
        console.error('Failed to fetch analysis results', error)
      }
    }

    checkExistingAnalysis()
  }, [authorId, fetchResults])

  const handleAnalyze = async () => {
    try {
      await analyzeAuthor(authorId, { limit: 50 })
      toast.success('Анализ фотографий завершён')
      setHasAnalysis(true)
    } catch (error) {
      console.error('Failed to analyze photos', error)
      toast.error('Не удалось проанализировать фотографии')
    }
  }

  const handleViewAnalytics = () => {
    navigate(`/authors/${authorId}/photo-analysis`)
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Детали автора"
        description="Полная информация о пользователе VK и инструменты анализа контента."
      />

      <SectionCard
        title="Анализ фотографий"
        description="Анализ фотографий автора с помощью AI на предмет противоправного контента."
      >
        <div className="flex flex-col gap-4">
          {hasAnalysis && (
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="text-base">
                Проанализировано фото
              </Badge>
              {suspiciousCount > 0 && (
                <Badge variant="destructive" className="text-base">
                  Подозрительных: {suspiciousCount}
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              variant="default"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Анализ...
                </span>
              ) : (
                'Анализировать фото'
              )}
            </Button>

            {hasAnalysis && (
              <Button onClick={handleViewAnalytics} variant="outline">
                Перейти к аналитике
              </Button>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

export default AuthorDetails
```

### front/src/pages/PhotoAnalysisResults.tsx (новый)
```tsx
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { usePhotoAnalysisStore } from '@/stores'
import { PhotoAnalysisCard } from '@/components/PhotoAnalysisCard'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import toast from 'react-hot-toast'

function PhotoAnalysisResults() {
  const { id } = useParams<{ id: string }>()
  const authorId = Number(id)

  const analyses = usePhotoAnalysisStore((state) => state.analyses)
  const isLoading = usePhotoAnalysisStore((state) => state.isLoading)
  const isAnalyzing = usePhotoAnalysisStore((state) => state.isAnalyzing)
  const total = usePhotoAnalysisStore((state) => state.total)
  const suspiciousCount = usePhotoAnalysisStore((state) => state.suspiciousCount)
  const filter = usePhotoAnalysisStore((state) => state.filter)

  const fetchResults = usePhotoAnalysisStore((state) => state.fetchResults)
  const fetchSuspicious = usePhotoAnalysisStore((state) => state.fetchSuspicious)
  const analyzeAuthor = usePhotoAnalysisStore((state) => state.analyzeAuthor)
  const setFilter = usePhotoAnalysisStore((state) => state.setFilter)
  const clearResults = usePhotoAnalysisStore((state) => state.clearResults)

  useEffect(() => {
    const load = async () => {
      try {
        if (filter === 'all') {
          await fetchResults(authorId)
        } else {
          await fetchSuspicious(authorId)
        }
      } catch (error) {
        console.error('Failed to load analysis results', error)
        toast.error('Не удалось загрузить результаты анализа')
      }
    }

    load()

    return () => {
      clearResults()
    }
  }, [authorId, filter, fetchResults, fetchSuspicious, clearResults])

  const handleReanalyze = async () => {
    try {
      await analyzeAuthor(authorId, { limit: 50, force: true })
      toast.success('Повторный анализ завершён')
    } catch (error) {
      console.error('Failed to reanalyze photos', error)
      toast.error('Не удалось повторно проанализировать фото')
    }
  }

  const heroFooter = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
          Всего: {total}
        </Badge>
        {suspiciousCount > 0 && (
          <Badge variant="destructive">
            Подозрительных: {suspiciousCount}
          </Badge>
        )}
      </div>
    ),
    [total, suspiciousCount]
  )

  const showEmptyState = !isLoading && analyses.length === 0

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Анализ фотографий"
        description="Результаты анализа фотографий автора на предмет противоправного контента с помощью AI."
        footer={heroFooter}
      />

      <SectionCard
        title="Результаты анализа"
        description="Фотографии с результатами детектирования подозрительного контента."
        headerActions={
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Все фото
            </Button>
            <Button
              variant={filter === 'suspicious' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('suspicious')}
            >
              Подозрительные
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReanalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Анализ...' : 'Повторить анализ'}
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex w-full justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : null}

        {showEmptyState && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background-primary/40 px-6 py-12 text-center text-text-secondary">
            <p className="text-lg font-medium text-text-primary">
              Результаты не найдены
            </p>
            <p className="max-w-md text-sm">
              Попробуйте запустить анализ фотографий или измените фильтр.
            </p>
          </div>
        )}

        {analyses.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {analyses.map((analysis) => (
              <PhotoAnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default PhotoAnalysisResults
```

---

## 11. Frontend - Routes

### Обновить front/src/App.tsx
```tsx
import AuthorDetails from './pages/AuthorDetails'
import PhotoAnalysisResults from './pages/PhotoAnalysisResults'

function App() {
  // ... existing code

  return (
    <BrowserRouter>
      {/* ... */}
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/comments" element={<Comments />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/keywords" element={<Keywords />} />
        <Route path="/authors" element={<Authors />} />

        {/* Новые маршруты */}
        <Route path="/authors/:id" element={<AuthorDetails />} />
        <Route path="/authors/:id/photo-analysis" element={<PhotoAnalysisResults />} />
      </Routes>
      {/* ... */}
    </BrowserRouter>
  )
}
```

---

## 12. Frontend - Модификация AuthorCard

### Обновить front/src/pages/Authors/components/AuthorCard.tsx
Добавить кнопку для перехода к деталям автора:

```tsx
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const AuthorCardComponent = ({ author }: AuthorCardProps) => {
  const navigate = useNavigate()

  const handleViewDetails = () => {
    navigate(`/authors/${author.id}`)
  }

  return (
    <Card className="...">
      {/* ... existing content ... */}

      <CardContent className="...">
        {/* ... existing fields ... */}

        {/* Добавить кнопку в конец CardContent */}
        <div className="mt-4 pt-4 border-t border-border/60">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleViewDetails}
          >
            Открыть профиль и анализ
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 13. Environment Variables

### Обновить docker-compose.yml
```yaml
api:
  environment:
    DATABASE_URL: ${DATABASE_URL:-postgresql://postgres:postgres@db:5432/vk_api?schema=public}
    VK_TOKEN: ${VK_TOKEN:-...}
    OLLAMA_API_URL: ${OLLAMA_API_URL:-http://192.168.88.12:11434}  # добавить
```

### Создать/обновить .env файл
```bash
# .env
OLLAMA_API_URL=http://192.168.88.12:11434
```

---

## 14. Deployment Checklist

### Перед деплоем:
1. ✅ Проверить, что gemma3:12b установлена на сервере:
   ```bash
   ssh deployer@192.168.88.12 "ollama list | grep gemma3"
   ```

2. ✅ Выполнить миграцию БД:
   ```bash
   cd api
   npx prisma migrate deploy
   ```

3. ✅ Пересобрать Docker образы:
   ```bash
   docker-compose build --no-cache api frontend
   ```

4. ✅ Запустить сервисы:
   ```bash
   docker-compose up -d
   ```

5. ✅ Проверить логи:
   ```bash
   docker-compose logs -f api
   ```

### Тестирование:
1. Открыть страницу `/authors`
2. Кликнуть на карточку автора
3. Нажать "Анализировать фото"
4. Дождаться завершения анализа
5. Перейти к аналитике
6. Проверить результаты и фильтры

---

## 15. Дополнительные улучшения (опционально)

### Асинхронная обработка через BullMQ
Если анализ занимает много времени, можно вынести в фоновую очередь:
- Создать `PhotoAnalysisQueue`
- Процессор задач для анализа фото
- WebSocket для обновления прогресса в реальном времени

### Кэширование результатов
- Добавить Redis кэш для результатов анализа
- TTL = 7 дней для уже проанализированных фото

### Расширенная аналитика
- Добавить графики распределения по категориям
- Временная шкала активности (когда были загружены подозрительные фото)
- Экспорт отчета в PDF/CSV

### Batch анализ
- Анализ фото нескольких авторов одновременно
- Массовый анализ из watchlist

---

## Итоговая структура проекта

```
parseVK/
├── api/
│   ├── src/
│   │   ├── ollama/                    # NEW
│   │   │   ├── ollama.module.ts
│   │   │   ├── ollama.service.ts
│   │   │   └── interfaces/
│   │   │       └── analysis.interface.ts
│   │   ├── photo-analysis/            # NEW
│   │   │   ├── photo-analysis.module.ts
│   │   │   ├── photo-analysis.service.ts
│   │   │   ├── photo-analysis.controller.ts
│   │   │   └── dto/
│   │   ├── vk/                        # MODIFIED
│   │   │   └── vk.service.ts          # добавить getUserPhotos()
│   │   └── app.module.ts              # MODIFIED
│   └── prisma/
│       └── schema.prisma              # MODIFIED
├── front/
│   └── src/
│       ├── api/
│       │   └── photoAnalysisApi.ts    # NEW
│       ├── components/
│       │   ├── PhotoAnalysisCard.tsx  # NEW
│       │   └── SuspicionLevelBadge.tsx # NEW
│       ├── pages/
│       │   ├── AuthorDetails.tsx      # NEW
│       │   ├── PhotoAnalysisResults.tsx # NEW
│       │   └── Authors/
│       │       └── components/
│       │           └── AuthorCard.tsx # MODIFIED
│       ├── stores/
│       │   ├── photoAnalysisStore.ts  # NEW
│       │   └── index.ts               # MODIFIED
│       ├── types/
│       │   ├── photoAnalysis.ts       # NEW
│       │   └── index.ts               # MODIFIED
│       └── App.tsx                    # MODIFIED
├── docker-compose.yml                 # MODIFIED
└── PHOTO_ANALYSIS_PLAN.md             # THIS FILE
```

---

## Примерный промпт для LLM (финальная версия)

```
You are an expert content moderator analyzing images for potentially illegal or harmful content.

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

Return ONLY the JSON object, no additional text.
```

---

## Контакты и поддержка

Если возникнут вопросы или проблемы при реализации:
1. Проверить логи API: `docker-compose logs -f api`
2. Проверить статус Ollama: `ssh deployer@192.168.88.12 "ollama list"`
3. Проверить статус БД: `docker-compose exec db psql -U postgres -d vk_api -c "\dt"`

**Удачи в реализации!**
