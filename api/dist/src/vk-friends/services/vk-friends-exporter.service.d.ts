import type { FriendFlatDto } from '../dto/vk-friends.dto.js';
export declare class VkFriendsExporterService {
    writeXlsxFile(jobId: string, rows: FriendFlatDto[]): Promise<string>;
    private formatCell;
}
