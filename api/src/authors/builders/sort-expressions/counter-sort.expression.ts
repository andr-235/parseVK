import type { AuthorSortDirection } from '../../types/authors.types';
import type { ISortExpression } from './sort-expression.interface';
import { SortUtils } from './sort-utils';

export class CounterSortExpression implements ISortExpression {
  constructor(private readonly keys: string[]) {}

  build(order: AuthorSortDirection) {
    const expression = SortUtils.buildCounterValueExpression(this.keys);
    return SortUtils.applyDirection(expression, order, { nullsLast: true });
  }
}
