import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Space from '../models/Space.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get workspace dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in_progress' });
    const reviewTasks = await Task.countDocuments({ status: 'review' });
    const overdueTasks = await Task.countDocuments({ 
      status: { $ne: 'completed' }, 
      dueDate: { $lt: todayStr, $ne: null } 
    });

    const totalUsers = await User.countDocuments();
    const totalSpaces = await Space.countDocuments();

    // Priority breakdown
    const priorityAgg = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const priorityBreakdown = priorityAgg.map(p => ({ priority: p._id, count: p.count }));

    // Workload per employee
    const users = await User.find().sort({ role: 1, name: 1 });
    const employeeWorkload = await Promise.all(users.map(async (u) => {
      const assigned = await Task.countDocuments({ assignees: u._id });
      const comp = await Task.countDocuments({ assignees: u._id, status: 'completed' });
      const inProg = await Task.countDocuments({ assignees: u._id, status: 'in_progress' });
      const pend = await Task.countDocuments({ assignees: u._id, status: 'pending' });
      const od = await Task.countDocuments({ 
        assignees: u._id, 
        status: { $ne: 'completed' }, 
        dueDate: { $lt: todayStr, $ne: null } 
      });

      return {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        department: u.department,
        total_assigned: assigned,
        completed: comp,
        in_progress: inProg,
        pending: pend,
        overdue: od
      };
    }));

    // Recent activity
    const activities = await ActivityLog.find()
      .populate('user', 'name email avatar')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    const recentActivity = activities.map(a => ({
      id: a._id,
      task_id: a.taskId?._id,
      task_title: a.taskId?.title,
      user_name: a.user?.name,
      user_avatar: a.user?.avatar,
      action: a.action,
      details: a.details,
      created_at: a.createdAt
    }));

    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = await Task.find({
      status: { $ne: 'completed' },
      dueDate: { $gte: todayStr, $ne: null }
    })
    .populate('listId', 'name color spaceId')
    .populate('spaceId', 'name color')
    .sort({ dueDate: 1 })
    .limit(6);

    res.json({
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        reviewTasks,
        overdueTasks,
        totalUsers,
        totalSpaces,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      priorityBreakdown,
      employeeWorkload: employeeWorkload.sort((a, b) => b.total_assigned - a.total_assigned),
      recentActivity,
      upcomingDeadlines
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activity logs
router.get('/activity', async (req, res) => {
  try {
    const { task_id, limit = 50 } = req.query;
    const filter = task_id ? { taskId: task_id } : {};

    const activities = await ActivityLog.find(filter)
      .populate('user', 'name email avatar')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    const formatted = activities.map(a => ({
      id: a._id,
      task_id: a.taskId?._id,
      task_title: a.taskId?.title,
      user_name: a.user?.name,
      user_avatar: a.user?.avatar,
      action: a.action,
      details: a.details,
      created_at: a.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// In-app notifications
router.get('/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ userId: req.params.userId, isRead: false });

    res.json({
      notifications: notifications.map(n => ({
        id: n._id,
        user_id: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        task_id: n.taskId,
        is_read: n.isRead ? 1 : 0,
        created_at: n.createdAt
      })),
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notifications as read
router.post('/notifications/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
