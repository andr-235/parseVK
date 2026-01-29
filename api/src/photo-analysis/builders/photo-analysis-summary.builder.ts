import type {
  PhotoAnalysisItemDto,
  PhotoAnalysisSummaryDto,
  PhotoSuspicionLevel,
} from '../dto/photo-analysis-response.dto.js';

const KNOWN_CATEGORIES = [
  'violence',
  'drugs',
  'weapons',
  'nsfw',
  'extremism',
  'hate speech',
] as const;

export class PhotoAnalysisSummaryBuilder {
  private items: PhotoAnalysisItemDto[] = [];

  addItem(item: PhotoAnalysisItemDto): this {
    this.items.push(item);
    return this;
  }

  addItems(items: PhotoAnalysisItemDto[]): this {
    this.items.push(...items);
    return this;
  }

  build(): PhotoAnalysisSummaryDto {
    const categories = new Map<string, number>();
    const levelOrder: PhotoSuspicionLevel[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];
    const levelCounts = new Map<PhotoSuspicionLevel, number>(
      levelOrder.map((level) => [level, 0] as [PhotoSuspicionLevel, number]),
    );

    let lastAnalyzedAt: string | null = null;
    let suspicious = 0;

    for (const item of this.items) {
      levelCounts.set(
        item.suspicionLevel,
        (levelCounts.get(item.suspicionLevel) ?? 0) + 1,
      );

      if (item.hasSuspicious) {
        suspicious += 1;
      }

      if (
        !lastAnalyzedAt ||
        new Date(item.analyzedAt) > new Date(lastAnalyzedAt)
      ) {
        lastAnalyzedAt = item.analyzedAt;
      }

      for (const rawCategory of item.categories ?? []) {
        const key = rawCategory.trim().toLowerCase();

        if (!key) {
          continue;
        }

        categories.set(key, (categories.get(key) ?? 0) + 1);
      }
    }

    const knownOrder = new Map<string, number>(
      KNOWN_CATEGORIES.map((category, index) => [category, index]),
    );

    for (const category of KNOWN_CATEGORIES) {
      if (!categories.has(category)) {
        categories.set(category, 0);
      }
    }

    const categoryList = Array.from(categories.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count;
        }

        const aOrder = knownOrder.get(a.name) ?? Number.POSITIVE_INFINITY;
        const bOrder = knownOrder.get(b.name) ?? Number.POSITIVE_INFINITY;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.name.localeCompare(b.name);
      });

    return {
      total: this.items.length,
      suspicious,
      lastAnalyzedAt,
      categories: categoryList,
      levels: levelOrder.map((level) => ({
        level,
        count: levelCounts.get(level) ?? 0,
      })),
    };
  }

  reset(): this {
    this.items = [];
    return this;
  }
}
