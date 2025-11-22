import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";
import "./styles.css";
import fetchModel from "../../lib/fetchModelData";

function UserList() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    fetchModel("/user/list", (data) => {
      setUsers(data);
    });
  }, []);

  if (!users) {
    return <div>Loading...</div>;
  }

  return (
    <Paper className="user-list-root">
      <Typography variant="h5" gutterBottom>
        Users
      </Typography>
      <List>
        {users.map((user) => (
          <React.Fragment key={user._id}>
            <ListItem button component={Link} to={`/users/${user._id}`}>
              <ListItemText
                primary={`${user.first_name} ${user.last_name}`}
                secondary={user.occupation}
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
}

export default UserList;
