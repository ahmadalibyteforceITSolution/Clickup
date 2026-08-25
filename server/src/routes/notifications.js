import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get user notifications
async function getUserNotifications(req, res) {
  try {
    const userId = req.params.userId || req.params.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    const formatted = notifications.map(n => ({
      ...n.toObject(),
      id: n._id,
      is_read: n.isRead ? 1 : 0,
      created_at: n.createdAt
    }));

    res.json({ notifications: formatted, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Mark all as read
async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.params.userId || req.params.id;
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

router.get('/:userId', getUserNotifications);
router.get('/user/:userId', getUserNotifications);

router.post('/:userId/read-all', markAllNotificationsRead);
router.put('/read-all/:userId', markAllNotificationsRead);

export default router;
