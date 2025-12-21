// src/config/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const AUTH_EVENT = 'authchange';

// ===== Auth storage =====
export function getToken() {
    return localStorage.getItem('token');
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
}

export function setAuth({ token, user }) {
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event(AUTH_EVENT));
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
    return {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// ===== Request helper =====
async function request(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: authHeaders(!!body),
        body: body ? JSON.stringify(body) : undefined,
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
export function imageUrl(fileName) {
    return `${API_URL}/images/${fileName}`;
}

// ===== Uploads =====
export async function uploadPhoto(file) {
    const token = getToken();
    const form = new FormData();
    form.append('uploadedphoto', file);

    const res = await fetch(`${API_URL}/photos/new`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
    });

    return parseResponse(res, 'Upload failed');
}

export { API_URL };
