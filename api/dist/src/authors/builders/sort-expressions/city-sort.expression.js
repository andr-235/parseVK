import { Prisma } from '../../../generated/prisma/client.js';
import { SortUtils } from './sort-utils.js';
export class CitySortExpression {
    build(order) {
        const cityFromJson = Prisma.sql `
      CASE
        WHEN "Author"."city" IS NULL THEN NULL
        WHEN jsonb_typeof("Author"."city") = 'object' THEN
          NULLIF(TRIM(COALESCE("Author"."city"->>'title', "Author"."city"->>'name')), '')
        WHEN jsonb_typeof("Author"."city") = 'string' THEN
          NULLIF(TRIM(BOTH '"' FROM ("Author"."city")::text), '')
        ELSE NULL
      END
    `;
        const cityValue = Prisma.sql `
      COALESCE(
        ${cityFromJson},
        NULLIF(TRIM("Author"."homeTown"), '')
      )
    `;
        const normalized = Prisma.sql `LOWER(${cityValue})`;
        return SortUtils.applyDirection(normalized, order, { nullsLast: true });
    }
}
//# sourceMappingURL=city-sort.expression.js.map