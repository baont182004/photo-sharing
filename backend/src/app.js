import express from 'express';
import cors from 'cors';
import path from 'path';

import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import photoRoutes from './routes/photoRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(process.cwd(), 'images')));

app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/', photoRoutes);

export default app;
