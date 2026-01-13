import type { PhotoAnalysisSummaryDto } from '../../photo-analysis/dto/photo-analysis-response.dto';

export class AuthorCardDto {
  id!: number;
  vkUserId!: number;
  firstName!: string;
  lastName!: string;
  fullName!: string;
  photo50!: string | null;
  photo100!: string | null;
  photo200!: string | null;
  domain!: string | null;
  screenName!: string | null;
  profileUrl!: string | null;
  city!: Record<string, unknown> | string | null;
  summary!: PhotoAnalysisSummaryDto;
  photosCount!: number | null;
  audiosCount!: number | null;
  videosCount!: number | null;
  friendsCount!: number | null;
  followersCount!: number | null;
  lastSeenAt!: string | null;
  verifiedAt!: string | null;
  isVerified!: boolean;
}

export class AuthorDetailsDto extends AuthorCardDto {
  country!: Record<string, unknown> | null;
  createdAt!: string;
  updatedAt!: string;
}

export class AuthorListDto {
  items!: AuthorCardDto[];
  total!: number;
  hasMore!: boolean;
}
