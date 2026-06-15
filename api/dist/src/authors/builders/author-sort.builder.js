import { Prisma } from '../../generated/prisma/client.js';
import { CounterSortExpression } from './sort-expressions/counter-sort.expression.js';
import { CitySortExpression } from './sort-expressions/city-sort.expression.js';
import { FollowersSortExpression } from './sort-expressions/followers-sort.expression.js';
import { FullNameSortExpression } from './sort-expressions/fullname-sort.expression.js';
import { LastSeenSortExpression } from './sort-expressions/lastseen-sort.expression.js';
import { SimpleSortExpression } from './sort-expressions/simple-sort.expression.js';
export class AuthorSortBuilder {
    static TIE_BREAKERS = [
        Prisma.sql `"Author"."updatedAt" DESC`,
        Prisma.sql `"Author"."id" DESC`,
    ];
    static expressions = {
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
    buildOrderClause(sort) {
        const expressions = [
            this.buildPrimarySortExpression(sort),
            ...AuthorSortBuilder.TIE_BREAKERS,
        ];
        return Prisma.join(expressions, ', ');
    }
    buildPrimarySortExpression(sort) {
        const expression = AuthorSortBuilder.expressions[sort.field] ??
            AuthorSortBuilder.expressions.updatedAt;
        return (expression ?? new SimpleSortExpression('updatedAt')).build(sort.order);
    }
}
//# sourceMappingURL=author-sort.builder.js.map