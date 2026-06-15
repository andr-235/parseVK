import { PrismaService } from '../../prisma.service.js';
import { VkService } from '../../vk/vk.service.js';
export declare class AuthorsSaverService {
    private readonly prisma;
    private readonly vkService;
    private readonly logger;
    constructor(prisma: PrismaService, vkService: VkService);
    refreshAllAuthors(batchSize?: number): Promise<number>;
    saveAuthors(userIds: number[]): Promise<number>;
    private buildAuthorBaseFields;
    private buildAuthorUpdateData;
    private buildAuthorCreateData;
}
