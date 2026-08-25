import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['super_admin', 'manager', 'employee'], 
    default: 'employee' 
  },
  department: { type: String, default: 'General' },
  avatar: { type: String, default: '' },
  job_title: { type: String, default: '' },
  status: { type: String, default: 'active' },
  isEmailVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  verificationExpires: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
