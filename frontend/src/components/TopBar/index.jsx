// frontend/src/components/TopBar/index.jsx
import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { useMatch, Link } from "react-router-dom";

import "./styles.css";
import fetchModel from "../../lib/fetchModelData";
function TopBar() {
  const yourName = "Nguyễn Thái Bảo - B22DCAT032";

  const [contextText, setContextText] = useState("Photo Sharing");

  const photoMatch = useMatch("/photos/:userId");
  const userMatch = useMatch("/users/:userId");

  useEffect(() => {
    const matchedUserId = photoMatch?.params.userId || userMatch?.params.userId;
    if (!matchedUserId) {
      setContextText("Photo Sharing");
      return;
    }

    // Gọi backend lấy thông tin user
    fetchModel(`/user/${matchedUserId}`, (user) => {
      if (!user) {
        setContextText("Photo Sharing");
        return;
      }

      if (photoMatch) {
        setContextText(`Ảnh của ${user.first_name} ${user.last_name}`);
      } else if (userMatch) {
        setContextText(`Chi tiết của ${user.first_name} ${user.last_name}`);
      } else {
        setContextText("Photo Sharing");
      }
    });
  }, [photoMatch, userMatch]);

  return (
    <AppBar position="static">
      <Toolbar>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="h6" component="div">
            {yourName}
          </Typography>
        </Link>

        <div style={{ flexGrow: 1 }} />

        <Typography variant="h6" component="div">
          {contextText}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
