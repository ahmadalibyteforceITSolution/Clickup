import mongoose from 'mongoose';

const listSchema = new mongoose.Schema({
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true },
  color: { type: String, default: '#8B5CF6' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.List || mongoose.model('List', listSchema);
