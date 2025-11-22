import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Paper, Button } from "@mui/material";
import "./styles.css";
import fetchModel from "../../lib/fetchModelData";

function UserDetail() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchModel(`/user/${userId}`, (data) => {
      setUser(data);
    });
  }, [userId]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Paper className="user-detail-root">
      <Typography variant="h4" gutterBottom>
        {user.first_name} {user.last_name}
      </Typography>
      <Typography>Location: {user.location}</Typography>
      <Typography>Occupation: {user.occupation}</Typography>
      <Typography>Description: {user.description}</Typography>

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        component={Link}
        to={`/photos/${user._id}`}
      >
        View photos
      </Button>
    </Paper>
  );
}

export default UserDetail;
