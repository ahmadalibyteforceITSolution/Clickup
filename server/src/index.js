import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static uploads
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'MongoDB',
    message: 'ClickUp Clone API Server running on MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 ClickUp API Server is running at http://localhost:${PORT}`);
  });
}

export default app;
