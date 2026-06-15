export function flattenUserInfo(user) {
    const flattened = {};
    for (const [key, value] of Object.entries(user)) {
        if (value === null || value === undefined) {
            flattened[key] = null;
            continue;
        }
        if (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean') {
            flattened[key] = value;
            continue;
        }
        if (value instanceof Date) {
            flattened[key] = value.toISOString();
            continue;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) {
                flattened[key] = '[]';
            }
            else {
                const isPrimitiveArray = value.every((item) => item === null ||
                    typeof item === 'string' ||
                    typeof item === 'number' ||
                    typeof item === 'boolean');
                if (isPrimitiveArray) {
                    flattened[key] = JSON.stringify(value);
                }
                else {
                    flattened[key] = JSON.stringify(value, null, 0);
                }
            }
            continue;
        }
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            const nested = flattenObject(value, `${key}_`);
            Object.assign(flattened, nested);
            continue;
        }
        try {
            flattened[key] = JSON.stringify(value);
        }
        catch {
            flattened[key] = `[${typeof value}]`;
        }
    }
    return flattened;
}
function flattenObject(obj, prefix, depth = 0) {
    const flattened = {};
    const MAX_DEPTH = 10;
    if (depth > MAX_DEPTH) {
        return { [prefix.slice(0, -1)]: JSON.stringify(obj, null, 0) };
    }
    for (const [key, value] of Object.entries(obj)) {
        const normalizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        const fullKey = `${prefix}${normalizedKey}`;
        if (value === null || value === undefined) {
            flattened[fullKey] = null;
            continue;
        }
        if (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean') {
            flattened[fullKey] = value;
            continue;
        }
        if (value instanceof Date) {
            flattened[fullKey] = value.toISOString();
            continue;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) {
                flattened[fullKey] = '[]';
            }
            else {
                flattened[fullKey] = JSON.stringify(value, null, 0);
            }
            continue;
        }
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            const nested = flattenObject(value, `${fullKey}_`, depth + 1);
            Object.assign(flattened, nested);
            continue;
        }
        try {
            flattened[fullKey] = JSON.stringify(value);
        }
        catch {
            flattened[fullKey] = `[${typeof value}]`;
        }
    }
    return flattened;
}
export function formatCellValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'boolean') {
        return value ? 'Да' : 'Нет';
    }
    if (typeof value === 'number') {
        return String(value);
    }
    return String(value);
}
//# sourceMappingURL=flatten-user-info.util.js.map