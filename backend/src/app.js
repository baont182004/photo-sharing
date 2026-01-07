import express from 'express';
import cors from 'cors';
import path from 'path';

import adminRoutes from './routes/adminRoutes.js';
import adminStatsRoutes from './routes/adminStatsRoutes.js';
import { verifyAdmin } from './middleware/verifyToken.js';
import userRoutes from './routes/userRoutes.js';
import photoRoutes from './routes/photoRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import reactionRoutes from './routes/reactionRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(process.cwd(), 'images')));

app.use('/admin', adminRoutes);
app.use('/api/admin/stats', verifyAdmin, adminStatsRoutes);
app.use('/user', userRoutes);
app.use('/', photoRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api', reactionRoutes);

export default app;
