# SSP Global STI

An **Internal Application** for SSP Global STI. Handles end-to-end administration of students, courses, batches, trainers, schedules, leads, and user sessions with role-based access control — all powered by Google Sheets as the operational data store. All timestamps across the entire stack (frontend, API, Apps Script) use **Indian Standard Time (IST, UTC+05:30)** — no UTC timestamps are stored or displayed to users.

> **Live:** [ssp-global-sti-ts.vercel.app](https://ssp-global-sti-ts.vercel.app)

---

## Tech Stack

| Layer | |
|-------|-|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **UI** | Tailwind CSS 4, Radix UI, shadcn/ui |
| **Auth** | Clerk v7 |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Backend** | Google Apps Script + Google Sheets |
| **Notifications** | sonner (in-app) + Web Notification API |
| **Animations** | Framer Motion |

---

## Features

### Core Modules
- **Dashboard** — Stats overview, online users widget, real-time activity feed
- **Calendar** — Enterprise FullCalendar integration with Month/Week/Day/Agenda views, drag-and-drop rescheduling, batch color coding, trainer filtering, live session indicators, event detail drawer, premium dark theme
- **Students** — Full CRUD with search (debounced) and progress tracking
- **Courses** — Premium course management with stat cards, module chip system (auto-categorized by DevOps/Cloud/Programming/AI-ML etc.), color-coded category icons, overflow handling, hover tooltips, course detail drawer with learning path visualization and module accordion
- **Batches** — Batch management linked to courses and trainers with status badges, progress bars, filter bar
- **Trainers** — Trainer profiles with specialization
- **Schedules** — Daily schedule tracker (IST timezone), bulk creation, status workflow (Scheduled → Running → Completed / Cancelled / Holiday / Postponed / PAP), dual view mode (Table + Timeline)
- **Leads** — Lead management with source tracking and follow-up dates
- **Analytics** — Charts for lead sources, student status distribution, enrollment trends, batch progress; cached metrics with manual refresh
- **Settings** — Profile, Appearance (accent colors, compact mode, reduced motion), Organization, Security, System tabs

### Schedule Workflow
- **Status progression** — Scheduled → Running → Completed / Cancelled / Holiday / Postponed / PAP
- **IST timezone** — All timestamps stored in Indian Standard Time
- **Bulk creation** — Generate multiple schedule entries at once
- **Audit trail** — Created Time, Modified Time, Last Status Change Time tracked per entry
- **IST date defaults** — All form date pickers default to today's date in IST

### User & Session Management
- **Clerk Authentication** — Sign-up/sign-in with email + password
- **Role-Based Access** — Super Admin, Admin, Trainer, Student, HR, Staff with middleware route protection
- **User Session Tracking** — Login/logout timestamps, last active heartbeat (2 min), idle detection (15 min)
- **Online Users Widget** — Live view of active users with status badges
- **Activity Tracking** — Mouse/keyboard/scroll idle detection with automatic status updates
- **IST Timestamp Standardization** — All login, logout, last-active, and session timestamps stored as ISO-8601 with `+05:30` offset or human-readable IST format, never UTC

### Notifications
- **Enterprise Schema** — 19-column sheet with `notificationId`, `organizationId`, `branchId`, `userId`, `actorId`, `sourceModule`, `category` (9 types), `priority` (4 levels), `title`, `message`, `actionUrl`, `actionType`, `metadata`, `status` (unread/read/archived/deleted), soft delete, `createdAt`, `expiresAt`, `deviceInfo`, `sessionId`
- **Bell Dropdown** — Glassmorphism panel (`backdrop-blur-xl`, `#111118/95`) with category-based icons (Shield/ClipboardCheck/Calendar/Layers/Target/CreditCard/Info etc.), priority indicators (critical → pulsing rose dot, high → orange dot), grouped by Today/Yesterday/Earlier, unread blue dot indicator with glow, mark all read button, relative timestamps, action URL arrow icon, framer-motion staggered entry, custom thin scrollbar, skeleton loading, empty state
- **Desktop Notifications** — Browser Notification API for background tab alerts when tab is not visible
- **Auto-generated Events** — Welcome on signup (category: info, priority: medium), session started on login (category: info, priority: low), bulk schedule creation (category: schedule)
- **Deduplication** — Same userId+category+title within 5 minutes refreshes timestamp instead of creating duplicate, preventing "Session Started" spam
- **Auto-cleanup** — Notifications older than 30 days auto-archive, 90+ days hard-delete
- **Pagination** — Server-side limit/offset, unread count returned from server

### UI/UX
- **Responsive** — Mobile-first with collapsible 260px sidebar (MAIN/MANAGEMENT/SYSTEM sections, logo area with "SSP Global STI" branding, active indicator line, user footer with sign out)
- **Dark Mode** — System-aware theme toggle via `next-themes` with layered surfaces (`background #0A0A0F` → `card #111118`), softer borders (8% opacity), better muted-foreground contrast (65%), `--surface` CSS token
- **Accent Colors** — 6 selectable palettes (Indigo, Emerald, Amber, Rose, Violet, Cyan) with instant runtime switching via CSS custom properties, persisted in localStorage
- **Layout Density** — Compact Mode reduces card padding, gaps, margins, heading and icon sizes; Reduced Motion disables animations
- **Reusable DataTable** — Generic sortable/searchable/paginated component with loading/empty/error states and framer-motion stagger animations, used across all list pages
- **Debounced Search** — 300ms `useDebounce` hook applied to all search inputs across calendar, students, trainers, courses, leads, schedules, and data-table
- **Optimistic Updates** — Snapshot → mutate → rollback on failure pattern masks Google Sheets 1–3s latency across all CRUD operations
- **Framer Motion** — Page transitions, staggered row entrance, animated stat cards, sidebar collapse animation, notification panel mount/unmount, pulse loaders
- **Card Hover** — `card-hover` CSS utility with lift + shadow micro-interaction
- **Error Handling** — `safeFetch` helper detects HTML responses before JSON parse, invalid JSON, bad HTTP statuses, and surfaces errors via sonner toasts
- **Caching** — 30-second in-memory cache + request deduplication prevents concurrent duplicate fetches; analytics cache with 15 cached metrics and manual refresh
- **Loading Skeletons** — Shimmer placeholders during data fetches
- **Toast Notifications** — Success/error toasts via sonner
- **Role Permissions Viewer** — Settings → System tab shows live role-permission mappings loaded from the Roles sheet

---

## Project Structure

```
tracking-app/
├── apps-script/              # Google Apps Script backend
│   ├── Code.gs               # API handlers (CRUD, notifications, session tracking)
│   └── Setup.gs              # Sheet creation & role seeding
├── public/                   # Static assets
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Root landing page
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global styles
│   │   ├── dashboard/        # Dashboard + sub-pages
│   │   │   ├── page.tsx      # Dashboard home (stats, online users, activity feed)
│   │   │   ├── analytics/    # Charts, cached metrics, refresh button
│   │   │   ├── calendar/     # FullCalendar with drag-and-drop scheduling
│   │   │   ├── courses/      # Course management with module chips, detail drawer
│   │   │   ├── batches/      # Batch CRUD with progress bars, status badges
│   │   │   ├── trainers/     # Trainer profiles with specialization
│   │   │   ├── students/     # Student CRUD with search and progress tracking
│   │   │   ├── schedules/    # Daily schedule tracker (IST), table + timeline
│   │   │   ├── leads/        # Lead management with source tracking
│   │   │   └── settings/     # Profile, appearance, org, system config
│   │   ├── sign-in/          # Clerk sign-in page
│   │   └── sign-up/          # Clerk sign-up page
│   ├── components/
│   │   ├── charts/           # Recharts components (Area, Bar, Pie, Progress)
│   │   ├── common/           # ThemeProvider, UserSync, PageHeader, ErrorState, EmptyState
│   │   ├── dashboard/        # Online users widget, activity feed, stat cards
│   │   ├── forms/            # BatchForm, CourseForm, LeadForm, ScheduleForm, StudentForm, TrainerForm
│   │   ├── layout/           # Sidebar, Navbar (with notification dropdown)
│   │   ├── tables/           # Reusable DataTable component
│   │   └── ui/               # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── contexts/             # React contexts (AccentThemeContext, SettingsContext)
│   ├── hooks/                # Custom hooks (useSheetsData, useDebounce, useSettings, etc.)
│   ├── services/             # API layer (api.ts), auth, metrics, roles
│   ├── constants/            # Sheet names, accent colors, styles
│   ├── types/                # TypeScript interfaces
│   ├── lib/                  # Animation variants, utility functions, date utils
│   └── proxy.ts              # Clerk route protection middleware
└── .env.local                # Environment variables
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
2. Enable **Email** under Users & Authentication
3. Copy the **Publishable Key** and **Secret Key**

### 3. Set Up Google Apps Script

1. Create a new Google Sheet
2. Go to **Extensions → Apps Script**
3. Copy `apps-script/Setup.gs` and `apps-script/Code.gs` into the editor
4. Run `setupSheets()` to create all sheets
5. **Deploy → New Deployment → Web App**:
   - Execute as: **Me**
   - Access: **Anyone**
6. Copy the deployment URL and library ID (or use the values in `.env.local` below)

### 4. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzR-SezJ5GHQdAbhWMi1qav74oUS4-vP65JSC5z15dFkG2IXf7hXPvQUhHtPoJI3g/exec
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzR-SezJ5GHQdAbhWMi1qav74oUS4-vP65JSC5z15dFkG2IXf7hXPvQUhHtPoJI3g/exec
APPS_SCRIPT_LIBRARY_ID=15dtim9WYGv9Y-w_ezsRhenEfgjEMFu9MQEDwyxqQvkw6iA-N0Pb1GfF0

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx
```

### 5. Set User Roles

In **Clerk Dashboard → Users → [user] → Metadata**, add:

```json
{ "role": "Super Admin" }
```

Available roles: `Super Admin`, `Admin`, `Trainer`, `Student`, `HR`, `Staff`

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Data Model

| Sheet | Key Columns |
|-------|-------------|
| **Students** | Student ID, Full Name, Email, Course, Batch, Status, Progress |
| **Courses** | Course ID, Name, Modules, Duration, Status |
| **DailySchedules** | Task ID, Batch, Date, Start/End Time, Status, Notes |
| **Leads** | Lead ID, Name, Contact, Source, Course, Status, Follow-up |
| **Trainers** | Trainer ID, Name, Email, Phone, Specialization, Status |
| **Batches** | Batch ID, Name, Course, Trainer, Start Date, Status |
| **Users** | User ID, Name, Email, Role, Login/Logout, Last Active, Status |
| **SessionLogs** | Log ID, User ID, Login/Logout, Duration, Device, Browser, IP |
| **LoginLogs** | Log ID, User ID, Action, Timestamp (IST) |
| **Notifications** | notificationId, organizationId, branchId, userId, actorId, sourceModule, category, priority, title, message, actionUrl, actionType, metadata, status, isDeleted, createdAt (IST+05:30), expiresAt, deviceInfo, sessionId |
| **Roles** | Role Name, Permissions |
| **Analytics** | Metric Name, Value, Last Updated |

---

## Architecture

```
Browser ──► Clerk (Auth) ──► Next.js App ──► Google Apps Script ──► Google Sheets
                      │                          │
                      └── Session tokens          └── CRUD, sessions, notifications
```

| Layer | Role |
|-------|------|
| **Clerk v7** | Authentication, session management, user metadata (`publicMetadata.role`) |
| **Next.js (App Router)** | Frontend rendering, API routing via `proxy.ts` middleware, client-side role checks |
| **Google Apps Script** | REST API — CRUD operations, session tracking, notification CRUD, heartbeat updates |
| **Google Sheets** | Operational data store — 12 sheets (Students, Courses, Batches, Trainers, Leads, DailySchedules, Users, SessionLogs, LoginLogs, Notifications, Roles, Analytics) |

### Key Design Decisions

- **No database server** — Google Sheets acts as the sole data store via Apps Script REST API, eliminating hosting costs for the backend
- **30s in-memory cache** on reads + request deduplication to mitigate Google Sheets 1–3s latency
- **Optimistic UI** — snapshot → mutate → rollback on failure pattern across all mutations for instant user feedback
- **Beacon API** for reliable logout detection on tab close (Clerk v7 dropped `window.Clerk.addListener`)
- **Middleware** (`proxy.ts`) — pure auth-only route protection; role checking is client-side because `publicMetadata` is unavailable on the middleware auth object in Clerk v7
- **Notification polling** at 10s intervals (Google Sheets has no real-time push capability), with desktop Notification API for background tab alerts. Enterprise schema with 19 columns, deduplication (5-min window), auto-cleanup (30d archive, 90d delete), and priority/category system.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Performance Notes

- Google Sheets has **1–3s latency** per operation. In-memory caching (30s TTL) + optimistic updates mask this.
- Analytics metrics are cached in a dedicated sheet with manual refresh, avoiding redundant computations across page loads.
- Activity heartbeats are throttled to 2-minute intervals; idle detection at 15 minutes.
- Notification polling runs every 10 seconds.
- For production scale, consider migrating to **Supabase** (PostgreSQL).

---

## Deployment

Deployed on **Vercel**. To deploy your own:

1. Push to GitHub
2. Import repo in Vercel
3. Set environment variables in Vercel Dashboard
4. Deploy

---

## Changelog

### v1.16 — Global Theme Stability, Error Handling & Export Fix
- **Theme corruption ROOT CAUSE fixed** — removed `disableTransitionOnChange` from `ThemeProvider` (hard-disabled CSS transitions during theme swaps, causing partial rendering and invisible UI)
- **Smooth theme transitions** — added MutationObserver that applies a `transitioning` CSS class on `<html>` during class changes, enabling conditional 350ms transitions on all color/border/shadow properties (replaces universal always-on transitions that caused jank)
- **Theme flash prevention** — inline `<script>` in `<head>` reads `localStorage.theme` and applies `dark`/`light` class before React hydration, eliminating flash-of-wrong-theme
- **Centralized toast system** — `src/lib/toast-utils.ts` with `showToast(level, title, source, opts)`, all `useSheetsData.ts` and `api.ts` generic `toast.error()` calls replaced with structured source-prefixed messages
- **Hardcoded colors fixed** — dialog/sheet overlays: `bg-black/50` → `bg-background/50`; sign-in/sign-up pages: `bg-black` → `bg-background`
- **Status CSS variables** — added `--color-status-success/danger/warning/info/muted` tokens with light/dark theme variants, replacing emerald/amber/red/slate hardcoded colors
- **CSV Export implemented** — `src/lib/export-utils.ts` with generic UTF-8 BOM CSV download; wired to Export buttons on Batches and Courses pages
- **Build verified**: `npm run build` passes with zero TypeScript errors
- **Centralized IST helpers** — `src/lib/date-utils.ts` added with `getISTNowISO()`, `getISTFormatted()`, `getISTDateOnly()` for consistent IST date/time generation across all frontend code
- **Apps Script IST overhaul** (`Code.gs`):
  - Added `istNow()` (ISO-8601 with `+05:30`), `istLogTimestamp()` (human-readable IST), `istFormatted()` helpers
  - Replaced all 8 `new Date().toISOString()` calls in `handleLogin`, `handleLogout`, `handleUpdateLastActive`, `handleCreateNotification`, `handleCleanupNotifications` with `istNow()` — all stored timestamps now carry `+05:30` offset
  - LoginLogs "Timestamp (IST)" column now written via `istLogTimestamp()` instead of `toLocaleString`
  - Session duration calculation uses Date math correctly with IST-stored values
- **Frontend form defaults fixed** — `StudentForm`, `BatchForm`, `LeadForm`, `ScheduleForm` use `getISTDateOnly()` instead of `new Date().toISOString().split("T")[0]` (which was UTC)
- **`src/lib/utils.ts`** — `formatDateInput()` rewritten to use local getFullYear/getMonth/getDate instead of `d.toISOString().split("T")[0]`
- **Schedules page** — inline calendar form default date uses `getISTDateOnly()`
- **Build verified**: `npm run build` passes with zero TypeScript errors

### v1.14 — Codebase Cleanup, Performance & Sheet Wiring
- **Comprehensive codebase audit** — mapped every file, identified dead code, unused imports, and missing features across the entire project
- **Dead code removed** — deleted `sheets.ts` and `analytics.ts` services, empty `src/modules/*` directories, unused constants (`SIDEBAR_ITEMS`, `ITEMS_PER_PAGE`, `NOTIFICATION_DEDUP_WINDOW_MS`, `NOTIFICATION_SOURCES`)
- **Debounced search** — `useDebounce` hook (300ms) applied to all 7 search inputs (calendar, students, trainers, courses, leads, schedules, data-table)
- **Calendar navigation fix** — dynamic month/year header title, `datesSet` callback for view-aware title, IST-aware date comparison using `parseToISTDate`
- **Compact mode CSS** — expanded to reduce card paddings, gaps, margins, heading sizes, and icon sizes for denser data display
- **Analytics sheet wired** — `src/services/metrics.ts` with 15 cached metrics (`totalStudents`, `activeStudents`, `conversionRate`, etc.), `getCachedMetrics`/`computeAndStoreMetrics`/`metricValue` pattern, refresh button on analytics page with loading state and toast feedback
- **Roles sheet wired** — `src/services/roles.ts` fetches role-permission mappings from Google Sheets, `getRoutesForRole` translates permissions to allowed routes, Settings → System tab shows live role permissions viewer
- **Build verified**: `npm run build` passes with zero TypeScript errors

### v1.13 — Dynamic Accent Color System
- **Full accent color system**: 6 selectable palettes (Indigo, Emerald, Amber, Rose, Violet, Cyan) with instant runtime switching via CSS custom properties
- **AccentThemeContext + useAccentTheme hook**: React context managing accent state with typed `AccentColorName` and `AccentPalette` interfaces
- **CSS variable architecture**: `--accent-base/heavy/soft/fg/ring/glow` mapped via Tailwind v4 `@theme inline` as `bg-accent-base`, `text-accent-base`, `border-accent-base`, `ring-accent-ring`, `bg-accent-soft`, etc. — no conflict with shadcn's existing `--accent` hover token
- **Flash prevention**: Inline `<script>` in `<head>` reads `localStorage` and applies CSS vars before React hydration renders anything visible
- **Persistence**: `accent-color` key in localStorage, automatically applied on every page load
- **Interactive settings UI**: Accent color buttons in Settings → Appearance now show active selection ring + checkmark, update the entire dashboard on click
- **All hardcoded accent colors replaced**: `bg-indigo-500/10` → `bg-accent-soft`, `text-indigo-400` → `text-accent-base`, `border-indigo-500/20` → `border-accent-base/20`, etc. across 18 components (sidebar, navbar, charts, calendar, all list pages)
- **Dynamic chart colors**: Recharts components (Area, Bar, Pie, Progress) read `accentPalette.base` from context for primary series colors; gradient stops and stroke colors update reactively
- **FullCalendar dynamic theming**: `.calendar-premium` CSS updated to use `var(--accent-base)` and `color-mix()` for event colors, active button states, highlights — all update instantly with accent switch
- **Utility classes updated**: `.card-hover`, `.btn-glow`, `.nav-item.active` now use `color-mix(in srgb, var(--accent-base) …)` instead of hardcoded `rgba(99,102,241,…)`
- **Shared style constants**: `INPUT_CLASS`, `FILTER_ACTIVE_CLASS`, `TAB_ACTIVE_CLASS` in `src/constants/styles.ts` eliminating 6 duplicate declarations across pages
- **Smooth transitions**: `background-color`, `border-color`, `box-shadow`, `color` all animate with 250ms ease
- **Build verified**: `npm run build` passes with zero TypeScript errors

### v1.12 — Enterprise Calendar System & Settings Redesign
- **Settings page restructured** — Removed Integrations tab (Google Calendar/Slack/Zapier), replaced with 6 clean tabs: Profile, Appearance, Notifications, Security, Organization, System
- **Appearance tab**: Theme picker (Light/Dark/System), accent color selectors (6 colors), layout density toggles (Compact Mode, Reduced Motion, Weekend Schedules, Collapsed Sidebar), dashboard widget customization (Stat Cards, Charts, Online Users, Recent Activity)
- **System tab**: Google Sheets connection test (with proper `ping` endpoint), cache management (session storage clear button), environment info (Next.js/React/Clerk versions, build target, data store), backend URL display
- **FullCalendar integration** — `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `@fullcalendar/list`
- **4 calendar views**: Month (`dayGridMonth`), Week (`timeGridWeek`), Day (`timeGridDay`), Agenda (`listWeek`) with tab-style view switcher
- **Data mapping**: Events pulled from `DailySchedules` sheet, dates parsed from `"DD - Day - Month - YYYY"` format via `parseToISTDateObject`, times in IST timezone
- **Batch color coding**: 12-color palette assigned by batch name, consistent across all views
- **Drag-and-drop scheduling**: Drop event to new time slot → auto-updates `Schedule Date` / `Start Time` / `End Time` via `modifySheetData`, toast feedback, revert on failure
- **Resizable events**: Drag bottom edge to change duration → updates `End Time` and recalculates duration
- **Live session indicators**: Pulsing green dot + "LIVE" badge on running sessions, `nowIndicator` renders current time line in time views
- **Event detail drawer**: Slide-over panel with status badge (colored), live indicator, overview grid (Date, Start/End Time, Duration), Notes section, update history (Last Updated, Created, Last Status Change)
- **Filter system**: Batch name dropdown filter + text search across batch names and notes
- **Navigation toolbar**: Previous/Next/Today buttons, view switcher (Month/Week/Day/Agenda), search input, batch filter
- **Status legend**: Bottom bar with all 7 status colors (Scheduled/Running/Completed/Cancelled/Holiday/Postponed/PAP) + batch name dots
- **Premium dark theme**: FullCalendar CSS overrides for dark glassmorphism surfaces (`#111118` cards, `rgba(255,255,255,0.06)` borders, indigo accent highlights), custom event hover (lift + glow), time slot styling, list view dark mode, popover dark mode
- **Sidebar updated**: New Calendar route in MANAGEMENT section between Schedules and Leads
- **Build verified**: `npm run build` passes with 14 routes including `/dashboard/calendar`

### v1.11 — Enterprise Notification System Redesign
- **19-column enterprise schema**: `notificationId`, `organizationId`, `branchId`, `userId`, `actorId`, `sourceModule`, `category` (9 types: security, attendance, system, schedule, batch, lead, student, payment, info), `priority` (4 levels: critical, high, medium, low), `title`, `message`, `actionUrl`, `actionType`, `metadata`, `status` (unread/read/archived/deleted), `isDeleted` (soft delete), `createdAt`, `expiresAt`, `deviceInfo`, `sessionId`
- **Backend handlers rewritten** (`Code.gs`):
  - **Deduplication**: same `userId`+`category`+`title` within 5 min refreshes `createdAt` instead of duplicate row
  - **Pagination**: server-side `limit`/`offset`, response includes `{ notifications, total, unreadCount }`
  - **Status transitions**: `unread` → `read` → `archived` → `deleted` instead of boolean `Is Read`
  - **`handleArchiveNotifications`** (new): auto-archive notifications older than N days (default 30)
  - **`handleCleanupNotifications`** (new): soft-delete expired (`expiresAt`), hard-delete archived+90d
- **Frontend updates**:
  - `AppNotification` type: 19 camelCase fields with typed enums for category, priority, status, sourceModule
  - `useNotifications` hook: consumes new response shape, `createNotification` takes `Partial<AppNotification>`, added `archiveOld()`
  - `navbar.tsx`: category-based icon map (Shield/ClipboardCheck/Calendar/Layers/Target/CreditCard/Info), priority indicators (critical → pulsing rose dot, high → orange dot), action URL arrow icon, category-colored icon containers
  - `UserSync.tsx` & `schedules/page.tsx`: updated `createNotification` calls with new field names and defaults
  - `api.ts`: added `archiveNotifications` and `cleanupNotifications` to action type union
- **Notification constants**: `NOTIFICATION_CATEGORIES`, `NOTIFICATION_PRIORITIES`, `NOTIFICATION_STATUSES`, `NOTIFICATION_SOURCES`, `NOTIFICATION_DEDUP_WINDOW_MS`, `NOTIFICATION_FETCH_LIMIT`
- **Setup.gs**: Notifications sheet headers updated to 19-column camelCase schema
- **Build verified**: `npm run build` passes with no errors

### v1.10 — Global Hover & Interaction System Overhaul
- **CSS utilities**: `card-hover` (lift + glow + border transition), `btn-glow` (hover shadow + scale + active press), `nav-item` (gradient active bg + glow border)
- **Vibrant chart colors**: blue/emerald/amber/purple/cyan replacing desaturated grays in dark theme
- **Chart tooltips**: glassmorphism (`bg-[#151520]/95`, `backdrop-blur-xl`, indigo glow border), per-bar `COLORS` arrays for all chart types
- **Chart polish**: custom cursor lines, active dots with stroke, rounded bars, dark-optimized axis labels (`rgba(255,255,255,0.3)`)
- **Sidebar interaction**: `nav-item` hover/active CSS with gradient, glow indicator shadow, icon scale `110%` on hover
- **Surface elevation**: chart containers with `shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)]` + hover `shadow-[0_8px_40px_-6px_rgba(99,102,241,0.08)]`
- **All 4 chart components rewritten**: AreaChart, BarChart, PieChart, ProgressChart — custom tooltips, vibrant colors, better grid/axis contrast

### v1.9 — Schedules Premium Operational Redesign
- **Dual view mode**: Table (condensed 5 columns) + Timeline (grouped by Today/Tomorrow/Upcoming/Past)
- **Smart date formatting**: `"Today • 05:30 PM"`, `"Tomorrow • 09:00 AM"`, `"21 May 2026, Wednesday"` — parsed from stored `"DD - Day - Month - YYYY"` format
- **Live session indicators**: pulsing green dot + `"Live"` badge on running sessions, `shadow-[0_0_20px_-6px_rgba(52,211,153,0.2)]` glow on running cards
- **Gradient stat cards**: Total Sessions, Live Now, Completed, Exceptions — with trend indicators + live icon glow
- **View mode toggle**: segmented control (Table / Timeline) in header
- **Status badges**: per-status icon + dot + glow shadow for Running, animated ping animation
- **Timeline cards**: batch avatar, task ID pill, smart date, time range, duration, notes preview
- **Condensed table columns**: Session (batch + task ID + Live badge), Date & Time (smart label + full date), Status, Duration (chip with icon), Actions
- **Mobile cards**: responsive stacked layout with live indicator + status badge
- **Eliminated horizontal overflow**: removed excessive columns (Task ID, Notes, Updated kept in drawer)
- **Detail drawer**: overview grid (Date, Start/End Time, Duration), timeline section (Created, Modified, Status Change, Updated), session notes, Edit/Delete actions

### v1.8 — Enterprise UI Polish & Settings Redesign
- **Settings page complete redesign**: sidebar tab navigation (Profile/Organization/Notifications/Security/Integrations), setting cards, toggle switches, theme picker (Light/Dark/System), account activity list, connection test, integrations panel
- **Schedules overflow fix**: condensed 9 columns → 5 (Batch, Schedule, Status, Duration, Actions)
- **Gradient stat cards**: `bg-gradient-to-br` overlays with per-card colors, `hover:scale-[1.02]`, trend indicators (`ArrowUpRight` + percentages)
- **PageHeader standardization**: title + subtitle left, action/metadata right across all pages
- **Dashboard**: gradient cards, trend indicators, "Last updated" timestamp, improved chart containers
- **Analytics**: gradient cards, trend indicators, chart containers with border wrapping + elevation
- **Stat cards** — Total Courses, Active, Inactive, Total Modules with animated entry
- **Module chip system** — auto-categorization by keywords (DevOps→blue/Container, Cloud→purple/Cloud, Programming→orange/Code, AI/ML→pink/Brain, Security→red/Shield, Database→cyan/Database, Monitoring→green/Monitor)
- **Overflow handling** — first 5 chips visible, "+N more" badge with tooltip listing remaining modules
- **Hover tooltips** — module name + category on every chip with smooth scale effect
- **Course detail drawer** — slide-over sheet with learning path (connected pill flow), module accordion grouped by category, metadata grid (Duration, Modules, Status, Course ID), Edit/Delete actions
- **Hybrid layout** — rich table on desktop with action dropdown (Edit, View Details, Duplicate, Delete), stacked cards on mobile
- **Search + status filter** — instant filtering by name/modules/duration with All/Active/Inactive toggle chips
- **Empty/error states** — contextual empty state with CTA button, error state with retry
- **Framer Motion** — stat card stagger, row entrance, drawer transitions, chip hover effects
- **Accessibility** — keyboard navigation (`tabIndex`, Enter/Space handlers), ARIA labels on interactive rows

### v1.6 — Notification Dropdown Redesign
- **Glassmorphism panel** — backdrop-blur-xl, `#111118/95` background, subtle white/6% border, shadow-2xl
- **Dynamic icons** by notification type/content — Handshake (welcome), LogIn (sessions), Calendar (schedules), Users (students), Shield (security), GraduationCap (trainers/courses), plus type fallbacks (CheckCircle, AlertTriangle, XCircle, Info)
- **Grouped by time** — Today / Yesterday / Earlier with uppercase section headers
- **Visual hierarchy** — unread = bold text + blue dot indicator with glow shadow, read = dimmed foreground
- **Relative timestamps** — just now, 5m ago, 2h ago, yesterday, 3d ago
- **Framer Motion staggered entry** — 30ms delay per item with slide + fade
- **Custom thin scrollbar** — 4px, transparent track, subtle white/8% thumb
- **Skeleton loading state** — 3 placeholder rows while fetching
- **Empty state** — Inbox icon + "You're all caught up" message
- **Mark all read** button in panel header
- **Custom scrollbar CSS utility** (`.scrollbar-thin`) added to globals.css
- Removed shadcn/ui `ScrollArea` and `DropdownMenu` dependencies from navbar

### v1.5 — DataTable Component & Dark Mode Improvements
- **Reusable `<DataTable>`** — generic TypeScript component with:
  - Sortable columns (click header to sort asc/desc)
  - Client-side search across all visible fields
  - Pagination with configurable rows-per-page (5/10/20/50)
  - Loading / empty / error states with animations
  - Framer Motion staggered row entrance
  - Cast-to-`Record` pattern to bypass index signature constraints
- **Batches page refactored** to use `<DataTable>`, reducing lines from 423 to ~150
- **Dark mode improvements**:
  - Layered surfaces: background `#0A0A0F` → card `#111118` → popover `#1A1A22`
  - Softer borders at 8% opacity
  - Better muted-foreground contrast at 65%
  - `--surface` CSS variable token
- **`card-hover` utility** — lift + shadow micro-interaction on hover (Tailwind v4 `@utility`)

### v1.4 — Sidebar & Batches Page Redesign
- **Sidebar redesigned**:
  - Narrower width (260px from ~280px)
  - Sectioned layout: MAIN / MANAGEMENT / SYSTEM headers
  - Logo area: "SSP Global STI" branding
  - Active indicator line (left border) for current route
  - User footer with name, role badge, and sign-out button
  - Smooth collapse/expand animation with framer motion
- **Batches page redesigned**:
  - Stat cards row: Total Batches, Ongoing, Completed, Upcoming
  - Filter bar: status dropdown + search input
  - Sortable table with all batch fields
  - Status badges: colored dots with glow shadows (green=Ongoing, blue=Upcoming, gray=Completed)
  - Progress bars (visual indicator for batch progress percentage)
  - Pagination controls
  - Empty state with icon + message
  - Error state with retry button
  - Delete confirmation dialog before removal

### v1.3 — Framer Motion Animations
- **Page transitions** — fade + slide between dashboard pages
- **Staggered row entrance** — table rows animate in sequence on page load
- **Animated stat cards** — count-up and fade-in on dashboard
- **Sidebar collapse animation** — smooth width transition with icon rotation
- **Pulse loaders** — shimmer effect on skeleton components
- **Animations library** — reusable variants in `src/lib/animations.ts` (fadeIn, statCardVariants, tableRowVariants, pageTransition, staggerContainer)

### v1.2 — Push Notifications & Error Resilience
- **Push notification system**:
  - `useNotifications` hook polls every 10s for new notifications
  - Bell icon in navbar with live unread count badge
  - Scrollable notification dropdown with mark-as-read
  - Desktop Notification API for background tab alerts
  - Auto-generated on: user signup (Welcome), login (Session Started), bulk schedule creation
  - Backend: `createNotification`, `getNotifications`, `markNotificationRead`, `markAllNotificationsRead` handlers in Code.gs
- **Error resilience (`safeFetch`)**:
  - Detects HTML responses before attempting JSON parse
  - Validates JSON structure after parse
  - Catches bad HTTP statuses
  - Shows toast notification on every API error
- **30-second in-memory cache** + **request deduplication** in `api.ts`
- **Optimistic UI in `useSheetsData`**: snapshot → mutate → rollback + re-fetch on failure
- **Fixed hydration mismatch** — `mounted` state in navbar for theme toggle
- **Fixed role reading** — both `UserSync.tsx` and `Code.gs` read `publicMetadata.role` from Clerk

### v1.1 — Session Tracking & Clerk Fixes
- **User session tracking**:
  - Login/logout timestamps recorded via Apps Script
  - Activity heartbeat every 2 minutes (`useActivityTracking`)
  - Idle detection at 15 minutes (mouse/keyboard/scroll listener)
  - Online users widget on dashboard
  - Beacon API for reliable logout detection on tab close/beforeunload
- **Role-Based Access Control (RBAC)**:
  - Middleware (`proxy.ts`) for auth-only route protection
  - Role checking deferred to client-side via `publicMetadata`
  - Route permissions per role tier (Super Admin → Staff)
- **Clerk fixes**:
  - Migrated from broken custom domain to `together-elk-79.clerk.accounts.dev`
  - Fixed 404 on auth pages by moving from `(auth)/` route group to `app/sign-in/` and `app/sign-up/`
  - Removed legacy `NEXT_PUBLIC_CLERK_FRONTEND_API` (v4) env var
- **UserSync component**: automatic login/logout/session tracking on mount
- **Fixed all "missing key prop"** warnings across all 6 table pages
- **Killed stale dev server** processes (PIDs 32016, 18164)
- **Git fixes**: rebased commit history to set author email to `koppolijayakrishnasai@gmail.com` for Vercel integration

### v1.0 — Initial Release
- **Authentication**: Clerk sign-up/sign-in with email + password, dev instance configuration
- **Google Sheets backend**: Apps Script Web App with CRUD handlers, sheet setup automation
- **6 CRUD modules**: Students, Courses, Batches, Trainers, Leads, Schedules
- **Dashboard**: Stats overview, online users widget, activity feed
- **Analytics**: Recharts — lead source distribution, student status breakdown, enrollment trends, batch progress
- **Role-based access**: Super Admin, Admin, Trainer, Student, HR, Staff (via Clerk metadata)
- **Forms**: React Hook Form + Zod validation for all entities
- **Schedules**: Daily tracker with IST timezone, status workflow (Scheduled → Running → Completed / Cancelled / Holiday / Postponed / PAP)
- **UI**: shadcn/ui component library, Tailwind CSS 3, responsive layout, dark/light mode
- **Toast notifications**: sonner for success/error feedback

---

## Contact

**Email:** persevcareers@gmail.com — [ssp-global-sti-ts.vercel.app](https://ssp-global-sti-ts.vercel.app)

---

## License

All rights reserved — SSP Global STI

---

Made with ❤️💕 SSP Global STI 💕❤️
