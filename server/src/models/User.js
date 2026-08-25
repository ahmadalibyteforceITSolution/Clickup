import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'manager', 'employee'], 
    default: 'employee' 
  },
  department: { type: String, default: 'General' },
  avatar: { type: String, default: '' },
  job_title: { type: String, default: '' },
  status: { type: String, default: 'active' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
