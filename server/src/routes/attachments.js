import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Attachment from '../models/Attachment.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Get attachments for task
router.get('/task/:taskId', async (req, res) => {
  try {
    const files = await Attachment.find({ taskId: req.params.taskId })
      .populate('uploadedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    const formatted = files.map(f => {
      const obj = f.toObject();
      return {
        ...obj,
        id: obj._id,
        uploader_name: obj.uploadedBy?.name,
        uploader_avatar: obj.uploadedBy?.avatar
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload attachment
router.post('/task/:taskId', upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { user_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment = await Attachment.create({
      taskId,
      uploadedBy: user_id || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimetype: req.file.mimetype
    });

    await ActivityLog.create({
      taskId,
      user: user_id || null,
      action: 'attachment_uploaded',
      details: `Uploaded file "${req.file.originalname}"`
    });

    const populated = await Attachment.findById(attachment._id).populate('uploadedBy', 'name email avatar');
    const obj = populated.toObject();
    res.status(201).json({
      ...obj,
      id: obj._id,
      uploader_name: obj.uploadedBy?.name,
      uploader_avatar: obj.uploadedBy?.avatar
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete attachment
router.delete('/:id', async (req, res) => {
  try {
    const file = await Attachment.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'Attachment not found' });

    const diskPath = path.join(uploadDir, file.filename);
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch (e) {}
    }

    await Attachment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
