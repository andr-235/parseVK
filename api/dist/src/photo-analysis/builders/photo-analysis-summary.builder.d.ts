import type { PhotoAnalysisItemDto, PhotoAnalysisSummaryDto } from '../dto/photo-analysis-response.dto.js';
export declare class PhotoAnalysisSummaryBuilder {
    private items;
    addItem(item: PhotoAnalysisItemDto): this;
    addItems(items: PhotoAnalysisItemDto[]): this;
    build(): PhotoAnalysisSummaryDto;
    reset(): this;
}
