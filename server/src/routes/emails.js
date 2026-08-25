import express from 'express';
import EmailLog from '../models/EmailLog.js';
import AppSetting from '../models/AppSetting.js';
import { sendEmail, resetTransporter } from '../services/emailService.js';

const router = express.Router();

// Get email logs (Outbox history)
router.get('/logs', async (req, res) => {
  try {
    const { trigger_type, limit = 50 } = req.query;
    const filter = trigger_type ? { triggerType: trigger_type } : {};

    const logs = await EmailLog.find(filter)
      .sort({ sentAt: -1 })
      .limit(parseInt(limit, 10));

    const formatted = logs.map(l => ({
      id: l._id,
      to_email: l.toEmail,
      to_name: l.toName,
      subject: l.subject,
      body_html: l.bodyHtml,
      trigger_type: l.triggerType,
      task_id: l.taskId,
      status: l.status,
      sent_at: l.sentAt
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single email log
router.get('/logs/:id', async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Email log not found' });
    res.json({
      id: log._id,
      to_email: log.toEmail,
      to_name: log.toName,
      subject: log.subject,
      body_html: log.bodyHtml,
      trigger_type: log.triggerType,
      task_id: log.taskId,
      status: log.status,
      sent_at: log.sentAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Render raw HTML email directly in iframe
router.get('/logs/:id/preview', async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id);
    if (!log) return res.status(404).send('Email log not found');
    res.setHeader('Content-Type', 'text/html');
    res.send(log.bodyHtml);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

// Send a test email
router.post('/test', async (req, res) => {
  try {
    const { toEmail, toName, subject, message } = req.body;
    if (!toEmail) return res.status(400).json({ error: 'Recipient email is required' });

    const html = `
      <div style="font-family: -apple-system, sans-serif; padding: 24px; max-width: 580px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #7b68ee 0%, #ff007f 100%); padding: 18px; border-radius: 8px; color: white; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px;">ClickUp Test Dispatch</h2>
        </div>
        <p>Hello <strong>${toName || toEmail}</strong>,</p>
        <p>${message || 'This is a test notification dispatched from your ClickUp clone with MongoDB integration.'}</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Dispatched at: ${new Date().toLocaleString()}</p>
      </div>
    `;

    const result = await sendEmail({
      toEmail,
      toName,
      subject: subject || 'Test Notification from ClickUp Clone',
      html,
      triggerType: 'manual_test'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get SMTP settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await AppSetting.find();
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save SMTP settings
router.post('/settings', async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, from_email } = req.body;
    const entries = { smtp_host, smtp_port, smtp_user, smtp_pass, from_email };

    for (const [key, value] of Object.entries(entries)) {
      if (value !== undefined) {
        await AppSetting.findOneAndUpdate(
          { key },
          { value: String(value) },
          { upsert: true, new: true }
        );
      }
    }

    resetTransporter();
    res.json({ success: true, message: 'Settings saved and transporter refreshed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
