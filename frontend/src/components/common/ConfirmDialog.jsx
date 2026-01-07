import React from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    loading = false,
    onConfirm,
    onClose,
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
                <DialogContent>
                    <DialogContentText>{description}</DialogContentText>
                </DialogContent>
            )}
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={loading}>
                    {cancelText}
                </Button>
                <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
