const SENSITIVE_KEYS = new Set([
    'client_secret',
    'access_token',
    'refresh_token',
    'private_key',
]);

export function mask(value, left = 6, right = 4) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.length <= left + right) {
        return `${str.slice(0, 1)}...`;
    }
    return `${str.slice(0, left)}...${str.slice(-right)}`;
}

function formatValue(key, value) {
    if (value === null || value === undefined) return null;
    const lowerKey = String(key).toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) return null;

    if (
        lowerKey === 'token_len' ||
        lowerKey.endsWith('token_length') ||
        lowerKey.endsWith('tokenlen')
    ) {
        return String(value);
    }

    if (
        lowerKey.includes('token') ||
        lowerKey.includes('code') ||
        lowerKey.includes('state') ||
        lowerKey.includes('client_id')
    ) {
        return mask(value);
    }

    return String(value);
}

export function logStep(stepNumber, message, metaObject = {}, requestId = null) {
    const metaEntries = Object.entries(metaObject)
        .map(([key, value]) => {
            const safe = formatValue(key, value);
            if (safe === null || safe === '') return null;
            return `${key}=${safe}`;
        })
        .filter(Boolean);

    const suffix = metaEntries.length ? ` | ${metaEntries.join(' ')}` : '';
    const rid = requestId ? `[RID=${requestId}]` : '';
    console.log(`${rid}[OAUTH][${stepNumber}] ${message}${suffix}`);
}

export function logBlock(titleLine, kvObject = {}, requestId = null) {
    const rid = requestId ? `[RID=${requestId}]` : '';
    console.log(`${rid}[OAUTH2] ${titleLine}`);
    Object.entries(kvObject).forEach(([key, value]) => {
        const safe = formatValue(key, value);
        if (safe === null || safe === '') return;
        console.log(`  ${key} : ${safe}`);
    });
}
