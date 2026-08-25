import nodemailer from 'nodemailer';
import EmailLog from '../models/EmailLog.js';
import AppSetting from '../models/AppSetting.js';

let transporter = null;

export async function getTransporter() {
  if (transporter) return transporter;

  try {
    const hostRow = await AppSetting.findOne({ key: 'smtp_host' });
    const portRow = await AppSetting.findOne({ key: 'smtp_port' });
    const userRow = await AppSetting.findOne({ key: 'smtp_user' });
    const passRow = await AppSetting.findOne({ key: 'smtp_pass' });

    if (hostRow && userRow && passRow) {
      transporter = nodemailer.createTransport({
        host: hostRow.value,
        port: parseInt(portRow?.value || '587', 10),
        secure: portRow?.value === '465',
        auth: {
          user: userRow.value,
          pass: passRow.value
        }
      });
      return transporter;
    }
  } catch (err) {
    console.warn('Using fallback mock email transporter');
  }

  // Fallback to JSON transporter for robust local operation & preview
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
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
    <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
      
      <!-- ClickUp Header -->
      <div style="background: linear-gradient(135deg, #7b68ee 0%, #ff007f 100%); padding: 24px 30px; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Click<span style="color: #ffde59;">Up</span></span>
              <span style="background: rgba(255,255,255,0.25); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; margin-left: 10px; vertical-align: middle;">Enterprise Hub</span>
            </td>
            <td align="right">
              <span style="background: ${badgeColor}; color: #ffffff; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 6px; display: inline-block;">${badgeText}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Main Body -->
      <div style="padding: 30px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">${title}</h2>
        <div style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
          ${contentHtml}
        </div>

        ${metaItems.length > 0 ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              ${metaRows}
            </table>
          </div>
        ` : ''}

        ${actionBtn ? `
          <div style="text-align: center; margin: 30px 0 15px 0;">
            <a href="${actionBtn.url}" style="background: #7b68ee; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(123, 104, 238, 0.3);">${actionBtn.text}</a>
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="background: #f1f5f9; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0 0 6px 0;">This is an automated security & notification service for ClickUp.</p>
        <p style="margin: 0;">If you did not request this email, please ignore it.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

export async function sendEmail({ toEmail, toName, subject, html, triggerType, taskId = null }) {
  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: '"ClickUp Workspace" <notifications@clickup-app.local>',
      to: `"${toName || toEmail}" <${toEmail}>`,
      subject,
      html
    });

    const emailLog = await EmailLog.create({
      toEmail,
      toName: toName || toEmail,
      subject,
      bodyHtml: html,
      triggerType,
      taskId,
      status: 'delivered'
    });

    return { success: true, logId: emailLog._id, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
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
    return { success: false, error: error.message };
  }
}

/**
 * Send Email Verification Code OTP
 */
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
        <p style="font-size: 12px; color: #64748b; margin-top: 8px;">This code will expire in 15 minutes.</p>
      </div>

      <p>Once verified, you will be able to access your team workspace, manage your assigned tasks, and collaborate in real-time.</p>
    `,
    metaItems: [
      { label: 'Registered Email', value: user.email },
      { label: 'Role Assigned', value: (user.role || 'employee').replace('_', ' ').toUpperCase() },
      { label: 'Department', value: user.department || 'General' }
    ],
    actionBtn: {
      text: 'Verify Account Now',
      url: `http://localhost:5173/?verify_email=${encodeURIComponent(user.email)}&code=${verificationCode}`
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
      url: `http://localhost:5173/?task=${task._id || task.id}`
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
      url: `http://localhost:5173/?view=calendar&task=${task._id || task.id}`
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
      url: `http://localhost:5173/?task=${task._id || task.id}`
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
      url: `http://localhost:5173/?task=${task._id || task.id}`
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
