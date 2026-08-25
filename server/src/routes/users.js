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

// Update user profile (Allows Super Admin to edit any profile or role)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, department, job_title, avatar } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (role) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (job_title !== undefined) updates.job_title = job_title;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user account (Super Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Remove user from any task assignees
    await Task.updateMany(
      { assignees: user._id },
      { $pull: { assignees: user._id } }
    );

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: `User "${user.name}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
