import { connectDB } from './connection.js';
import User from '../models/User.js';
import Space from '../models/Space.js';
import List from '../models/List.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import ActivityLog from '../models/ActivityLog.js';
import EmailLog from '../models/EmailLog.js';
import Notification from '../models/Notification.js';

export async function clearAllData() {
  console.log('🌱 Connecting to MongoDB Atlas...');
  await connectDB();

  console.log('🧹 Removing all dummy data (users, spaces, lists, tasks, comments, activity)...');
  await Promise.all([
    User.deleteMany({}),
    Space.deleteMany({}),
    List.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    ActivityLog.deleteMany({}),
    EmailLog.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log('✨ All dummy data removed! Database is clean and ready for manual creation.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  clearAllData().then(() => process.exit(0)).catch(err => {
    console.error('Clear Error:', err);
    process.exit(1);
  });
}
