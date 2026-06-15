import { Prisma } from '../../../generated/prisma/client.js';
import { SortUtils } from './sort-utils.js';
export class FullNameSortExpression {
    build(order) {
        const expressions = [
            SortUtils.applyDirection(Prisma.sql `LOWER("Author"."lastName")`, order),
            SortUtils.applyDirection(Prisma.sql `LOWER("Author"."firstName")`, order),
            SortUtils.applyDirection(Prisma.sql `"Author"."vkUserId"`, order),
        ];
        return Prisma.join(expressions, ', ');
    }
}
//# sourceMappingURL=fullname-sort.expression.js.map