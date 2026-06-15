export function getBoolMetadata(reflector, key, context) {
    return (reflector.getAllAndOverride(key, [
        context.getHandler(),
        context.getClass(),
    ]) ?? false);
}
//# sourceMappingURL=auth.utils.js.map