import type { AnalyzePhotosDto } from '../dto/analyze-photos.dto.js';
import type { PhotoAnalysisListDto } from '../dto/photo-analysis-response.dto.js';

export interface AnalyzePhotosCommand {
  vkUserId: number;
  options?: AnalyzePhotosDto;
}

export interface IAnalyzePhotosCommandHandler {
  execute(command: AnalyzePhotosCommand): Promise<PhotoAnalysisListDto>;
}

export abstract class BaseAnalyzePhotosCommand implements IAnalyzePhotosCommandHandler {
  abstract execute(
    command: AnalyzePhotosCommand,
  ): Promise<PhotoAnalysisListDto>;

  protected validateCommand(command: AnalyzePhotosCommand): void {
    if (!command.vkUserId || command.vkUserId <= 0) {
      throw new Error('Некорректный vkUserId');
    }
  }

  protected normalizeOptions(options?: AnalyzePhotosDto): AnalyzePhotosDto {
    const { limit, force = false, offset = 0 } = options ?? {};
    const normalizedLimit =
      typeof limit === 'number' ? Math.min(Math.max(limit, 1), 200) : undefined;

    return {
      limit: normalizedLimit,
      force,
      offset: Math.max(offset, 0),
    };
  }
}
