// src/pages/users/UserDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Paper, Button } from "@mui/material";
import { api } from "../../config/api";

export default function UserDetail() {
    const { userId } = useParams();
    const [user, setUser] = useState(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            const data = await api.get(`/user/${userId}`);
            if (alive) setUser(data);
        })();

        return () => {
            alive = false;
        };
    }, [userId]);

    if (!user) return <div>Loading...</div>;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                {user.first_name} {user.last_name}
            </Typography>

            <Typography>Địa chỉ: {user.location}</Typography>
            <Typography>Nghề nghiệp: {user.occupation}</Typography>
            <Typography>Mô tả: {user.description}</Typography>

            <Button variant="contained" sx={{ mt: 2 }} component={Link} to={`/photos/${user._id}`}>
                Xem ảnh
            </Button>
        </Paper>
    );
}
