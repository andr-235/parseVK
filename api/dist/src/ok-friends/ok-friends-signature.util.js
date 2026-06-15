import { createHash } from 'crypto';
export function signOkRequest(params, accessToken, appSecretKey) {
    const stringParams = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            stringParams[key] = String(value);
        }
    }
    delete stringParams.access_token;
    delete stringParams.session_key;
    const sortedKeys = Object.keys(stringParams).sort();
    const queryString = sortedKeys
        .map((key) => `${key}=${stringParams[key]}`)
        .join('');
    const sessionSecretKey = createHash('md5')
        .update(accessToken + appSecretKey)
        .digest('hex')
        .toLowerCase();
    const sig = createHash('md5')
        .update(queryString + sessionSecretKey)
        .digest('hex')
        .toLowerCase();
    return sig;
}
export function signOkRequestForUsersGetInfo(params, accessToken, appSecretKey) {
    const stringParams = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            stringParams[key] = String(value);
        }
    }
    delete stringParams.access_token;
    const sortedKeys = Object.keys(stringParams).sort();
    const queryString = sortedKeys
        .map((key) => `${key}=${stringParams[key]}`)
        .join('');
    const sessionSecretKey = createHash('md5')
        .update(accessToken + appSecretKey)
        .digest('hex')
        .toLowerCase();
    const sig = createHash('md5')
        .update(queryString + sessionSecretKey)
        .digest('hex')
        .toLowerCase();
    return sig;
}
//# sourceMappingURL=ok-friends-signature.util.js.map