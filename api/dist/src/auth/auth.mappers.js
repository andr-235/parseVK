export const toAuthenticatedUser = (user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    isTemporaryPassword: user.isTemporaryPassword,
});
//# sourceMappingURL=auth.mappers.js.map