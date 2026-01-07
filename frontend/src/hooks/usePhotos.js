import { useCallback, useState } from "react";
import { removePhoto, replacePhoto, upsertPhoto } from "../utils/photoState";

export default function usePhotos(initialPhotos = null) {
    const [photos, setPhotos] = useState(initialPhotos);

    const upsert = useCallback((photo) => {
        setPhotos((prev) => upsertPhoto(prev || [], photo));
    }, []);

    const replace = useCallback((photo) => {
        setPhotos((prev) => replacePhoto(prev || [], photo));
    }, []);

    const remove = useCallback((photoId) => {
        setPhotos((prev) => removePhoto(prev || [], photoId));
    }, []);

    return { photos, setPhotos, upsert, replace, remove };
}
