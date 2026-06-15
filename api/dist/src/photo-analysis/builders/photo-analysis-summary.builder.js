const KNOWN_CATEGORIES = [
    'violence',
    'drugs',
    'weapons',
    'nsfw',
    'extremism',
    'hate speech',
];
export class PhotoAnalysisSummaryBuilder {
    items = [];
    addItem(item) {
        this.items.push(item);
        return this;
    }
    addItems(items) {
        this.items.push(...items);
        return this;
    }
    build() {
        const categories = new Map();
        const levelOrder = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];
        const levelCounts = new Map(levelOrder.map((level) => [level, 0]));
        let lastAnalyzedAt = null;
        let suspicious = 0;
        for (const item of this.items) {
            levelCounts.set(item.suspicionLevel, (levelCounts.get(item.suspicionLevel) ?? 0) + 1);
            if (item.hasSuspicious) {
                suspicious += 1;
            }
            if (!lastAnalyzedAt ||
                new Date(item.analyzedAt) > new Date(lastAnalyzedAt)) {
                lastAnalyzedAt = item.analyzedAt;
            }
            for (const rawCategory of item.categories ?? []) {
                const key = rawCategory.trim().toLowerCase();
                if (!key) {
                    continue;
                }
                categories.set(key, (categories.get(key) ?? 0) + 1);
            }
        }
        const knownOrder = new Map(KNOWN_CATEGORIES.map((category, index) => [category, index]));
        for (const category of KNOWN_CATEGORIES) {
            if (!categories.has(category)) {
                categories.set(category, 0);
            }
        }
        const categoryList = Array.from(categories.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => {
            if (a.count !== b.count) {
                return b.count - a.count;
            }
            const aOrder = knownOrder.get(a.name) ?? Number.POSITIVE_INFINITY;
            const bOrder = knownOrder.get(b.name) ?? Number.POSITIVE_INFINITY;
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            return a.name.localeCompare(b.name);
        });
        return {
            total: this.items.length,
            suspicious,
            lastAnalyzedAt,
            categories: categoryList,
            levels: levelOrder.map((level) => ({
                level,
                count: levelCounts.get(level) ?? 0,
            })),
        };
    }
    reset() {
        this.items = [];
        return this;
    }
}
//# sourceMappingURL=photo-analysis-summary.builder.js.map