export class BaseAnalyzePhotosCommand {
    validateCommand(command) {
        if (!command.vkUserId || command.vkUserId <= 0) {
            throw new Error('Некорректный vkUserId');
        }
    }
    normalizeOptions(options) {
        const { limit, force = false, offset = 0 } = options ?? {};
        const normalizedLimit = typeof limit === 'number' ? Math.min(Math.max(limit, 1), 200) : undefined;
        return {
            limit: normalizedLimit,
            force,
            offset: Math.max(offset, 0),
        };
    }
}
//# sourceMappingURL=analyze-photos.command.js.map