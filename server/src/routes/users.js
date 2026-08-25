import express from 'express';
import User from '../models/User.js';
import Task from '../models/Task.js';

const router = express.Router();

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

// Create user (Super Admin)
router.post('/', async (req, res) => {
  try {
    const { name, email, role = 'employee', department = 'General', job_title = '', avatar } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const user = await User.create({
      name,
      email,
      role,
      department,
      job_title,
      avatar: defaultAvatar
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
