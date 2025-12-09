import type { Author, Prisma } from '@prisma/client';

export interface IAuthorsRepository {
  count(where?: Prisma.AuthorWhereInput): Promise<number>;
  findUnique(where: { vkUserId: number }): Promise<Author>;
  queryRaw<T = Author[]>(query: Prisma.Sql): Promise<T>;
}
