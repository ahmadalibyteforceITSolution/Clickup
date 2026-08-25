import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  toEmail: { type: String, required: true },
  toName: { type: String, default: '' },
  subject: { type: String, required: true },
  bodyHtml: { type: String, required: true },
  triggerType: { 
    type: String, 
    enum: ['task_assigned', 'task_scheduled', 'status_changed', 'task_completed', 'task_comment', 'manual_test'],
    required: true 
  },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  status: { type: String, default: 'delivered' },
  sentAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

emailLogSchema.index({ sentAt: -1 });

export default mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);
