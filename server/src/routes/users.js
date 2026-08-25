import express from 'express';
import multer from 'multer';
import User from '../models/User.js';
import Task from '../models/Task.js';

const router = express.Router();

// Use memoryStorage for 100% Serverless (Vercel) and Cloud compatibility (No EROFS read-only disk errors)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload profile avatar (stores as optimized base64 data URI in MongoDB Atlas)
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    let avatarUrl = '';

    if (req.file) {
      const base64Data = req.file.buffer.toString('base64');
      avatarUrl = `data:${req.file.mimetype};base64,${base64Data}`;
    } else if (req.body.avatar) {
      avatarUrl = req.body.avatar;
    } else {
      return res.status(400).json({ error: 'No avatar image provided' });
    }

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
    console.error('Avatar upload error:', error);
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
