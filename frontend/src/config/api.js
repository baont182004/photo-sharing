// src/config/api.js
import { API_PATHS } from "./apiPaths";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const AUTH_EVENT = 'authchange';
let authUser = null;

try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (stored && stored._id) authUser = stored;
} catch {
}

// ===== Auth storage =====
export function getToken() {
    return null;
}

export function getUser() {
    return authUser;
}

export function setAuth({ token, user }) {
    if (user) {
        const safeUser = {
            _id: user._id,
            login_name: user.login_name,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
        };
        authUser = safeUser;
        try {
            localStorage.setItem('user', JSON.stringify(safeUser));
        } catch {
        }
    }
    window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuth() {
    authUser = null;
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    } catch {
    }
    window.dispatchEvent(new Event(AUTH_EVENT));
}

export async function refreshMe() {
    try {
        const me = await api.get(API_PATHS.user.me());
        if (me) setAuth({ user: me });
        return me;
    } catch {
        return null;
    }
}

// ===== Helpers =====
async function parseResponse(res, fallbackMessage = 'API error') {
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await res.json().catch(() => null)
        : await res.text().catch(() => '');

    if (!res.ok) {
        const msg =
            (data && (data.message || data.error)) ||
            (typeof data === 'string' && data) ||
            fallbackMessage;
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }

    return data;
}

function authHeaders(hasBody = false) {
    const token = getToken();
    const csrfToken = document.cookie
        .split('; ')
        .find((c) => c.startsWith('csrf_token='))
        ?.split('=')[1];

    return {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'x-csrf-token': decodeURIComponent(csrfToken) } : {}),
    };
}

// ===== Request helper =====
async function request(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: authHeaders(!!body),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    });
    return parseResponse(res);
}

// ===== Public API =====
export const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    del: (path) => request(path, { method: 'DELETE' }),
};

// ===== Utils =====
export function imageUrl(value) {
    return value || '';
}

// ===== Uploads =====
export async function uploadPhoto(file, description = '') {
    const token = getToken();
    const form = new FormData();
    form.append('uploadedphoto', file);
    if (description) form.append('description', description);

    const csrfToken = document.cookie
        .split('; ')
        .find((c) => c.startsWith('csrf_token='))
        ?.split('=')[1];

    const res = await fetch(`${API_URL}${API_PATHS.photos.create()}`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(csrfToken
                ? { 'x-csrf-token': decodeURIComponent(csrfToken) }
                : {}),
        },
        body: form,
        credentials: 'include',
    });

    return parseResponse(res, 'Upload failed');
}

export { API_URL };
