import { useEffect, useState } from "react";
import { api } from "../config/api";

export default function useUserSummaries(searchTerm = "") {
    const [users, setUsers] = useState(null);
    const [allPhotos, setAllPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const data = await api.get(
                    searchTerm
                        ? `/user/search?name=${encodeURIComponent(searchTerm)}`
                        : "/user/list"
                );
                if (!alive) return;
                setUsers(data);

                if (data && data.length > 0) {
                    const arrays = await Promise.all(
                        data.map((u) => api.get(`/photosOfUser/${u._id}`).catch(() => []))
                    );
                    if (!alive) return;
                    setAllPhotos(arrays.flat());
                } else {
                    setAllPhotos([]);
                }
            } catch (err) {
                if (!alive) return;
                setError(err?.message || "Failed to load users");
                setUsers([]);
                setAllPhotos([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [searchTerm]);

    const getPhotoCount = (userId) =>
        allPhotos.filter((p) => String(p.user_id) === String(userId)).length;

    const getCommentCount = (userId) => {
        let count = 0;
        allPhotos.forEach((p) => {
            const comments = p.comments || [];
            count += comments.filter((c) => (c.user?._id || c.user_id) === userId).length;
        });
        return count;
    };

    return { users, loading, error, getPhotoCount, getCommentCount };
}
