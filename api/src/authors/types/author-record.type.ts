import type { Prisma } from '../../generated/prisma/client.js';

export type AuthorRecord = {
  id: number;
  vkUserId: number;
  firstName: string;
  lastName: string;
  photo50: string | null;
  photo100: string | null;
  photo200Orig: string | null;
  domain: string | null;
  screenName: string | null;

  counters: Prisma.JsonValue;
  followersCount: number | null;
  lastSeen: Prisma.JsonValue;
  verifiedAt: Date | null;
  city: Prisma.JsonValue;
  homeTown: string | null;
  country: Prisma.JsonValue;

  createdAt: Date;
  updatedAt: Date;
};
