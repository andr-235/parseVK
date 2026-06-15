import { TgmbasePrismaService } from '../tgmbase-prisma/tgmbase-prisma.service.js';
import { TgmbaseSearchMapper } from './mappers/tgmbase-search.mapper.js';
import type { TgmbaseSearchRequestDto } from './dto/tgmbase-search-request.dto.js';
import type { TgmbaseSearchResponseDto } from './dto/tgmbase-search-response.dto.js';
import { TgmbaseSearchGateway } from './tgmbase-search.gateway.js';
export declare class TgmbaseSearchService {
    private readonly prisma;
    private readonly mapper;
    private readonly gateway?;
    private readonly logger;
    constructor(prisma: TgmbasePrismaService, mapper: TgmbaseSearchMapper, gateway?: TgmbaseSearchGateway | undefined);
    search(payload: TgmbaseSearchRequestDto): Promise<TgmbaseSearchResponseDto>;
    private searchSingle;
    private findMatchingUsers;
    private buildPhoneVariants;
    private chunkQueries;
    private broadcastProgress;
    private findPeersForUser;
    private findContacts;
    private findMessages;
    private createBaseItem;
    private buildSummary;
}
