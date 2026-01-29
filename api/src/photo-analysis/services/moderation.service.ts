import { Inject, Injectable } from '@nestjs/common';
import type {
  IModerationService,
  IModerationStrategy,
  IModerationAdapter,
  ModerationResult,
} from '../interfaces/moderation-service.interface.js';

@Injectable()
export class ModerationService implements IModerationService {
  constructor(
    @Inject('IModerationStrategy')
    private readonly strategy: IModerationStrategy,
    @Inject('IModerationAdapter')
    private readonly adapter: IModerationAdapter,
  ) {}

  async moderatePhotos(imageUrls: string[]): Promise<ModerationResult[]> {
    const rawResults = await this.strategy.moderate(imageUrls);

    const results: ModerationResult[] = [];
    for (let index = 0; index < imageUrls.length; index++) {
      const url = imageUrls[index];
      const raw = rawResults[index];

      if (raw === undefined) {
        throw new Error(
          `Отсутствует результат модерации для изображения ${url}`,
        );
      }

      const photo = {
        photoVkId: `temp_${index}`,
        url,
      };

      const result = this.adapter.adapt(raw, photo);
      results.push(result);
    }

    return results;
  }
}
