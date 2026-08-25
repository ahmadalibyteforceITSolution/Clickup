import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './db/connection.js';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import spacesRouter from './routes/spaces.js';
import tasksRouter from './routes/tasks.js';
import commentsRouter from './routes/comments.js';
import subtasksRouter from './routes/subtasks.js';
import attachmentsRouter from './routes/attachments.js';
import analyticsRouter from './routes/analytics.js';
import emailsRouter from './routes/emails.js';
import notificationsRouter from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Database connection middleware (ensures DB is connected before handling any API call)
app.use(async (req, res, next) => {
  if (req.path === '/api/health' || req.method === 'OPTIONS') return next();

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection middleware error:', err);
    res.status(500).json({ error: 'Database connection failed: ' + err.message });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/spaces', spacesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/subtasks', subtasksRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'MongoDB Atlas',
    message: 'ClickUp Clone API Server running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build for cPanel & standalone production
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start listener only when not running in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 ClickUp App Server running at http://localhost:${PORT}`);
  });
}

export default app;
