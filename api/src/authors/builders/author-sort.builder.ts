import { Prisma } from '@prisma/client';
import type {
  AuthorSortField,
  ResolvedAuthorSort,
} from '../types/authors.types';
import { CounterSortExpression } from './sort-expressions/counter-sort.expression';
import { FollowersSortExpression } from './sort-expressions/followers-sort.expression';
import { FullNameSortExpression } from './sort-expressions/fullname-sort.expression';
import { LastSeenSortExpression } from './sort-expressions/lastseen-sort.expression';
import { SimpleSortExpression } from './sort-expressions/simple-sort.expression';
import type { ISortExpression } from './sort-expressions/sort-expression.interface';

export class AuthorSortBuilder {
  private static readonly expressions: Record<
    AuthorSortField,
    ISortExpression
  > = {
    fullName: new FullNameSortExpression(),
    photosCount: new CounterSortExpression(['photos', 'photos_count']),
    audiosCount: new CounterSortExpression(['audios', 'audio']),
    videosCount: new CounterSortExpression(['videos', 'video']),
    friendsCount: new CounterSortExpression(['friends']),
    followersCount: new FollowersSortExpression(),
    lastSeenAt: new LastSeenSortExpression(),
    verifiedAt: new SimpleSortExpression('verifiedAt', true),
    updatedAt: new SimpleSortExpression('updatedAt'),
  };

  buildOrderClause(sort: ResolvedAuthorSort): Prisma.Sql {
    const expressions: Prisma.Sql[] = [this.buildPrimarySortExpression(sort)];
    expressions.push(Prisma.sql`"Author"."updatedAt" DESC`);
    expressions.push(Prisma.sql`"Author"."id" DESC`);

    return Prisma.join(expressions, ', ');
  }

  private buildPrimarySortExpression(sort: ResolvedAuthorSort): Prisma.Sql {
    const expression =
      AuthorSortBuilder.expressions[sort.field] ??
      AuthorSortBuilder.expressions.updatedAt;
    return expression.build(sort.order);
  }
}
