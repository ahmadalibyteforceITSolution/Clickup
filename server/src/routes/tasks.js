import express from 'express';
import Task from '../models/Task.js';
import List from '../models/List.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js';
import Attachment from '../models/Attachment.js';
import { notifyTaskAssigned, notifyTaskScheduled, notifyStatusChange } from '../services/emailService.js';

const router = express.Router();

// Helper to populate full task details
async function getPopulatedTask(id) {
  const task = await Task.findById(id)
    .populate('creator', 'name email avatar role')
    .populate('assignees', 'name email avatar role department job_title')
    .populate({
      path: 'subtasks.assignee',
      select: 'name email avatar'
    })
    .populate({
      path: 'listId',
      select: 'name color spaceId',
      populate: { path: 'spaceId', select: 'name color' }
    });

  if (!task) return null;

  const commentCount = await Comment.countDocuments({ taskId: task._id });
  const attachmentCount = await Attachment.countDocuments({ taskId: task._id });

  const obj = task.toObject();
  obj.comment_count = commentCount;
  obj.attachment_count = attachmentCount;
  obj.list = obj.listId;
  return obj;
}

// Get all tasks with flexible filtering
router.get('/', async (req, res) => {
  try {
    const { list_id, space_id, status, priority, assignee_id, search, overdue } = req.query;
    const filter = {};

    if (list_id) filter.listId = list_id;
    if (space_id) filter.spaceId = space_id;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee_id) filter.assignees = assignee_id;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (overdue === 'true') {
      const todayStr = new Date().toISOString().split('T')[0];
      filter.status = { $ne: 'completed' };
      filter.dueDate = { $lt: todayStr, $ne: null };
    }

    const priorityWeight = { urgent: 1, high: 2, normal: 3, low: 4 };

    const tasks = await Task.find(filter)
      .populate('creator', 'name email avatar role')
      .populate('assignees', 'name email avatar role department job_title')
      .populate({
        path: 'subtasks.assignee',
        select: 'name email avatar'
      })
      .populate({
        path: 'listId',
        select: 'name color spaceId',
        populate: { path: 'spaceId', select: 'name color' }
      })
      .sort({ dueDate: 1, createdAt: -1 });

    // Attach comment and attachment counts
    const taskIds = tasks.map(t => t._id);
    const commentCounts = await Comment.aggregate([
      { $match: { taskId: { $in: taskIds } } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);
    const attachmentCounts = await Attachment.aggregate([
      { $match: { taskId: { $in: taskIds } } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);

    const cMap = {};
    commentCounts.forEach(c => { cMap[String(c._id)] = c.count; });
    const aMap = {};
    attachmentCounts.forEach(a => { aMap[String(a._id)] = a.count; });

    const enriched = tasks.map(t => {
      const obj = t.toObject();
      obj.comment_count = cMap[String(t._id)] || 0;
      obj.attachment_count = aMap[String(t._id)] || 0;
      obj.list = obj.listId;
      return obj;
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await getPopulatedTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description = '',
      list_id,
      space_id,
      status = 'pending',
      priority = 'normal',
      start_date = null,
      due_date = null,
      time_estimate = 0,
      creator_id,
      assignee_ids = []
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Task title is required' });

    let targetListId = list_id;
    let targetSpaceId = space_id;

    if (!targetListId) {
      const firstList = await List.findOne();
      if (firstList) {
        targetListId = firstList._id;
        targetSpaceId = firstList.spaceId;
      }
    } else if (!targetSpaceId) {
      const listDoc = await List.findById(targetListId);
      if (listDoc) targetSpaceId = listDoc.spaceId;
    }

    const task = await Task.create({
      title,
      description,
      listId: targetListId,
      spaceId: targetSpaceId,
      status,
      priority,
      startDate: start_date || null,
      dueDate: due_date || null,
      timeEstimate: time_estimate || 0,
      creator: creator_id || null,
      assignees: assignee_ids || []
    });

    const creatorUser = creator_id ? await User.findById(creator_id) : { name: 'Manager', role: 'manager', email: 'manager@company.com' };

    // Log creation activity
    await ActivityLog.create({
      taskId: task._id,
      user: creator_id || null,
      action: 'created',
      details: `Created task "${title}"`
    });

    // Notify assignees
    if (Array.isArray(assignee_ids) && assignee_ids.length > 0) {
      const assignedUsers = await User.find({ _id: { $in: assignee_ids } });
      for (const assignedUser of assignedUsers) {
        await ActivityLog.create({
          taskId: task._id,
          user: creator_id || null,
          action: 'assigned',
          details: `Assigned task to ${assignedUser.name}`
        });

        await Notification.create({
          userId: assignedUser._id,
          title: 'New Task Assigned',
          message: `${creatorUser.name} assigned you to "${title}"`,
          type: 'task_assigned',
          taskId: task._id
        });

        notifyTaskAssigned({
          task: { _id: task._id, title, description, status, priority, startDate: start_date, dueDate: due_date },
          assignee: assignedUser,
          assignedBy: creatorUser
        }).catch(err => console.error('Email assign error:', err));
      }
    }

    const populated = await getPopulatedTask(task._id);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task details
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const existing = await Task.findById(taskId);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const {
      title,
      description,
      status,
      priority,
      start_date,
      due_date,
      time_estimate,
      time_spent,
      list_id,
      assignee_ids,
      updated_by
    } = req.body;

    const updater = updated_by ? await User.findById(updated_by) : { name: 'Admin', role: 'super_admin', email: 'admin@company.com' };

    // Status change trigger
    if (status && status !== existing.status) {
      await ActivityLog.create({
        taskId,
        user: updated_by || null,
        action: 'status_changed',
        details: `Changed status from ${existing.status} to ${status}`
      });

      const assignees = await User.find({ _id: { $in: existing.assignees } });
      for (const assignee of assignees) {
        if (String(assignee._id) !== String(updated_by)) {
          await Notification.create({
            userId: assignee._id,
            title: 'Task Status Updated',
            message: `${updater.name} changed status of "${existing.title}" to ${status}`,
            type: 'status_changed',
            taskId
          });

          notifyStatusChange({
            task: { ...existing.toObject(), status },
            user: assignee,
            oldStatus: existing.status,
            newStatus: status,
            changedBy: updater
          }).catch(err => console.error('Email status error:', err));
        }
      }
    }

    // Schedule change trigger
    if ((due_date !== undefined && due_date !== existing.dueDate) || (start_date !== undefined && start_date !== existing.startDate)) {
      await ActivityLog.create({
        taskId,
        user: updated_by || null,
        action: 'schedule_changed',
        details: `Updated schedule: Start (${start_date || 'none'}), Due (${due_date || 'none'})`
      });

      const assignees = await User.find({ _id: { $in: existing.assignees } });
      for (const assignee of assignees) {
        if (String(assignee._id) !== String(updated_by)) {
          notifyTaskScheduled({
            task: { ...existing.toObject(), startDate: start_date ?? existing.startDate, dueDate: due_date ?? existing.dueDate },
            user: assignee
          }).catch(err => console.error('Email schedule error:', err));
        }
      }
    }

    // Check newly added assignees
    if (Array.isArray(assignee_ids)) {
      const existingAssigneeStrs = existing.assignees.map(a => String(a));
      const newlyAdded = assignee_ids.filter(id => !existingAssigneeStrs.includes(String(id)));

      if (newlyAdded.length > 0) {
        const newUsers = await User.find({ _id: { $in: newlyAdded } });
        for (const nu of newUsers) {
          await ActivityLog.create({
            taskId,
            user: updated_by || null,
            action: 'assigned',
            details: `Assigned task to ${nu.name}`
          });

          await Notification.create({
            userId: nu._id,
            title: 'New Task Assigned',
            message: `${updater.name} assigned you to "${existing.title}"`,
            type: 'task_assigned',
            taskId
          });

          notifyTaskAssigned({
            task: { ...existing.toObject(), title: title || existing.title },
            assignee: nu,
            assignedBy: updater
          }).catch(err => console.error('Email assign error:', err));
        }
      }
    }

    // Update document fields
    if (title !== undefined) existing.title = title;
    if (description !== undefined) existing.description = description;
    if (status !== undefined) existing.status = status;
    if (priority !== undefined) existing.priority = priority;
    if (start_date !== undefined) existing.startDate = start_date;
    if (due_date !== undefined) existing.dueDate = due_date;
    if (time_estimate !== undefined) existing.timeEstimate = time_estimate;
    if (time_spent !== undefined) existing.timeSpent = time_spent;
    if (list_id !== undefined) existing.listId = list_id;
    if (assignee_ids !== undefined) existing.assignees = assignee_ids;

    await existing.save();

    const populated = await getPopulatedTask(taskId);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await Task.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ taskId: req.params.id });
    await Attachment.deleteMany({ taskId: req.params.id });
    await ActivityLog.deleteMany({ taskId: req.params.id });

    res.json({ success: true, message: `Task "${task.title}" deleted` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
