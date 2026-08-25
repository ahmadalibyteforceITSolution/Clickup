import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Task from '../models/Task.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Upload profile avatar
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar image uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarUrl },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ role: 1, name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user with workload statistics
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalTasks = await Task.countDocuments({ assignees: user._id });
    const completedTasks = await Task.countDocuments({ assignees: user._id, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ assignees: user._id, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ assignees: user._id, status: 'in_progress' });
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = await Task.countDocuments({ 
      assignees: user._id, 
      status: { $ne: 'completed' }, 
      dueDate: { $lt: todayStr, $ne: null } 
    });

    res.json({
      ...user.toObject(),
      stats: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        in_progress_tasks: inProgressTasks,
        overdue_tasks: overdueTasks
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { name, department, job_title, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        ...(name && { name: name.trim() }),
        ...(department !== undefined && { department }),
        ...(job_title !== undefined && { job_title }),
        ...(avatar !== undefined && { avatar })
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
