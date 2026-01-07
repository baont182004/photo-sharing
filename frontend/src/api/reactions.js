// src/api/reactions.js
import { api } from "../config/api";

export function reactToPhoto(photoId, value) {
    return api.put(`/api/photos/${photoId}/reaction`, { value });
}

export function reactToComment(commentId, value) {
    return api.put(`/api/comments/${commentId}/reaction`, { value });
}
