export function jwtAccessConfigFactory(configService) {
    const secret = configService.get('jwtAccessSecret', { infer: true });
    if (!secret)
        throw new Error('JWT access secret is not configured');
    const expiresInMinutes = configService.get('jwtAccessExpiresInMinutes', { infer: true }) ?? 15;
    const expiresInSeconds = Math.max(1, expiresInMinutes) * 60;
    return {
        secret,
        signOptions: {
            expiresIn: expiresInSeconds,
        },
    };
}
//# sourceMappingURL=jwt.config.js.map