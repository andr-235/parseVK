import type { RealEstateSyncResultDto } from './real-estate-sync-result.dto';

export interface RealEstateDailyCollectResultDto {
  avito: RealEstateSyncResultDto;
  youla: RealEstateSyncResultDto;
}
