export function buildParams(dto, overrides) {
    return {
        fid: overrides?.fid ?? dto.fid,
        offset: overrides?.offset ?? dto.offset,
        limit: overrides?.limit ?? dto.limit,
    };
}
//# sourceMappingURL=ok-friends-params.util.js.map