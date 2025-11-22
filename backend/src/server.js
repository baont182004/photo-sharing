// backend/server.js
import express from 'express';
import cors from 'cors';
import models from './modelData/models.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


// Test xem backend + models hoạt động chưa
app.get('/test/info', (req, res) => {
    res.json(models.schemaInfo());
});

// Danh sách user
app.get('/user/list', (req, res) => {
    const users = models.userListModel();
    res.json(users);
});

// Thông tin chi tiết 1 user
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    const user = models.userModel(userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
});

// Danh sách ảnh của 1 user
app.get('/photosOfUser/:id', (req, res) => {
    const userId = req.params.id;
    const photos = models.photoOfUserModel(userId);
    res.json(photos);
});

// Endpoint gốc cho vui
app.get('/', (req, res) => {
    res.send('PhotoShare backend is running 🎉');
});

// Lắng nghe
app.listen(PORT, () => {
    console.log(`Backend đang chạy ở http://localhost:${PORT}`);
});
