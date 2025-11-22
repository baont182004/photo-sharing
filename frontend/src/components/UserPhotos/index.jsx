import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CardMedia
} from "@mui/material";
import "./styles.css";
import fetchModel from "../../lib/fetchModelData";

function UserPhotos() {
  const { userId } = useParams();
  const [photos, setPhotos] = useState(null);

  useEffect(() => {
    fetchModel(`/photosOfUser/${userId}`, (data) => {
      setPhotos(data);
    });
  }, [userId]);

  if (!photos) {
    return <div>Loading...</div>;
  }

  return (
    <div className="user-photos-root">
      {photos.map((photo) => (
        <Paper key={photo._id} className="photo-paper">
          <CardMedia
            component="img"
            image={`/images/${photo.file_name}`}
            alt={photo.file_name}
            className="photo-image"
          />
          <Typography variant="caption" display="block" gutterBottom>
            {photo.date_time}
          </Typography>

          {photo.comments && photo.comments.length > 0 && (
            <List>
              {photo.comments.map((comment) => (
                <React.Fragment key={comment._id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Link to={`/users/${comment.user._id}`}>
                          {comment.user.first_name} {comment.user.last_name}
                        </Link>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {comment.date_time}
                          </Typography>
                          {comment.comment}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      ))}
    </div>
  );
}

export default UserPhotos;
