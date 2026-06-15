import type { AnalyzePhotosDto } from '../dto/analyze-photos.dto.js';
import type { PhotoAnalysisListDto } from '../dto/photo-analysis-response.dto.js';
export interface AnalyzePhotosCommand {
    vkUserId: number;
    options?: AnalyzePhotosDto;
}
export interface IAnalyzePhotosCommandHandler {
    execute(command: AnalyzePhotosCommand): Promise<PhotoAnalysisListDto>;
}
export declare abstract class BaseAnalyzePhotosCommand implements IAnalyzePhotosCommandHandler {
    abstract execute(command: AnalyzePhotosCommand): Promise<PhotoAnalysisListDto>;
    protected validateCommand(command: AnalyzePhotosCommand): void;
    protected normalizeOptions(options?: AnalyzePhotosDto): AnalyzePhotosDto;
}
