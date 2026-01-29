import { Prisma } from '../../generated/prisma/client.js';
import type {
  AuthorSortField,
  ResolvedAuthorSort,
  SqlFragment,
} from '../types/authors.types.js';
import { CounterSortExpression } from './sort-expressions/counter-sort.expression.js';
import { CitySortExpression } from './sort-expressions/city-sort.expression.js';
import { FollowersSortExpression } from './sort-expressions/followers-sort.expression.js';
import { FullNameSortExpression } from './sort-expressions/fullname-sort.expression.js';
import { LastSeenSortExpression } from './sort-expressions/lastseen-sort.expression.js';
import { SimpleSortExpression } from './sort-expressions/simple-sort.expression.js';
import type { ISortExpression } from './sort-expressions/sort-expression.interface.js';

export class AuthorSortBuilder {
  private static readonly TIE_BREAKERS: Prisma.Sql[] = [
    Prisma.sql`"Author"."updatedAt" DESC`,
    Prisma.sql`"Author"."id" DESC`,
  ];

  // Partial — чтобы fallback имел смысл, если поле появится, а мапу забудут обновить
  private static readonly expressions: Partial<
    Record<AuthorSortField, ISortExpression>
  > = {
    fullName: new FullNameSortExpression(),
    city: new CitySortExpression(),
    photosCount: new CounterSortExpression(['photos', 'photos_count']),
    audiosCount: new CounterSortExpression(['audios', 'audio']),
    videosCount: new CounterSortExpression(['videos', 'video']),
    friendsCount: new CounterSortExpression(['friends']),
    followersCount: new FollowersSortExpression(),
    lastSeenAt: new LastSeenSortExpression(),
    verifiedAt: new SimpleSortExpression('verifiedAt', true),
    updatedAt: new SimpleSortExpression('updatedAt'),
  };

  buildOrderClause(sort: ResolvedAuthorSort): SqlFragment {
    const expressions: Prisma.Sql[] = [
      this.buildPrimarySortExpression(sort),
      ...AuthorSortBuilder.TIE_BREAKERS,
    ];

    return Prisma.join(expressions, ', ');
  }

  private buildPrimarySortExpression(sort: ResolvedAuthorSort): Prisma.Sql {
    const expression =
      AuthorSortBuilder.expressions[sort.field] ??
      AuthorSortBuilder.expressions.updatedAt;

    // updatedAt всегда определён в таблице выражений
    return (expression ?? new SimpleSortExpression('updatedAt')).build(
      sort.order,
    );
  }
}
