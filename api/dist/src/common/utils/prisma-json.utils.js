import { Prisma } from '../../generated/prisma/client.js';
export function toUpdateJsonValue(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return Prisma.JsonNull;
    }
    return value;
}
export function toCreateJsonValue(value) {
    if (value === undefined || value === null) {
        return Prisma.JsonNull;
    }
    return value;
}
//# sourceMappingURL=prisma-json.utils.js.map