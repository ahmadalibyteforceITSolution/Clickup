import express from 'express';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// Get subtasks for a task
router.get('/task/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('subtasks.assignee', 'name email avatar');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task.subtasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add subtask to a task
router.post('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, due_date, assignee_id, user_id } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Subtask title is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.subtasks.push({
      title: title.trim(),
      completed: false,
      dueDate: due_date || null,
      assignee: assignee_id || null
    });

    await task.save();

    await ActivityLog.create({
      taskId,
      user: user_id || null,
      action: 'subtask_added',
      details: `Added subtask: "${title.trim()}"`
    });

    const populated = await Task.findById(taskId).populate('subtasks.assignee', 'name email avatar');
    const newSubtask = populated.subtasks[populated.subtasks.length - 1];
    res.status(201).json(newSubtask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle / update subtask
router.put('/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { completed, title, due_date, assignee_id, user_id, task_id } = req.body;

    // Find task containing this subtask
    const task = await Task.findOne({ 'subtasks._id': subtaskId });
    if (!task) return res.status(404).json({ error: 'Subtask not found' });

    const sub = task.subtasks.id(subtaskId);
    if (completed !== undefined) {
      const wasCompleted = sub.completed;
      sub.completed = Boolean(completed);
      if (wasCompleted !== sub.completed) {
        await ActivityLog.create({
          taskId: task._id,
          user: user_id || null,
          action: 'subtask_toggled',
          details: `${sub.completed ? 'Checked' : 'Unchecked'} subtask "${sub.title}"`
        });
      }
    }
    if (title !== undefined) sub.title = title;
    if (due_date !== undefined) sub.dueDate = due_date;
    if (assignee_id !== undefined) sub.assignee = assignee_id;

    await task.save();

    const populated = await Task.findById(task._id).populate('subtasks.assignee', 'name email avatar');
    const updatedSub = populated.subtasks.id(subtaskId);
    res.json(updatedSub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete subtask
router.delete('/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findOne({ 'subtasks._id': req.params.subtaskId });
    if (!task) return res.status(404).json({ error: 'Subtask not found' });

    task.subtasks.pull({ _id: req.params.subtaskId });
    await task.save();

    res.json({ success: true, message: 'Subtask deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
