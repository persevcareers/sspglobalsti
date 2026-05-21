# SSP Global - STI TrackSuite

A **Software Training Institute (STI) management platform** built for SSP Global. TrackSuite provides end-to-end administration of students, courses, batches, trainers, schedules, leads, and user sessions with role-based access control.

> **Live Demo:** [https://tracking-app-omega-three.vercel.app](https://tracking-app-omega-three.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **UI** | Tailwind CSS 4, Radix UI, shadcn/ui |
| **Auth** | Clerk (v7) |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Backend** | Google Apps Script + Google Sheets |
| **Notifications** | sonner (in-app) + Web Notification API |
| **Animations** | Framer Motion |

---

## Features

### Core Modules
- **Dashboard** — Stats overview, online users widget, real-time activity feed
- **Students** — CRUD with search and progress tracking
- **Courses** — Course catalog with active/inactive status
- **Batches** — Batch management linked to courses and trainers
- **Trainers** — Trainer profiles with specialization
- **Schedules** — Daily schedule tracker with IST timezone, bulk creation, status workflow (Scheduled → Running → Completed / Cancelled / Holiday / Postponed)
- **Leads** — Lead management with source tracking and follow-up dates
- **Analytics** — Charts for lead sources, student status distribution, enrollment trends, batch progress

### User & Session Management
- **Clerk Authentication** — Sign-up / sign-in with email + password
- **Role-Based Access** — Super Admin, Admin, Trainer, Student, HR, Staff with route-level middleware
- **User Session Tracking** — Login/logout timestamps, last active heartbeat (2 min), idle detection (15 min)
- **Online Users Widget** — Live view of currently active users with status badges
- **Activity Tracking** — Mouse/keyboard/scroll idle detection with automatic status updates

### Notifications
- **In-App Bell** — Notification dropdown with unread count badge (polls every 10s)
- **Desktop Notifications** — Browser Notification API for background tab alerts
- **Event Notifications** — On signup (welcome), login (session started), and bulk schedule creation

### UI/UX
- **Responsive** — Mobile-first with collapsible sidebar
- **Dark Mode** — System-aware theme toggle via `next-themes`
- **Optimistic Updates** — Instant UI feedback on creates/updates/deletes with rollback on failure
- **Loading Skeletons** — Shimmer placeholders during data fetches
- **Toast Notifications** — Success/error toasts via sonner

---

## Project Structure

```
tracking-app/
├── apps-script/          # Google Apps Script backend
│   ├── Code.gs           # API handlers (login, logout, CRUD, notifications)
│   └── Setup.gs          # Sheet setup & role seeding
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── dashboard/    # Dashboard & sub-pages (students, courses, etc.)
│   │   ├── sign-in/      # Clerk sign-in page
│   │   └── sign-up/      # Clerk sign-up page
│   ├── components/
│   │   ├── charts/       # Reusable chart components
│   │   ├── common/       # Theme provider, UserSync, loading skeletons
│   │   ├── dashboard/    # Online users widget, etc.
│   │   ├── forms/        # Form components (ScheduleForm, TrainerForm, etc.)
│   │   ├── layout/       # Navbar, Sidebar
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom hooks (useSheetsData, useActivityTracking, useNotifications)
│   ├── services/         # API layer (safeFetch, cache, deduplication)
│   ├── constants/        # Shared constants
│   ├── types/            # TypeScript interfaces
│   └── proxy.ts          # Clerk route protection middleware
└── .env.local            # Environment variables (see setup below)
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Google Account (for Apps Script + Sheets)
- Clerk Account

### 1. Clone & Install

```bash
git clone https://github.com/Jayakrishnasai/SSP-Global_STI_TS.git
cd tracking-app
npm install
```

### 2. Set Up Clerk

1. Create an app at [clerk.com](https://clerk.com)
2. Go to **Users & Authentication** → **Email, Phone, Username** → enable **Email**
3. Go to **Sessions** → set session lifetime as needed
4. Copy the **Publishable Key** and **Secret Key**

### 3. Set Up Google Apps Script

1. Create a new Google Sheet
2. Go to **Extensions → Apps Script**
3. Copy the contents of `apps-script/Setup.gs` and `apps-script/Code.gs` into the editor
4. Run the `setupSheets()` function to create all sheets
5. **Deploy → New Deployment** → **Web App**:
   - Execute as: **Me**
   - Access: **Anyone**
6. Copy the deployment URL

### 4. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Set User Roles in Clerk

For each user, go to **Clerk Dashboard → Users → [user] → Metadata** and add:

```json
{
  "role": "Super Admin"
}
```

Available roles: `Super Admin`, `Admin`, `Trainer`, `Student`, `HR`, `Staff`

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

---

## Data Model

| Sheet | Key Columns |
|-------|-------------|
| **Students** | Student ID, Full Name, Email, Course, Batch, Status, Progress |
| **Courses** | Course ID, Name, Modules, Duration, Status |
| **DailySchedules** | Task ID, Batch Name, Date, Start/End Time, Status, Notes |
| **Leads** | Lead ID, Name, Contact, Source, Course, Status, Follow-up |
| **Trainers** | Trainer ID, Name, Email, Phone, Specialization, Status |
| **Batches** | Batch ID, Name, Course, Trainer, Start Date, Status |
| **Users** | User ID, Name, Email, Role, Login/Logout Time, Last Active, Status |
| **SessionLogs** | Log ID, User ID, Login/Logout Time, Duration, Device, Browser, IP |
| **LoginLogs** | Log ID, User ID, Action (Signup/Login/Logout), Timestamp |
| **Notifications** | Notification ID, User ID, Title, Message, Type, Link, Is Read |
| **Roles** | Role Name, Permissions |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Architecture

```
Browser ──► Clerk (Auth) ──► Next.js App ──► Google Apps Script ──► Google Sheets
                      │                        │
                      └── Session tokens        └── CRUD operations + session tracking
```

- **No database server** — Google Sheets acts as the operational data store via Apps Script REST API
- **30s in-memory cache** on read requests to mitigate Sheets latency
- **Request deduplication** prevents concurrent duplicate fetches
- **Optimistic UI updates** for all mutations with automatic rollback on failure
- **Beacon API** for reliable logout detection on tab close

---

## Performance Considerations

- Google Sheets has **1–3s latency** per operation. The app uses in-memory caching (30s TTL) and optimistic updates to mask this.
- For production scale, consider migrating to **Supabase** (PostgreSQL).
- Activity heartbeats are throttled to 2-minute intervals.
- Notification polling runs every 10 seconds.

---

## Deployment

The app is deployed on **Vercel**. To deploy your own:

1. Push to GitHub
2. Import repo in Vercel
3. Set environment variables in Vercel Dashboard
4. Deploy

---

## License

Private — SSP Global
