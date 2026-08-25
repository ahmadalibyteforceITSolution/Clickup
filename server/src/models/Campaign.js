import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  campaignName: { type: String, required: true, trim: true },
  platform: { 
    type: String, 
    enum: ['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'twitter', 'pinterest', 'google_ads', 'other'],
    default: 'other' 
  },
  url: { type: String, required: true, trim: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['active', 'scheduled', 'completed', 'paused'],
    default: 'active' 
  },
  budget: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  targetAudience: { type: String, default: '' },
  notes: { type: String, default: '' },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
