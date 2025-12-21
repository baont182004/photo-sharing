import React, { useMemo, useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import {
    Box,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import useUserSummaries from "../../hooks/useUserSummaries";

export default function UserSidebar() {
    const { users, loading, getPhotoCount, getCommentCount } = useUserSummaries();
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const matchUser = useMatch("/users/:userId");
    const matchPhoto = useMatch("/photos/:userId");
    const matchComment = useMatch("/comments/:userId");

    const selectedId = matchUser?.params.userId || matchPhoto?.params.userId || matchComment?.params.userId || "";

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return users;
        return users.filter((u) =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(term) ||
            (u.occupation || "").toLowerCase().includes(term)
        );
    }, [search, users]);

    return (
        <Paper
            sx={{
                width: 260,
                flexShrink: 0,
                p: 2,
                maxHeight: "calc(100vh - 140px)",
                overflowY: "auto",
                position: "sticky",
                top: 8,
            }}
        >
            <Typography variant="h6" gutterBottom>
                Người dùng
            </Typography>
            <TextField
                size="small"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                sx={{ mb: 1 }}
            />

            {loading ? (
                <Typography variant="body2" color="text.secondary">
                    Đang tải...
                </Typography>
            ) : (
                <List dense>
                    {filtered.map((u) => {
                        const photoCount = getPhotoCount(u._id);
                        const commentCount = getCommentCount(u._id);
                        return (
                            <ListItemButton
                                key={u._id}
                                selected={selectedId === u._id}
                                onClick={() => navigate(`/users/${u._id}`)}
                                alignItems="flex-start"
                            >
                                <ListItemText
                                    primary={`${u.first_name} ${u.last_name}`}
                                    secondary={u.occupation}
                                    primaryTypographyProps={{ noWrap: true }}
                                    secondaryTypographyProps={{ noWrap: true }}
                                />
                                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 2,
                                            bgcolor: "success.main",
                                            color: "white",
                                            fontSize: 11,
                                            minWidth: 24,
                                            textAlign: "center",
                                        }}
                                        title="Số ảnh"
                                    >
                                        {photoCount}
                                    </Box>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 2,
                                            bgcolor: "error.main",
                                            color: "white",
                                            fontSize: 11,
                                            minWidth: 24,
                                            textAlign: "center",
                                        }}
                                        title="Số bình luận"
                                    >
                                        {commentCount}
                                    </Box>
                                </Box>
                            </ListItemButton>
                        );
                    })}
                    {filtered.length === 0 && (
                        <Box sx={{ py: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Không có kết quả
                            </Typography>
                        </Box>
                    )}
                </List>
            )}
        </Paper>
    );
}
