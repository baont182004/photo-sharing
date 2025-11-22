import { Grid, Box, Toolbar } from "@mui/material";
import { Routes, Route, BrowserRouter } from "react-router-dom";


import TopBar from "./components/TopBar";
import UserList from "./components/UserList";
import UserDetail from "./components/UserDetail";
import UserPhotos from "./components/UserPhotos";


import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <Box display="flex" flexDirection="column" height="100vh">
        <TopBar />


        <Grid container className="main-body-container">

          <Grid
            item
            sm={3}
            className="sidebar-container"
          >
            <UserList />
          </Grid>

          <Grid
            item
            sm={9}
            className="content-container"
          >
            <Toolbar />

            <Routes>
              <Route path="/users/:userId" element={<UserDetail />} />
              <Route path="/photos/:userId" element={<UserPhotos />} />
              <Route path="/users" element={<UserList />} />
            </Routes>
          </Grid>

        </Grid>
      </Box>
    </BrowserRouter>
  );
}

export default App;