// src/components/navigation/TopBar.jsx
import React, { useEffect, useRef, useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { api, getUser, getToken, uploadPhoto } from "../../config/api";

export default function TopBar() {
    const yourName = "Nguyễn Thái Bảo - B22DCAT032";
    const [contextText, setContextText] = useState("Photo Sharing App");

    const [me, setMe] = useState(getUser());
    useEffect(() => {
        const onAuth = () => setMe(getUser());
        window.addEventListener("authchange", onAuth);
        return () => window.removeEventListener("authchange", onAuth);
    }, []);

    const navigate = useNavigate();
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const photoMatch = useMatch("/photos/:userId");
    const userMatch = useMatch("/users/:userId");

    useEffect(() => {
        let alive = true;

        const matchedUserId = photoMatch?.params.userId || userMatch?.params.userId;
        if (!matchedUserId) {
            setContextText("Photo Sharing App");
            return;
        }

        if (!getToken()) {
            setContextText("Photo Sharing App");
            return;
        }

        (async () => {
            try {
                const user = await api.get(`/user/${matchedUserId}`);
                if (!alive || !user) return;

                if (photoMatch) setContextText(`Ảnh của ${user.first_name} ${user.last_name}`);
                else if (userMatch) setContextText(`Chi tiết của ${user.first_name} ${user.last_name}`);
                else setContextText("Photo Sharing App");
            } catch {
                if (alive) setContextText("Photo Sharing App");
            }
        })();

        return () => {
            alive = false;
        };
    }, [photoMatch, userMatch]);

    const pickFile = () => fileRef.current?.click();

    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setUploading(true);
        try {
            const uploaded = await uploadPhoto(file);
            if (uploaded) {
                window.dispatchEvent(new CustomEvent("photouploaded", { detail: uploaded }));
            }
            const u = getUser();
            if (u?._id) navigate(`/photos/${u._id}`);
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

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
                        <Typography variant="body1">Chào {me.first_name} {me.last_name}</Typography>

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={onFileChange}
                        />

                        <Button color="inherit" variant="outlined" onClick={pickFile} disabled={uploading}>
                            {uploading ? "Đang tải lên..." : "Thêm ảnh"}
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}
