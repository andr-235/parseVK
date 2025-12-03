import { Injectable } from '@nestjs/common';
import type {
  IModerationAdapter,
  ModerationResult,
} from '../interfaces/moderation-service.interface';

interface PhotoForModeration {
  photoVkId: string;
  url: string;
}

@Injectable()
export class WebhookModerationAdapter implements IModerationAdapter {
  adapt(rawResponse: unknown, photo: PhotoForModeration): ModerationResult {
    if (!rawResponse || typeof rawResponse !== 'object') {
      throw new Error(
        `Некорректный ответ модерации для фото ${photo.photoVkId}`,
      );
    }

    const payload = rawResponse as Record<string, unknown>;

    const categories: string[] = [];
    this.collectCategory(categories, payload.category);
    this.collectCategory(categories, payload.subcategory);

    const explanation =
      typeof payload.description === 'string' &&
      payload.description.trim().length > 0
        ? payload.description.trim()
        : null;

    const confidence = this.extractConfidence(payload);
    const hasSuspicious = Boolean(payload.is_illegal);

    return {
      photoVkId: photo.photoVkId,
      photoUrl: photo.url,
      hasSuspicious,
      categories,
      explanation,
      confidence,
      rawResponse: rawResponse,
    };
  }

  private collectCategory(target: string[], value: unknown): void {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => this.collectCategory(target, item));
      return;
    }

    if (typeof value === 'string') {
      const normalized = value.trim();

      if (normalized.length > 0) {
        target.push(normalized);
      }
    }
  }

  private extractConfidence(payload: Record<string, unknown>): number | null {
    const pct = this.toNumber(payload.confidencePct);

    if (pct !== null) {
      return this.normalizeConfidence(pct);
    }

    const rawConfidence = this.toNumber(payload.confidence);

    if (rawConfidence === null) {
      return null;
    }

    if (rawConfidence <= 1) {
      return this.normalizeConfidence(rawConfidence * 100);
    }

    return this.normalizeConfidence(rawConfidence);
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);

      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private normalizeConfidence(value: number): number {
    if (!Number.isFinite(value)) {
      return value;
    }

    if (value < 0) {
      return 0;
    }

    if (value > 100) {
      return 100;
    }

    return Number(value.toFixed(2));
  }
}
