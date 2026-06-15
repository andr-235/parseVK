import { SortUtils } from './sort-utils.js';
export class CounterSortExpression {
    keys;
    constructor(keys) {
        this.keys = keys;
    }
    build(order) {
        const expression = SortUtils.buildCounterValueExpression(this.keys);
        return SortUtils.applyDirection(expression, order, { nullsLast: true });
    }
}
//# sourceMappingURL=counter-sort.expression.js.map