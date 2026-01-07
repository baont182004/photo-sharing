export function upsertPhoto(list, photo) {
    if (!photo) return list || [];
    const items = list || [];
    const idx = items.findIndex((p) => p._id === photo._id);
    if (idx >= 0) {
        const next = [...items];
        next[idx] = photo;
        return next;
    }
    return [photo, ...items];
}

export function replacePhoto(list, photo) {
    if (!photo) return list || [];
    return (list || []).map((p) => (p._id === photo._id ? photo : p));
}

export function removePhoto(list, photoId) {
    return (list || []).filter((p) => p._id !== photoId);
}
