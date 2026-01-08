import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import adminRoutes from './routes/adminRoutes.js';
import adminStatsRoutes from './routes/adminStatsRoutes.js';
import { verifyAdmin } from './middlewares/auth.js';
import userRoutes from './routes/userRoutes.js';
import photoRoutes from './routes/photoRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import reactionRoutes from './routes/reactionRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use('/admin', adminRoutes);
app.use('/api/admin/stats', verifyAdmin, adminStatsRoutes);
app.use('/user', userRoutes);
app.use('/', photoRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api', reactionRoutes);

app.use(errorHandler);

export default app;
