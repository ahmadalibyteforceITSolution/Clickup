import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import EmailLog from '../models/EmailLog.js';
import AppSetting from '../models/AppSetting.js';
import dotenv from 'dotenv';

dotenv.config();

// Live production URL configured for emails (supports custom env override)
const APP_BASE_URL = process.env.APP_URL || process.env.CLIENT_URL || 'https://clickup-dun.vercel.app';

let transporter = null;

export async function getTransporter() {
  if (transporter) return transporter;

  // 1. Check environment variables first
  const envHost = process.env.SMTP_HOST;
  const envPort = process.env.SMTP_PORT;
  const envUser = process.env.SMTP_USER;
  const envPass = process.env.SMTP_PASS;

  if (envUser && envPass) {
    if (envUser.includes('@gmail.com') || envHost?.includes('gmail')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: envUser,
          pass: envPass.replace(/\s+/g, '') // remove spaces from App Password
        }
      });
      return transporter;
    }

    transporter = nodemailer.createTransport({
      host: envHost || 'smtp.gmail.com',
      port: parseInt(envPort || '465', 10),
      secure: envPort === '465' || !envPort,
      auth: {
        user: envUser,
        pass: envPass.replace(/\s+/g, '')
      }
    });
    return transporter;
  }

  // 2. Check MongoDB app_settings
  try {
    if (mongoose.connection.readyState === 1) {
      const hostRow = await AppSetting.findOne({ key: 'smtp_host' });
      const portRow = await AppSetting.findOne({ key: 'smtp_port' });
      const userRow = await AppSetting.findOne({ key: 'smtp_user' });
      const passRow = await AppSetting.findOne({ key: 'smtp_pass' });

      if (userRow && passRow) {
        if (userRow.value.includes('@gmail.com')) {
          transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: userRow.value,
              pass: passRow.value.replace(/\s+/g, '')
            }
          });
          return transporter;
        }

        transporter = nodemailer.createTransport({
          host: hostRow?.value || 'smtp.gmail.com',
          port: parseInt(portRow?.value || '587', 10),
          secure: portRow?.value === '465',
          auth: {
            user: userRow.value,
            pass: passRow.value.replace(/\s+/g, '')
          }
        });
        return transporter;
      }
    }
  } catch (err) {
    console.warn('Using fallback mock email transporter');
  }

  // Fallback to JSON transporter
  transporter = nodemailer.createTransport({
    jsonTransport: true
  });

  return transporter;
}

export function resetTransporter() {
  transporter = null;
}

