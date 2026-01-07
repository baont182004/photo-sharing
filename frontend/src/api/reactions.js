// src/api/reactions.js
import { api } from "../config/api";
import { API_PATHS } from "../config/apiPaths";

export function reactToPhoto(photoId, value) {
    return api.put(API_PATHS.reactions.photo(photoId), { value });
}

export function reactToComment(commentId, value) {
    return api.put(API_PATHS.reactions.comment(commentId), { value });
}
