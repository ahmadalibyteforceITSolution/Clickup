import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../server/src/db/connection.js';

import authRouter from '../server/src/routes/auth.js';
import usersRouter from '../server/src/routes/users.js';
import spacesRouter from '../server/src/routes/spaces.js';
import tasksRouter from '../server/src/routes/tasks.js';
import commentsRouter from '../server/src/routes/comments.js';
import subtasksRouter from '../server/src/routes/subtasks.js';
import attachmentsRouter from '../server/src/routes/attachments.js';
import analyticsRouter from '../server/src/routes/analytics.js';
import emailsRouter from '../server/src/routes/emails.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection middleware for Serverless execution
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS' || req.url.includes('/health')) return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Serverless DB Connection Error:', err);
    return res.status(500).json({ error: 'MongoDB connection failed: ' + err.message });
  }
});

// Mount routes on BOTH /api/... and /... to prevent Vercel rewrite prefix issues
const routes = [
  ['auth', authRouter],
  ['users', usersRouter],
  ['spaces', spacesRouter],
  ['tasks', tasksRouter],
  ['comments', commentsRouter],
  ['subtasks', subtasksRouter],
  ['attachments', attachmentsRouter],
  ['analytics', analyticsRouter],
  ['emails', emailsRouter]
];

for (const [prefix, router] of routes) {
  app.use(`/api/${prefix}`, router);
  app.use(`/${prefix}`, router);
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Global error handler with clean JSON output
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
