import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Task from '../models/Task.js';

const router = express.Router();

// Configure multer memory storage for cloud/serverless compatibility
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars!'), false);
    }
  }
});

// Get all users (id, name, email, avatar, role, department, job_title)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password -verificationCode').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload user avatar (Base64 data URI storage for serverless / read-only FS support)
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const avatarDataUri = `data:${mimeType};base64,${base64Data}`;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarDataUri },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Avatar uploaded and updated successfully',
      avatar: user.avatar,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile by ID with task statistics
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
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

// Update user profile & password (Allows Super Admin to edit any profile, role, or password)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, department, job_title, avatar, password } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (role) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (job_title !== undefined) updates.job_title = job_title;
    if (avatar !== undefined) updates.avatar = avatar;

    // Change password if provided
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updates.password = await bcrypt.hash(password.trim(), 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

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
