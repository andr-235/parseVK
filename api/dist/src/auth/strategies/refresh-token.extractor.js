function asNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0 ? value : null;
}
export const refreshTokenExtractor = (req) => {
    const cookieToken = asNonEmptyString(req.cookies?.refreshToken);
    if (cookieToken)
        return cookieToken;
    const header = req.headers['x-refresh-token'];
    if (Array.isArray(header)) {
        const headerToken = asNonEmptyString(header[0]);
        if (headerToken)
            return headerToken;
    }
    else {
        const headerToken = asNonEmptyString(header);
        if (headerToken)
            return headerToken;
    }
    const body = req.body;
    if (body && typeof body === 'object') {
        const token = asNonEmptyString(body.refreshToken);
        if (token)
            return token;
    }
    return null;
};
//# sourceMappingURL=refresh-token.extractor.js.map