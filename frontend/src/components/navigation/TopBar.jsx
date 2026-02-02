// src/components/navigation/TopBar.jsx
import React, { useEffect, useRef, useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Avatar,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { api, getUser, uploadPhoto } from "../../config/api";
import { API_PATHS } from "../../config/apiPaths";
import { useThemeMode } from "../../context/ThemeModeContext";
import useToastErrors from "../../hooks/useToastErrors";

export default function TopBar() {
    const yourName = "Nguyễn Thái Bảo - PTIT";
    const [contextText, setContextText] = useState("Ứng dụng chia sẻ ảnh");

    const [me, setMe] = useState(getUser());
    useEffect(() => {
        const onAuth = () => setMe(getUser());
        window.addEventListener("authchange", onAuth);
        return () => window.removeEventListener("authchange", onAuth);
    }, []);

    const navigate = useNavigate();
    const fileRef = useRef(null);
    const { mode, toggleMode } = useThemeMode();
    const { showError } = useToastErrors();
    const [uploading, setUploading] = useState(false);
    const [openUpload, setOpenUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [description, setDescription] = useState("");

    const photoMatch = useMatch("/photos/:userId");
    const userMatch = useMatch("/users/:userId");

    useEffect(() => {
        let alive = true;

        const matchedUserId = photoMatch?.params.userId || userMatch?.params.userId;
        if (!matchedUserId) {
            setContextText("Ứng dụng chia sẻ ảnh");
            return;
        }

        if (!getUser()?._id) {
            setContextText("Ứng dụng chia sẻ ảnh");
            return;
        }

        (async () => {
            try {
                const user = await api.get(API_PATHS.user.byId(matchedUserId));
                if (!alive || !user) return;

                if (photoMatch) setContextText(`Ảnh của ${user.first_name} ${user.last_name}`);
                else if (userMatch) setContextText(`Chi tiết của ${user.first_name} ${user.last_name}`);
                else setContextText("Ứng dụng chia sẻ ảnh");
            } catch {
                if (alive) setContextText("Ứng dụng chia sẻ ảnh");
            }
        })();

        return () => {
            alive = false;
        };
    }, [photoMatch, userMatch]);

    const pickFile = () => fileRef.current?.click();

    const resetUpload = () => {
        setSelectedFile(null);
        setDescription("");
        setPreviewUrl("");
    };

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setSelectedFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const nextUrl = URL.createObjectURL(file);
        setPreviewUrl(nextUrl);
        setOpenUpload(true);
    };

    const handleClose = () => {
        setOpenUpload(false);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        resetUpload();
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;
        if (description.length > 200) return;

        setUploading(true);
        try {
            const uploaded = await uploadPhoto(selectedFile, description.trim());
            if (uploaded) {
                window.dispatchEvent(new CustomEvent("photouploaded", { detail: uploaded }));
            }
            const u = getUser();
            if (u?._id) navigate(`/photos/${u._id}`);
            handleClose();
        } catch (err) {
            showError(err, "Tải ảnh thất bại.");
        } finally {
            setUploading(false);
        }
    };

    const displayName =
        me?.display_name ||
        `${me?.first_name || ""} ${me?.last_name || ""}`.trim() ||
        "User";
    const handleText = me?.handle ? `@${me.handle}` : "";

    return (
        <AppBar position="static">
            <Toolbar>
                <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                    <Typography variant="h6">{yourName}</Typography>
                </Link>

                <Box sx={{ flexGrow: 1 }} />

                <Typography variant="h6">{contextText}</Typography>

                <Box sx={{ flexGrow: 1 }} />

                {!me ? (
                    <Typography variant="body1">Vui lòng đăng nhập</Typography>
                ) : (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 1,
                                py: 0.5,
                                borderRadius: 2,
                                bgcolor: "rgba(255,255,255,0.14)",
                                border: "1px solid rgba(255,255,255,0.25)",
                            }}
                        >
                            <Avatar
                                src={me?.avatar_url || ""}
                                alt={displayName}
                                sx={{ width: 36, height: 36 }}
                            />
                            <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                                    {displayName}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ color: "rgba(255,255,255,0.8)" }}
                                    noWrap
                                >
                                    {handleText}
                                </Typography>
                            </Box>
                        </Box>

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={onFileChange}
                            aria-label="Chọn ảnh để tải lên"
                        />

                        <Button color="inherit" variant="outlined" onClick={pickFile} disabled={uploading}>
                            {uploading ? "Đang tải lên..." : "Thêm ảnh"}
                        </Button>
                        <Button
                            color="inherit"
                            variant="outlined"
                            onClick={toggleMode}
                            aria-pressed={mode === "dark"}
                        >
                            {mode === "dark" ? "Giao diện sáng" : "Giao diện tối"}
                        </Button>
                    </Box>
                )}
            </Toolbar>

            <Dialog
                open={openUpload}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                aria-labelledby="upload-dialog-title"
                aria-describedby="upload-dialog-desc"
            >
                <DialogTitle id="upload-dialog-title">Thêm ảnh</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Typography id="upload-dialog-desc" variant="body2" color="text.secondary">
                        Chọn một ảnh, thêm mô tả và nhấn “Đăng” để chia sẻ.
                    </Typography>
                    <TextField
                        label="Mô tả (tối đa 200 ký tự)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        inputProps={{ maxLength: 200 }}
                        multiline
                        minRows={2}
                    />
                    {previewUrl && (
                        <Box
                            sx={{
                                width: "100%",
                                borderRadius: 1,
                                overflow: "hidden",
                                bgcolor: "grey.100",
                            }}
                        >
                            <img
                                src={previewUrl}
                                alt="Xem trước ảnh"
                                style={{ width: "100%", height: "auto", display: "block" }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={uploading}>
                        Hủy
                    </Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={uploading || !selectedFile}>
                        Đăng
                    </Button>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
}

