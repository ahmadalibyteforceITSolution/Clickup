import { connectDB } from './connection.js';
import User from '../models/User.js';
import Space from '../models/Space.js';
import List from '../models/List.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import ActivityLog from '../models/ActivityLog.js';
import EmailLog from '../models/EmailLog.js';
import Notification from '../models/Notification.js';

export async function seed() {
  console.log('🌱 Connecting to MongoDB for database seeding...');
  await connectDB();

  console.log('🧹 Clearing old collections...');
  await Promise.all([
    User.deleteMany({}),
    Space.deleteMany({}),
    List.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    ActivityLog.deleteMany({}),
    EmailLog.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log('👤 Seeding Users & Roles (Super Admin, Managers, Employees)...');
  const createdUsers = await User.insertMany([
    {
      name: 'Alice Johnson',
      email: 'alice.admin@company.com',
      role: 'super_admin',
      department: 'Executive',
      job_title: 'Chief Technology Officer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.manager@company.com',
      role: 'manager',
      department: 'Engineering',
      job_title: 'Engineering Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Sarah Lin',
      email: 'sarah.manager@company.com',
      role: 'manager',
      department: 'Marketing',
      job_title: 'Head of Growth & Marketing',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'David Chen',
      email: 'david.chen@company.com',
      role: 'employee',
      department: 'Engineering',
      job_title: 'Senior Frontend Developer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Emily Watson',
      email: 'emily.watson@company.com',
      role: 'employee',
      department: 'Design',
      job_title: 'Lead Product Designer',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Michael Brown',
      email: 'michael.brown@company.com',
      role: 'employee',
      department: 'Engineering',
      job_title: 'Backend Systems Architect',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Sophia Patel',
      email: 'sophia.patel@company.com',
      role: 'employee',
      department: 'QA & Operations',
      job_title: 'QA Automation Lead',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'James Miller',
      email: 'james.miller@company.com',
      role: 'employee',
      department: 'Marketing',
      job_title: 'Content & Campaign Specialist',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    }
  ]);

  const [alice, marcus, sarah, david, emily, michael, sophia, james] = createdUsers;

  console.log('🏢 Seeding ClickUp Spaces...');
  const spaceEng = await Space.create({
    name: 'Engineering & Product',
    color: '#7B68EE',
    icon: 'code',
    description: 'Platform roadmap, sprints, releases, and architecture design',
    createdBy: marcus._id
  });

  const spaceMktg = await Space.create({
    name: 'Marketing & Growth',
    color: '#FF007F',
    icon: 'megaphone',
    description: 'Growth initiatives, campaigns, social media, and SEO strategy',
    createdBy: sarah._id
  });

  const spaceOps = await Space.create({
    name: 'Client Operations',
    color: '#00C875',
    icon: 'shield-check',
    description: 'Enterprise onboarding, customer success, and infrastructure support',
    createdBy: alice._id
  });

  console.log('📋 Seeding Lists...');
  const listSprint = await List.create({
    spaceId: spaceEng._id,
    name: 'Sprint 42 - Core Platform',
    color: '#7B68EE'
  });

  const listBug = await List.create({
    spaceId: spaceEng._id,
    name: 'Bug Triage & QA',
    color: '#EF4444'
  });

  const listCampaign = await List.create({
    spaceId: spaceMktg._id,
    name: 'Q3 Product Hunt & Growth',
    color: '#FF007F'
  });

  const listOnboarding = await List.create({
    spaceId: spaceOps._id,
    name: 'Enterprise Client Onboarding',
    color: '#00C875'
  });

  // Helper date utility
  const today = new Date();
  const formatDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  console.log('📝 Seeding Tasks, Subtasks, Comments & Email Outbox...');
  
  // Task 1
  const task1 = await Task.create({
    title: 'Architect MongoDB Database Models & Real-Time Email Notification Pipeline',
    description: 'Configure Mongoose models with subtask schemas, index keys, and automated email webhook dispatcher when managers assign tasks.',
    listId: listSprint._id,
    spaceId: spaceEng._id,
    status: 'in_progress',
    priority: 'urgent',
    startDate: formatDate(-3),
    dueDate: formatDate(2),
    timeEstimate: 480,
    timeSpent: 260,
    creator: marcus._id,
    assignees: [david._id, michael._id],
    subtasks: [
      { title: 'Define Mongoose schema for EmailLog & AppSetting', completed: true, dueDate: formatDate(-1), assignee: michael._id },
      { title: 'Create responsive HTML email template with ClickUp gradient branding', completed: true, dueDate: formatDate(0), assignee: david._id },
      { title: 'Add status update email trigger in Express API', completed: false, dueDate: formatDate(1), assignee: michael._id },
      { title: 'Implement live Email Outbox drawer in Vue.js frontend', completed: false, dueDate: formatDate(2), assignee: david._id }
    ]
  });

  await Comment.create([
    { taskId: task1._id, user: marcus._id, content: 'Marcus: David, ensure the email layout renders crisply across mobile and desktop clients.' },
    { taskId: task1._id, user: david._id, content: 'David: Done! Added inline CSS styles and action buttons tested on Gmail and Outlook.' }
  ]);

  await ActivityLog.create([
    { taskId: task1._id, user: marcus._id, action: 'created', details: 'Created task "Architect MongoDB Database Models & Real-Time Email Notification Pipeline"' },
    { taskId: task1._id, user: marcus._id, action: 'assigned', details: 'Assigned task to David Chen and Michael Brown' },
    { taskId: task1._id, user: david._id, action: 'status_changed', details: 'Changed status from pending to in_progress' }
  ]);

  await EmailLog.create({
    toEmail: 'david.chen@company.com',
    toName: 'David Chen',
    subject: '[Assigned] Task "Architect MongoDB Database Models & Real-Time Email Notification Pipeline" has been assigned to you',
    bodyHtml: `
      <div style="font-family: -apple-system, sans-serif; padding: 24px; max-width: 580px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #7b68ee 0%, #ff007f 100%); padding: 18px; border-radius: 8px; color: white; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px;">ClickUp • Task Hub</h2>
        </div>
        <h3 style="color: #0f172a; margin-top: 0;">You were assigned a new task</h3>
        <p style="color: #475569;"><strong>Marcus Vance (Manager)</strong> assigned you to <strong>"Architect MongoDB Database Models & Real-Time Email Notification Pipeline"</strong>.</p>
        <p><strong>Due Date:</strong> ${formatDate(2)}</p>
        <a href="http://localhost:5173/?task=${task1._id}" style="display: inline-block; background: #7b68ee; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Open Task in ClickUp</a>
      </div>
    `,
    triggerType: 'task_assigned',
    taskId: task1._id,
    status: 'delivered'
  });

  // Task 2
  const task2 = await Task.create({
    title: 'Design Dark & Light Theme UI with Interactive Kanban Drag-and-Drop',
    description: 'Implement modern ClickUp aesthetic with clean status cards, smooth drag interactions, priority badges, and quick search.',
    listId: listSprint._id,
    spaceId: spaceEng._id,
    status: 'review',
    priority: 'high',
    startDate: formatDate(-2),
    dueDate: formatDate(1),
    timeEstimate: 360,
    timeSpent: 300,
    creator: marcus._id,
    assignees: [emily._id, david._id],
    subtasks: [
      { title: 'Color palette with dark/light mode toggle', completed: true, dueDate: formatDate(-2), assignee: emily._id },
      { title: 'Column drag-and-drop animations', completed: true, dueDate: formatDate(-1), assignee: david._id },
      { title: 'Accessibility and keyboard navigation review', completed: false, dueDate: formatDate(1), assignee: emily._id }
    ]
  });

  // Task 3
  const task3 = await Task.create({
    title: 'Build Interactive Gantt Chart Timeline View with Progress Bars',
    description: 'Display interactive timeline visualization showing task durations, start dates, due dates, and completion status.',
    listId: listSprint._id,
    spaceId: spaceEng._id,
    status: 'pending',
    priority: 'normal',
    startDate: formatDate(1),
    dueDate: formatDate(7),
    timeEstimate: 600,
    timeSpent: 0,
    creator: marcus._id,
    assignees: [david._id],
    subtasks: [
      { title: 'SVG timeline grid generation', completed: false, dueDate: formatDate(3), assignee: david._id },
      { title: 'Date span calculation & milestone markers', completed: false, dueDate: formatDate(6), assignee: david._id }
    ]
  });

  // Task 4 (Completed)
  const task4 = await Task.create({
    title: 'Setup MongoDB Indexes and Connection Pooling in Express Server',
    description: 'Configure MongoDB compound indexes on task status, dates, and assignees for lightning-fast queries.',
    listId: listSprint._id,
    spaceId: spaceEng._id,
    status: 'completed',
    priority: 'high',
    startDate: formatDate(-6),
    dueDate: formatDate(-1),
    timeEstimate: 240,
    timeSpent: 200,
    creator: alice._id,
    assignees: [michael._id],
    subtasks: [
      { title: 'Add compound index on status and dueDate', completed: true, dueDate: formatDate(-4), assignee: michael._id },
      { title: 'Verify connection retry policy', completed: true, dueDate: formatDate(-2), assignee: michael._id }
    ]
  });

  await EmailLog.create({
    toEmail: 'alice.admin@company.com',
    toName: 'Alice Johnson',
    subject: '[Completed] Task "Setup MongoDB Indexes and Connection Pooling in Express Server" was marked as COMPLETE',
    bodyHtml: `
      <div style="font-family: -apple-system, sans-serif; padding: 24px; max-width: 580px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: #10b981; padding: 18px; border-radius: 8px; color: white; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px;">Task Completed! 🎉</h2>
        </div>
        <p><strong>Michael Brown</strong> marked <strong>"Setup MongoDB Indexes and Connection Pooling in Express Server"</strong> as completed.</p>
        <a href="http://localhost:5173/?task=${task4._id}" style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Completed Task</a>
      </div>
    `,
    triggerType: 'task_completed',
    taskId: task4._id,
    status: 'delivered'
  });

  // Task 5 (Bug QA)
  const task5 = await Task.create({
    title: 'Fix subtask status toggle reactivity on Safari iOS',
    description: 'Ensure subtask checkboxes update immediately and trigger activity logs on touch devices.',
    listId: listBug._id,
    spaceId: spaceEng._id,
    status: 'pending',
    priority: 'urgent',
    startDate: formatDate(-1),
    dueDate: formatDate(0),
    timeEstimate: 120,
    timeSpent: 40,
    creator: sophia._id,
    assignees: [david._id, sophia._id]
  });

  // Task 6 (Marketing Campaign)
  const task6 = await Task.create({
    title: 'Launch Q3 Product Hunt Feature Sequence & Video Teaser',
    description: 'Deploy promotional assets, animated product GIFs, and launch broadcast to user community.',
    listId: listCampaign._id,
    spaceId: spaceMktg._id,
    status: 'in_progress',
    priority: 'urgent',
    startDate: formatDate(-4),
    dueDate: formatDate(3),
    timeEstimate: 540,
    timeSpent: 340,
    creator: sarah._id,
    assignees: [james._id, emily._id]
  });

  // Task 7 (Enterprise Onboarding)
  const task7 = await Task.create({
    title: 'Configure SAML Single Sign-On for Acme Enterprise Client',
    description: 'Setup SAML 2.0 identity provider integration and SCIM directory sync.',
    listId: listOnboarding._id,
    spaceId: spaceOps._id,
    status: 'completed',
    priority: 'high',
    startDate: formatDate(-8),
    dueDate: formatDate(-2),
    timeEstimate: 700,
    timeSpent: 680,
    creator: alice._id,
    assignees: [michael._id, marcus._id]
  });

  console.log('✅ MongoDB Database seeded successfully with Users, Spaces, Lists, Tasks, Subtasks, Comments, Activity Logs, and Email Logs!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}
