import express from 'express';
import Space from '../models/Space.js';
import List from '../models/List.js';
import Task from '../models/Task.js';

const router = express.Router();

// Get all spaces with their nested folders and lists + task counts
router.get('/', async (req, res) => {
  try {
    const spaces = await Space.find().populate('createdBy', 'name email avatar role').sort({ name: 1 });
    const lists = await List.find().sort({ name: 1 });

    // Count tasks per list
    const taskCounts = await Task.aggregate([
      { $group: { _id: '$listId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    taskCounts.forEach(tc => {
      countMap[String(tc._id)] = tc.count;
    });

    const enrichedLists = lists.map(l => ({
      ...l.toObject(),
      task_count: countMap[String(l._id)] || 0
    }));

    const result = spaces.map(space => {
      const spaceObj = space.toObject();
      const spaceFolders = (spaceObj.folders || []).map(folder => ({
        ...folder,
        lists: enrichedLists.filter(l => String(l.folderId) === String(folder._id))
      }));

      const directLists = enrichedLists.filter(l => 
        String(l.spaceId) === String(space._id) && (!l.folderId || l.folderId === null)
      );

      return {
        ...spaceObj,
        folders: spaceFolders,
        lists: directLists
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new space
router.post('/', async (req, res) => {
  try {
    const { name, color = '#7B68EE', icon = 'folder', description = '', created_by } = req.body;
    if (!name) return res.status(400).json({ error: 'Space name is required' });

    const space = await Space.create({
      name,
      color,
      icon,
      description,
      createdBy: created_by || null
    });

    // Create default "General Tasks" list
    const list = await List.create({
      spaceId: space._id,
      name: 'General Tasks',
      color
    });

    const populated = await Space.findById(space._id).populate('createdBy', 'name email avatar');
    res.status(201).json({
      ...populated.toObject(),
      folders: [],
      lists: [{ ...list.toObject(), task_count: 0 }]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create folder inside space
router.post('/:spaceId/folders', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Folder name is required' });

    const space = await Space.findById(req.params.spaceId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    space.folders.push({ name });
    await space.save();

    const createdFolder = space.folders[space.folders.length - 1];
    res.status(201).json(createdFolder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create list inside space or folder
router.post('/:spaceId/lists', async (req, res) => {
  try {
    const { name, folder_id = null, color = '#8b5cf6' } = req.body;
    if (!name) return res.status(400).json({ error: 'List name is required' });

    const list = await List.create({
      spaceId: req.params.spaceId,
      folderId: folder_id || null,
      name,
      color
    });

    res.status(201).json({ ...list.toObject(), task_count: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete space
router.delete('/:id', async (req, res) => {
  try {
    await Space.findByIdAndDelete(req.params.id);
    await List.deleteMany({ spaceId: req.params.id });
    await Task.deleteMany({ spaceId: req.params.id });
    res.json({ success: true, message: 'Space deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
