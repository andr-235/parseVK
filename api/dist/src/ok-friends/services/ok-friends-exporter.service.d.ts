import type { FriendFlatDto } from '../dto/ok-friends.dto.js';
export declare class OkFriendsExporterService {
    writeXlsxFile(jobId: string, rows: FriendFlatDto[]): Promise<string>;
}
