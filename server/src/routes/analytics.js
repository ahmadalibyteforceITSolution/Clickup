import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Space from '../models/Space.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { user_role, user_id } = req.query;
    const isEmployee = user_role === 'employee' && user_id;

    // Base filter: Employee sees only their own tasks, Super Admin/Manager sees all
    const taskFilter = isEmployee 
      ? { $or: [{ assignees: user_id }, { creator: user_id }] }
      : {};

    const totalTasks = await Task.countDocuments(taskFilter);
    const completedTasks = await Task.countDocuments({ ...taskFilter, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ ...taskFilter, status: 'in_progress' });
    const pendingTasks = await Task.countDocuments({ ...taskFilter, status: 'pending' });
    const reviewTasks = await Task.countDocuments({ ...taskFilter, status: 'review' });

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = await Task.countDocuments({
      ...taskFilter,
      status: { $ne: 'completed' },
      dueDate: { $lt: todayStr, $ne: null }
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Workload breakdown:
    // If employee: show only their own workload card
    // If super admin / manager: show all team members
    const userQuery = isEmployee ? { _id: user_id } : {};
    const users = await User.find(userQuery).sort({ role: 1, name: 1 });

    const employeeWorkload = await Promise.all(
      users.map(async (u) => {
        const uTotal = await Task.countDocuments({ assignees: u._id });
        const uCompleted = await Task.countDocuments({ assignees: u._id, status: 'completed' });
        const uInProgress = await Task.countDocuments({ assignees: u._id, status: 'in_progress' });
        const uOverdue = await Task.countDocuments({
          assignees: u._id,
          status: { $ne: 'completed' },
          dueDate: { $lt: todayStr, $ne: null }
        });

        return {
          user: {
            id: u._id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            role: u.role,
            department: u.department
          },
          total: uTotal,
          completed: uCompleted,
          in_progress: uInProgress,
          overdue: uOverdue,
          completion_rate: uTotal > 0 ? Math.round((uCompleted / uTotal) * 100) : 0
        };
      })
    );

    // Upcoming Deadlines (Filtered by role)
    const upcomingDeadlines = await Task.find({
      ...taskFilter,
      status: { $ne: 'completed' },
      dueDate: { $gte: todayStr, $ne: null }
    })
      .populate('assignees', 'name email avatar')
      .populate('listId', 'name')
      .sort({ dueDate: 1 })
      .limit(6);

    const totalSpaces = isEmployee ? 1 : await Space.countDocuments();

    res.json({
      summary: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        pending_tasks: pendingTasks,
        review_tasks: reviewTasks,
        overdue_tasks: overdueTasks,
        completion_rate: completionRate,
        total_spaces: totalSpaces,
        total_employees: users.length
      },
      employee_workload: employeeWorkload,
      upcoming_deadlines: upcomingDeadlines
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
