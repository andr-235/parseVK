import { TgmbaseSearchService } from './tgmbase-search.service.js';
import { TgmbaseSearchRequestDto } from './dto/tgmbase-search-request.dto.js';
import type { TgmbaseSearchResponseDto } from './dto/tgmbase-search-response.dto.js';
export declare class TgmbaseSearchController {
    private readonly service;
    constructor(service: TgmbaseSearchService);
    search(payload: TgmbaseSearchRequestDto): Promise<TgmbaseSearchResponseDto>;
}
