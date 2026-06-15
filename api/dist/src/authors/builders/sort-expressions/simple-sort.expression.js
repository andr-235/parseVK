import { Prisma } from '../../../generated/prisma/client.js';
import { SortUtils } from './sort-utils.js';
const AUTHOR_COLUMN_SQL = {
    verifiedAt: Prisma.sql `"Author"."verifiedAt"`,
    updatedAt: Prisma.sql `"Author"."updatedAt"`,
};
export class SimpleSortExpression {
    column;
    nullsLast;
    constructor(column, nullsLast = false) {
        this.column = column;
        this.nullsLast = nullsLast;
    }
    build(order) {
        const expression = AUTHOR_COLUMN_SQL[this.column];
        return SortUtils.applyDirection(expression, order, {
            nullsLast: this.nullsLast,
        });
    }
}
//# sourceMappingURL=simple-sort.expression.js.map