import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const spaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: '#7B68EE' },
  icon: { type: String, default: 'folder' },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  folders: [folderSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Space || mongoose.model('Space', spaceSchema);
