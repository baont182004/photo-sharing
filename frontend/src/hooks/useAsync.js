import { useCallback, useState } from "react";

export default function useAsync(initialValue = null) {
    const [value, setValue] = useState(initialValue);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const run = useCallback(async (fn, ...args) => {
        setLoading(true);
        setError("");
        try {
            const result = await fn(...args);
            setValue(result);
            return result;
        } catch (err) {
            setError(err?.message || "Đã xảy ra lỗi.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { value, setValue, loading, error, setError, run };
}
