// src/pages/users/UserList.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    Box,
    TextField,
} from "@mui/material";
import useUserSummaries from "../../hooks/useUserSummaries";

export default function UserList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const navigate = useNavigate();

    const { users, loading, getPhotoCount, getCommentCount } =
        useUserSummaries(debouncedSearchTerm);

    useEffect(() => {
        const timeId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 600);
        return () => clearTimeout(timeId);
    }, [searchTerm]);

    const handleCommentBubbleClick = (e, userId) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/comments/${userId}`);
    };

    if (loading || !users) return <div>Đang tải danh sách...</div>;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Khám phá người dùng
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Gõ tên để tìm nhanh. Bấm vào người dùng để xem hồ sơ và gửi kết bạn.
            </Typography>

            <TextField
                fullWidth
                size="small"
                placeholder="Nhập tên hoặc họ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
            />

            <List>
                {users.map((user) => {
                    const photoCount = getPhotoCount(user._id);
                    const commentCount = getCommentCount(user._id);

                    return (
                        <React.Fragment key={user._id}>
                            <ListItem button component={Link} to={`/users/${user._id}`}>
                                <ListItemText
                                    primary={`${user.first_name} ${user.last_name}`}
                                />

                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 2,
                                            bgcolor: "success.main",
                                            color: "white",
                                            fontSize: 12,
                                            minWidth: 28,
                                            textAlign: "center",
                                        }}
                                        title="Số ảnh đã đăng"
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
                                            fontSize: 12,
                                            minWidth: 28,
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }}
                                        title="Số bình luận (nhấn để xem)"
                                        onClick={(e) => handleCommentBubbleClick(e, user._id)}
                                    >
                                        {commentCount}
                                    </Box>
                                </Box>
                            </ListItem>
                            <Divider component="li" />
                        </React.Fragment>
                    );
                })}
                {users.length === 0 && (
                    <Box sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Không tìm thấy người dùng phù hợp. Hãy thử từ khóa khác.
                        </Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
}
