import type { WatchlistAuthorWithRelations } from '../interfaces/watchlist-repository.interface.js';
import type { WatchlistAuthorCardDto, WatchlistAuthorProfileDto, WatchlistCommentDto } from '../dto/watchlist-author.dto.js';
import type { PhotoAnalysisSummaryDto } from '../../photo-analysis/dto/photo-analysis-response.dto.js';
export declare class WatchlistAuthorMapper {
    mapAuthor(record: WatchlistAuthorWithRelations, commentsCount: number, summary: PhotoAnalysisSummaryDto): WatchlistAuthorCardDto;
    mapProfile(record: WatchlistAuthorWithRelations): WatchlistAuthorProfileDto;
    mapComment(comment: {
        id: number;
        ownerId: number;
        postId: number;
        vkCommentId: number;
        text: string | null;
        publishedAt: Date | null;
        createdAt: Date;
        source: string;
    }): WatchlistCommentDto;
    buildCommentUrl(ownerId: number, postId: number, vkCommentId: number | null): string | null;
}
