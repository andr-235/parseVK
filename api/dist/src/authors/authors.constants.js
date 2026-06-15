export const AUTHORS_CONSTANTS = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MAX_RECURSION_DEPTH: 4,
    MILLISECONDS_THRESHOLD: 10_000_000_000,
};
export const SORTABLE_FIELDS = new Set([
    'fullName',
    'city',
    'photosCount',
    'audiosCount',
    'videosCount',
    'friendsCount',
    'followersCount',
    'lastSeenAt',
    'verifiedAt',
    'updatedAt',
]);
export const AUTHORS_REPOSITORY = Symbol('AUTHORS_REPOSITORY');
//# sourceMappingURL=authors.constants.js.map