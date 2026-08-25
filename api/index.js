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
import notificationsRouter from '../server/src/routes/notifications.js';
import campaignsRouter from '../server/src/routes/campaigns.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', time: new Date().toISOString() }));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', time: new Date().toISOString() }));

// Mount routes on BOTH /api/... and /... to match all Vercel path rewrites
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/users', usersRouter);
app.use('/users', usersRouter);

app.use('/api/spaces', spacesRouter);
app.use('/spaces', spacesRouter);

app.use('/api/tasks', tasksRouter);
app.use('/tasks', tasksRouter);

app.use('/api/comments', commentsRouter);
app.use('/comments', commentsRouter);

app.use('/api/subtasks', subtasksRouter);
app.use('/subtasks', subtasksRouter);

app.use('/api/attachments', attachmentsRouter);
app.use('/attachments', attachmentsRouter);

app.use('/api/analytics', analyticsRouter);
app.use('/analytics', analyticsRouter);

app.use('/api/emails', emailsRouter);
app.use('/emails', emailsRouter);

app.use('/api/notifications', notificationsRouter);
app.use('/notifications', notificationsRouter);

app.use('/api/campaigns', campaignsRouter);
app.use('/campaigns', campaignsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Serverless Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      return res.status(200).end();
    }

    if (!req.url.includes('/health')) {
      await connectDB();
    }

    return app(req, res);
  } catch (err) {
    console.error('Vercel Handler Top-Level Error:', err);
    return res.status(500).json({ error: 'Database/Serverless Handler error: ' + err.message });
  }
}
