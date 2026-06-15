export function isNullish(value) {
    return value === null || value === undefined;
}
export function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
export function isString(value) {
    return typeof value === 'string';
}
export function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function isValidObject(value) {
    return (value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        !Array.isArray(value));
}
//# sourceMappingURL=parser-utils.js.map