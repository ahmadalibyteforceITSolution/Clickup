import express from 'express';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import { notifyNewComment } from '../services/emailService.js';

const router = express.Router();

// Get comments for a task
router.get('/task/:taskId', async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.taskId })
      .populate('user', 'name email avatar role department')
      .sort({ createdAt: 1 });

    const formatted = comments.map(c => {
      const obj = c.toObject();
      return {
        ...obj,
        id: obj._id,
        user_name: obj.user?.name,
        user_email: obj.user?.email,
        user_role: obj.user?.role,
        user_avatar: obj.user?.avatar
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to a task
router.post('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { user_id, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const author = user_id ? await User.findById(user_id) : { name: 'User', role: 'employee', email: 'user@company.com' };

    const comment = await Comment.create({
      taskId,
      user: user_id || null,
      content: content.trim()
    });

    await ActivityLog.create({
      taskId,
      user: user_id || null,
      action: 'comment_added',
      details: `Posted comment: "${content.trim().substring(0, 45)}..."`
    });

    // Notify task assignees & creator
    const recipientIds = [...task.assignees];
    if (task.creator && !recipientIds.some(id => String(id) === String(task.creator))) {
      recipientIds.push(task.creator);
    }

    const filteredRecipients = recipientIds.filter(id => String(id) !== String(user_id));
    if (filteredRecipients.length > 0) {
      const recipients = await User.find({ _id: { $in: filteredRecipients } });
      for (const recipient of recipients) {
        await Notification.create({
          userId: recipient._id,
          title: 'New Comment',
          message: `${author.name} commented on "${task.title}"`,
          type: 'task_comment',
          taskId
        });

        notifyNewComment({
          task: task.toObject(),
          comment: comment.toObject(),
          author,
          recipient
        }).catch(err => console.error('Comment email error:', err));
      }
    }

    const populated = await Comment.findById(comment._id).populate('user', 'name email avatar role department');
    const obj = populated.toObject();
    res.status(201).json({
      ...obj,
      id: obj._id,
      user_name: obj.user?.name,
      user_email: obj.user?.email,
      user_role: obj.user?.role,
      user_avatar: obj.user?.avatar
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete comment
router.delete('/:id', async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