function createEmailTemplate({ title, badgeText, badgeColor = '#7b68ee', contentHtml, metaItems = [], actionBtn }) {
  const metaRows = metaItems.map(item => `
    <tr>
      <td style="padding: 8px 12px; font-weight: 600; color: #64748b; font-size: 13px; width: 130px; border-bottom: 1px solid #f1f5f9;">${item.label}:</td>
      <td style="padding: 8px 12px; color: #1e293b; font-size: 13px; font-weight: 500; border-bottom: 1px solid #f1f5f9;">${item.value}</td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc;">
    <div style="max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      
      <!-- ClickUp Top Header -->
      <div style="background: linear-gradient(135deg, #7b68ee 0%, #4f46e5 100%); padding: 24px 30px; text-align: left; position: relative;">
        <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 10px;">
          CLICKUP WORKSPACE
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${title}</h1>
      </div>

      <!-- Main Body -->
      <div style="padding: 30px;">
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">
            ${badgeText}
          </span>
        </div>

        <div style="color: #334155; font-size: 14px; margin-bottom: 24px;">
          ${contentHtml}
        </div>

        ${metaItems.length > 0 ? `
        <!-- Meta Details Table -->
        <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; overflow: hidden; margin-bottom: 24px; border: 1px solid #f1f5f9;">
          <tbody>
            ${metaRows}
          </tbody>
        </table>
        ` : ''}

        ${actionBtn ? `
        <!-- Action Call-To-Action Button -->
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${actionBtn.url}" style="display: inline-block; background: linear-gradient(135deg, #7b68ee 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 10px rgba(123, 104, 238, 0.3);">
            ${actionBtn.text} &rarr;
          </a>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 10px; word-break: break-all;">
            Direct link: <a href="${actionBtn.url}" style="color: #7b68ee;">${actionBtn.url}</a>
          </p>
        </div>
        ` : ''}

      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 6px 0;">This is an automated notification from your ClickUp Workspace.</p>
        <p style="margin: 0;">Manage your notification settings in ClickUp Preferences.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

export async function sendEmail({ toEmail, toName, subject, html, triggerType, taskId = null }) {
  try {
    const client = await getTransporter();
    const fromAddr = process.env.FROM_EMAIL || process.env.SMTP_USER || 'notifications@clickup-app.local';

    const info = await client.sendMail({
      from: `"ClickUp Workspace" <${fromAddr}>`,
      to: `"${toName || toEmail}" <${toEmail}>`,
      subject,
      html
    });

    console.log(`✉️ Email dispatched to ${toEmail} | Message ID: ${info.messageId}`);

    let logId = null;
    if (mongoose.connection.readyState === 1) {
      try {
        const emailLog = await EmailLog.create({
          toEmail,
          toName: toName || toEmail,
          subject,
          bodyHtml: html,
          triggerType,
          taskId,
          status: 'delivered'
        });
        logId = emailLog._id;
      } catch (logErr) {
        console.warn('Could not save email log to DB:', logErr.message);
      }
    }

    return { success: true, logId, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    if (mongoose.connection.readyState === 1) {
      try {
        await EmailLog.create({
          toEmail,
          toName: toName || toEmail,
          subject,
          bodyHtml: html,
          triggerType,
          taskId,
          status: 'failed: ' + error.message
        });
      } catch (e) {
        console.error('Failed to log email error:', e);
      }
    }
    return { success: false, error: error.message };
  }
}

export async function notifyEmailVerification({ user, verificationCode }) {
  const subject = `[ClickUp] Verify Your Email Address - Code: ${verificationCode}`;

  const html = createEmailTemplate({
    title: `Verify your ClickUp Account`,
    badgeText: 'SECURITY',
    badgeColor: '#10b981',
    contentHtml: `
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Thank you for registering on ClickUp. Please use the following 6-digit verification code to confirm your email address and activate your account:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <div style="display: inline-block; background: #f3f0ff; border: 2px dashed #7b68ee; border-radius: 12px; padding: 16px 36px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #6d28d9; font-family: monospace;">${verificationCode}</span>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 8px;">This code will expire in 30 minutes.</p>
      </div>

      <p>Once verified, you will be able to access your team workspace, manage your assigned tasks, and collaborate in real-time.</p>
    `,
    metaItems: [
      { label: 'Registered Email', value: user.email },
      { label: 'Role Assigned', value: (user.role || 'employee').replace('_', ' ').toUpperCase() },
      { label: 'Department', value: user.department || 'General' }
    ],
    actionBtn: {
      text: 'Open ClickUp Workspace',
      url: `${APP_BASE_URL}/`
    }
  });

  return sendEmail({
    toEmail: user.email,
    toName: user.name,
    subject,
    html,
    triggerType: 'manual_test'
  });
}

export async function notifyTaskAssigned({ task, assignee, assignedBy }) {
  const subject = `[Assigned] Task "${task.title}" has been assigned to you`;
  const priorityColors = { urgent: '#ef4444', high: '#f97316', normal: '#3b82f6', low: '#64748b' };

  const html = createEmailTemplate({
    title: `You were assigned a new task`,
    badgeText: task.priority ? task.priority.toUpperCase() : 'NORMAL',
    badgeColor: priorityColors[task.priority] || '#7b68ee',
    contentHtml: `
      <p>Hello <strong>${assignee.name}</strong>,</p>
      <p><strong>${assignedBy.name}</strong> (${(assignedBy.role || 'manager').replace('_', ' ').toUpperCase()}) has assigned a new task to you in ClickUp.</p>
      <div style="padding: 14px 18px; background: #faf5ff; border-left: 4px solid #7b68ee; border-radius: 6px; margin: 16px 0; color: #4c1d95; font-weight: 500;">
        ${task.description || 'No description provided.'}
      </div>
    `,
    metaItems: [
      { label: 'Task Title', value: task.title },
      { label: 'Status', value: task.status ? task.status.replace('_', ' ').toUpperCase() : 'PENDING' },
      { label: 'Priority', value: task.priority ? task.priority.toUpperCase() : 'NORMAL' },
      { label: 'Start Date', value: task.startDate || 'Not specified' },
      { label: 'Due Date', value: task.dueDate || 'No due date set' },
      { label: 'Assigned By', value: `${assignedBy.name} (${assignedBy.email})` }
    ],
    actionBtn: {
      text: 'Open Task in ClickUp',
      url: `${APP_BASE_URL}/?task=${task._id || task.id}`
    }
  });

  return sendEmail({
    toEmail: assignee.email,
    toName: assignee.name,
    subject,
    html,
    triggerType: 'task_assigned',
    taskId: task._id || task.id
  });
}

export async function notifyTaskScheduled({ task, user }) {
  const subject = `[Scheduled] Due date updated for "${task.title}"`;
  const html = createEmailTemplate({
    title: `Task Schedule Updated`,
    badgeText: 'SCHEDULED',
    badgeColor: '#0ea5e9',
    contentHtml: `
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>The timeline and schedule for task <strong>"${task.title}"</strong> has been updated.</p>
    `,
    metaItems: [
      { label: 'Task', value: task.title },
      { label: 'Start Date', value: task.startDate || 'None' },
      { label: 'Due Date', value: task.dueDate || 'None' },
      { label: 'Status', value: task.status ? task.status.replace('_', ' ').toUpperCase() : 'PENDING' }
    ],
    actionBtn: {
      text: 'View in Calendar / Timeline',
      url: `${APP_BASE_URL}/?view=calendar&task=${task._id || task.id}`
    }
  });

  return sendEmail({
    toEmail: user.email,
    toName: user.name,
    subject,
    html,
    triggerType: 'task_scheduled',
    taskId: task._id || task.id
  });
}

export async function notifyStatusChange({ task, user, oldStatus, newStatus, changedBy }) {
  const isCompleted = newStatus === 'completed';
  const subject = isCompleted 
    ? `[Completed] Task "${task.title}" was marked as COMPLETE`
    : `[Status Update] "${task.title}" changed to ${newStatus.replace('_', ' ').toUpperCase()}`;

  const html = createEmailTemplate({
    title: isCompleted ? `🎉 Task Completed!` : `Task Status Updated`,
    badgeText: newStatus.replace('_', ' ').toUpperCase(),
    badgeColor: isCompleted ? '#10b981' : (newStatus === 'in_progress' ? '#3b82f6' : '#f59e0b'),
    contentHtml: `
      <p>Hello <strong>${user.name}</strong>,</p>
      <p><strong>${changedBy.name}</strong> updated the status of <strong>"${task.title}"</strong> from <span style="background:#e2e8f0; padding:3px 8px; border-radius:4px;">${oldStatus}</span> to <span style="background:#dbeafe; color:#1e40af; font-weight:600; padding:3px 8px; border-radius:4px;">${newStatus}</span>.</p>
    `,
    metaItems: [
      { label: 'Task', value: task.title },
      { label: 'Updated By', value: changedBy.name },
      { label: 'New Status', value: newStatus.replace('_', ' ').toUpperCase() },
      { label: 'Due Date', value: task.dueDate || 'None' }
    ],
    actionBtn: {
      text: 'Review Task Details',
      url: `${APP_BASE_URL}/?task=${task._id || task.id}`
    }
  });

  return sendEmail({
    toEmail: user.email,
    toName: user.name,
    subject,
    html,
    triggerType: isCompleted ? 'task_completed' : 'status_changed',
    taskId: task._id || task.id
  });
}

export async function notifyNewComment({ task, comment, author, recipient }) {
  const subject = `[New Comment] ${author.name} commented on "${task.title}"`;

  const html = createEmailTemplate({
    title: `New Comment on Task`,
    badgeText: 'COMMENT',
    badgeColor: '#8b5cf6',
    contentHtml: `
      <p>Hello <strong>${recipient.name}</strong>,</p>
      <p><strong>${author.name}</strong> left a comment on <strong>"${task.title}"</strong>:</p>
      <div style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 14px; border-radius: 4px; font-style: italic; color: #334155; margin: 16px 0;">
        "${comment.content}"
      </div>
    `,
    metaItems: [
      { label: 'Task', value: task.title },
      { label: 'Commented by', value: `${author.name} (${author.role})` },
      { label: 'Task Status', value: task.status.replace('_', ' ').toUpperCase() }
    ],
    actionBtn: {
      text: 'Reply to Comment',
      url: `${APP_BASE_URL}/?task=${task._id || task.id}`
    }
  });

  return sendEmail({
    toEmail: recipient.email,
    toName: recipient.name,
    subject,
    html,
    triggerType: 'task_comment',
    taskId: task._id || task.id
  });
}
