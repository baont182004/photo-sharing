export function formatDate(value) {
    if (!value) return "";
    try {
        return new Date(value).toLocaleString("vi-VN");
    } catch {
        return String(value);
    }
}
