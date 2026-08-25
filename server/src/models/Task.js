import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  dueDate: { type: String, default: null },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true
});

const taskSchema = new mongoose.Schema({
  listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'review', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal', 'low'],
    default: 'normal'
  },
  startDate: { type: String, default: null },
  dueDate: { type: String, default: null },
  timeEstimate: { type: Number, default: 0 }, // in minutes
  timeSpent: { type: Number, default: 0 },    // in minutes
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subtasks: [subtaskSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ assignees: 1 });

export default mongoose.models.Task || mongoose.model('Task', taskSchema);
