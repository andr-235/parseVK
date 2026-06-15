export function authThrottlerConfigFactory(configService) {
    const ttl = configService.get('authLoginRateLimitTtlSeconds', { infer: true }) ?? 60;
    const limit = configService.get('authLoginRateLimitMaxAttempts', { infer: true }) ?? 5;
    return [{ ttl: Math.max(1, ttl), limit: Math.max(1, limit) }];
}
//# sourceMappingURL=throttler.config.js.map