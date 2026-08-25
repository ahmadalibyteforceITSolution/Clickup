# ClickUp Clone (Full-Stack Vue.js + MongoDB + Node/Express + Email Engine)

A complete, feature-rich ClickUp clone application built with **Vue.js 3**, **MongoDB Atlas (Mongoose)**, **Node.js / Express**, and an **Automated Email Notification Engine**.

---

## 🌟 Key Features

1. **Role-Based Task Management**:
   - **Super Admin**: Workspace management, user management, SMTP settings, full task overrides.
   - **Manager**: Create spaces, create lists, assign tasks to employees, schedule start & due dates, review work.
   - **Employee**: View assigned tasks, transition task status (Pending $\rightarrow$ In Progress $\rightarrow$ Review $\rightarrow$ Completed), manage subtasks & checklists, post comments, log time.
   - **Zero localStorage requirement**: State is purely managed reactively via Pinia stores and synced with MongoDB.

2. **Multiple ClickUp Views**:
   - **List View**: Grouped by status or priority with inline checkboxes, due date badges, assignee stacks, and subtask progress.
   - **Kanban Board**: Drag-and-drop columns for Pending, In Progress, Review, and Completed.
   - **Calendar View**: Month-by-month interactive task scheduling grid.
   - **Gantt & Timeline View**: Visual horizontal timeline with duration bars and milestone markers.
   - **Executive Dashboard**: Workload distribution per employee, completion rates, overdue counters, and upcoming deadlines.

3. **Task Details & Collaboration**:
   - Rich descriptions and Markdown.
   - Multi-assignee team member selector with avatars.
   - Priority levels: Urgent (Red), High (Orange), Normal (Blue), Low (Gray).
   - Subtasks & Checklists with progress bars.
   - File attachment upload and download.
   - Comments stream with employee avatars.
   - Activity audit trail logging every change.

4. **Automated Transactional Email Engine**:
   - **Triggers**:
     - Task Assigned to Employee
     - Task Scheduled / Date Updated
     - Task Completed / Status Changed
     - New Comment Added
   - **Email Outbox**: Built-in modal to inspect rendered HTML email templates with ClickUp branding.
   - **SMTP Configuration**: Configurable in workspace settings.

5. **MongoDB Atlas Database**:
   - Database name: **`ClickUp`**
   - Connected directly to MongoDB Atlas cluster with automatic DNS resolution and retry support.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Seed MongoDB Database
Populates sample employees, spaces, tasks, comments, and email outbox logs into your MongoDB `ClickUp` database:
```bash
npm run seed
```

### 3. Start Development Server
Starts the Node backend (port `5000`) and Vue 3 frontend (port `5173`) concurrently:
```bash
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173).
