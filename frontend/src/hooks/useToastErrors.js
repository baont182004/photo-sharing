import { useCallback } from "react";
import { useToast } from "../context/ToastContext";

export default function useToastErrors() {
    const { showToast } = useToast();

    const showError = useCallback(
        (err, fallback = "Đã xảy ra lỗi.") => {
            const message = err?.message || fallback;
            showToast(message, "error");
        },
        [showToast]
    );

    const showSuccess = useCallback(
        (message) => {
            if (!message) return;
            showToast(message, "success");
        },
        [showToast]
    );

    return { showError, showSuccess };
}
