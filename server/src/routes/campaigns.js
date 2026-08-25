import express from 'express';
import multer from 'multer';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all campaigns with search & filter
router.get('/', async (req, res) => {
  try {
    const { platform, status, search, assignee_id } = req.query;
    const filter = {};

    if (platform && platform !== 'all') {
      filter.platform = platform.toLowerCase();
    }
    if (status && status !== 'all') {
      filter.status = status.toLowerCase();
    }
    if (assignee_id) {
      filter.assignee = assignee_id;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { campaignName: regex },
        { url: regex },
        { targetAudience: regex },
        { notes: regex }
      ];
    }

    const campaigns = await Campaign.find(filter)
      .populate('assignee', 'name email avatar role department')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create campaign link
router.post('/', async (req, res) => {
  try {
    const { 
      campaignName, platform = 'other', url, assignee, status = 'active', 
      budget = 0, clicks = 0, impressions = 0, targetAudience = '', notes = '',
      startDate, endDate, created_by 
    } = req.body;

    if (!campaignName || !campaignName.trim()) {
      return res.status(400).json({ error: 'Campaign Name is required' });
    }
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'Social / Campaign URL is required' });
    }

    const campaign = await Campaign.create({
      campaignName: campaignName.trim(),
      platform: (platform || 'other').toLowerCase(),
      url: url.trim(),
      assignee: assignee || null,
      status: (status || 'active').toLowerCase(),
      budget: Number(budget) || 0,
      clicks: Number(clicks) || 0,
      impressions: Number(impressions) || 0,
      targetAudience: targetAudience || '',
      notes: notes || '',
      startDate: startDate || null,
      endDate: endDate || null,
      createdBy: created_by || null
    });

    const populated = await Campaign.findById(campaign._id)
      .populate('assignee', 'name email avatar role department')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update campaign link
router.put('/:id', async (req, res) => {
  try {
    const { 
      campaignName, platform, url, assignee, status, budget, clicks, 
      impressions, targetAudience, notes, startDate, endDate 
    } = req.body;

    const updates = {};
    if (campaignName !== undefined) updates.campaignName = campaignName.trim();
    if (platform !== undefined) updates.platform = platform.toLowerCase();
    if (url !== undefined) updates.url = url.trim();
    if (assignee !== undefined) updates.assignee = assignee || null;
    if (status !== undefined) updates.status = status.toLowerCase();
    if (budget !== undefined) updates.budget = Number(budget) || 0;
    if (clicks !== undefined) updates.clicks = Number(clicks) || 0;
    if (impressions !== undefined) updates.impressions = Number(impressions) || 0;
    if (targetAudience !== undefined) updates.targetAudience = targetAudience;
    if (notes !== undefined) updates.notes = notes;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;

    const updated = await Campaign.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('assignee', 'name email avatar role department')
      .populate('createdBy', 'name email');

    if (!updated) return res.status(404).json({ error: 'Campaign not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete campaign link
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Campaign.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true, message: 'Campaign link deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for CSV line parsing
function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

// Import CSV endpoint
router.post('/import-csv', upload.single('file'), async (req, res) => {
  try {
    let csvText = '';
    if (req.file) {
      csvText = req.file.buffer.toString('utf-8');
    } else if (req.body.csvData) {
      csvText = req.body.csvData;
    } else {
      return res.status(400).json({ error: 'No CSV file or data provided' });
    }

    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file must have a header row and at least 1 data row' });
    }

    const headerRow = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Detect column indexes
    const colMap = {
      campaignName: headerRow.findIndex(h => h.includes('campaign') || h.includes('title') || h.includes('name')),
      platform: headerRow.findIndex(h => h.includes('platform') || h.includes('social') || h.includes('channel') || h.includes('network')),
      url: headerRow.findIndex(h => h.includes('url') || h.includes('link') || h.includes('post') || h.includes('website')),
      status: headerRow.findIndex(h => h.includes('status') || h.includes('state')),
      budget: headerRow.findIndex(h => h.includes('budget') || h.includes('spend') || h.includes('cost')),
      clicks: headerRow.findIndex(h => h.includes('click')),
      impressions: headerRow.findIndex(h => h.includes('impression') || h.includes('reach') || h.includes('view')),
      targetAudience: headerRow.findIndex(h => h.includes('audience') || h.includes('target') || h.includes('category')),
      notes: headerRow.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('description'))
    };

    if (colMap.campaignName === -1 && colMap.url === -1) {
      return res.status(400).json({ error: 'CSV must contain at least "Campaign Name" and "Link/URL" columns' });
    }

    const docsToInsert = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length === 0 || row.every(cell => !cell)) continue;

      const campaignName = (colMap.campaignName !== -1 ? row[colMap.campaignName] : '') || `Campaign #${i}`;
      const rawUrl = (colMap.url !== -1 ? row[colMap.url] : '') || '';
      if (!rawUrl && !campaignName) continue;

      const platformVal = (colMap.platform !== -1 ? row[colMap.platform] : 'other') || 'other';
      const statusVal = (colMap.status !== -1 ? row[colMap.status] : 'active') || 'active';
      const budgetVal = colMap.budget !== -1 ? parseFloat(row[colMap.budget]?.replace(/[^0-9.]/g, '')) || 0 : 0;
      const clicksVal = colMap.clicks !== -1 ? parseInt(row[colMap.clicks]?.replace(/[^0-9]/g, ''), 10) || 0 : 0;
      const impressionsVal = colMap.impressions !== -1 ? parseInt(row[colMap.impressions]?.replace(/[^0-9]/g, ''), 10) || 0 : 0;
      const targetAudienceVal = colMap.targetAudience !== -1 ? row[colMap.targetAudience] || '' : '';
      const notesVal = colMap.notes !== -1 ? row[colMap.notes] || '' : '';

      docsToInsert.push({
        campaignName: campaignName.trim(),
        platform: platformVal.toLowerCase().replace(/\s+/g, '_'),
        url: rawUrl.trim() || 'https://',
        status: ['active', 'scheduled', 'completed', 'paused'].includes(statusVal.toLowerCase()) ? statusVal.toLowerCase() : 'active',
        budget: budgetVal,
        clicks: clicksVal,
        impressions: impressionsVal,
        targetAudience: targetAudienceVal,
        notes: notesVal,
        createdBy: req.body.user_id || null
      });
    }

    if (docsToInsert.length === 0) {
      return res.status(400).json({ error: 'No valid data rows found in CSV' });
    }

    const inserted = await Campaign.insertMany(docsToInsert);
    res.status(201).json({
      success: true,
      importedCount: inserted.length,
      message: `Successfully imported ${inserted.length} SMM campaign records`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import CSV: ' + error.message });
  }
});

// Export CSV endpoint
router.get('/export-csv', async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    const headers = [
      'Campaign Name',
      'Platform',
      'Campaign Link / URL',
      'Status',
      'Budget ($)',
      'Clicks',
      'Impressions',
      'Target Audience',
      'Assignee Name',
      'Assignee Email',
      'Notes',
      'Created Date'
    ];

    function escapeCSV(val) {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const rows = campaigns.map(c => [
      escapeCSV(c.campaignName),
      escapeCSV(c.platform),
      escapeCSV(c.url),
      escapeCSV(c.status),
      escapeCSV(c.budget),
      escapeCSV(c.clicks),
      escapeCSV(c.impressions),
      escapeCSV(c.targetAudience),
      escapeCSV(c.assignee?.name || 'Unassigned'),
      escapeCSV(c.assignee?.email || ''),
      escapeCSV(c.notes),
      escapeCSV(c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="smm_campaigns_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download sample CSV template
router.get('/sample-template', (req, res) => {
  const sampleHeaders = 'Campaign Name,Platform,Campaign Link / URL,Status,Budget ($),Clicks,Impressions,Target Audience,Notes';
  const sampleRows = [
    '"Summer Apparel Promo","instagram","https://instagram.com/p/sample123","active",500,1250,45000,"Fashion & Teens","Influencer story tag"',
    '"Tech Product Launch","facebook","https://facebook.com/ads/sample456","active",1200,3400,98000,"Tech Enthusiasts 18-35","Carousel ad targeting"',
    '"Viral Brand Dance","tiktok","https://tiktok.com/@brand/video/789","active",800,8900,240000,"Gen Z Trendsetters","Spark ad booster"',
    '"B2B Enterprise SaaS","linkedin","https://linkedin.com/posts/sample012","scheduled",2000,620,15000,"CTOs and Tech Leads","Lead gen form link"'
  ];

  const csv = [sampleHeaders, ...sampleRows].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sample_smm_template.csv"');
  res.send(csv);
});

export default router;
