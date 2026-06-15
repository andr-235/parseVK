import type { PhotoAnalysisSummaryDto } from '../../photo-analysis/dto/photo-analysis-response.dto.js';
import { AuthorCardDto, AuthorDetailsDto } from '../dto/author.dto.js';
import type { AuthorRecord } from '../types/author-record.type.js';
export declare class AuthorMapper {
    static toCardDto(author: AuthorRecord, summary?: PhotoAnalysisSummaryDto): AuthorCardDto;
    static toDetailsDto(author: AuthorRecord, summary?: PhotoAnalysisSummaryDto): AuthorDetailsDto;
    private static buildFullName;
    private static resolvePhotosCount;
    private static resolveFollowersCount;
    private static toIsoOrNull;
    private static toObjectOrNull;
    private static resolveCity;
    private static buildProfileUrl;
    private static cloneSummary;
}
