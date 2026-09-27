# Nusa Media - Work Status Tracking Web Platform 🚀

Nusa Media is a production-ready, highly responsive work tracking web application tailored for a media team of 15–20 members. It allows the **Chairman** and **Conveners** (admins) to create, edit, delete, and assign media works (videos, posters, reels, photography, graphic designs, social media content), while enabling **Members** to view team works and tick their own assigned works complete using **One-Tap Optimistic UI updates**.

---

## 🌟 Features Summary

- 👑 **Role-Based Access Control (RBAC)**:
  - **Chairman & Convener (Admin)**: Create/edit/delete works, assign tasks to members, manage team member accounts, activate/deactivate accounts, and reset passwords.
  - **Member**: Access all team works, filter assignments, and mark ONLY their own works as `pending`, `in_progress`, or `completed`.
- ⚡ **Optimistic UI Checkbox Complete**: Instant UI feedback when ticking works complete with automatic rollback on error.
- 📊 **Interactive Dashboard (`/dashboard`)**: 5 summary metrics cards (Total, Pending, In Progress, Completed, Overdue), upcoming assigned works, and a real-time team activity audit stream.
- 🔍 **Team Works Board (`/works`)**: Search works by title/description, filter by status, category, priority, and assignee. Features a dual view mode toggle (**Card Grid View** with hover animations vs **Dense List View**).
- 💬 **Discussion & Audit Timeline (`/works/[id]`)**: Threaded discussion comments per work item and a chronological activity log tracking all status changes and updates.
- 📱 **Responsive & PWA Installable**: Custom sidebar navigation for desktop, bottom navigation bar for mobile, dark/light theme switcher, and Web App manifest.
- 🛡️ **Security & Validation**: Zod input validation on all API endpoints, bcrypt password hashing, HTTP-only secure cookies, and in-memory rate limiting on authentication routes.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling & UI**: Tailwind CSS + Lucide Icons + Framer Motion
- **Database & ODM**: MongoDB Atlas (Free M0 friendly) + Mongoose with global connection caching
- **Authentication**: NextAuth.js (Auth.js) Credentials Provider with JWT session strategy
- **State & Data Fetching**: TanStack Query (@tanstack/react-query v5)
- **Validation**: Zod
- **Image & Media Uploads**: Cloudinary integration ready
- **Deployment**: Vercel (Free tier optimized)

---

## 📁 Project Architecture

```
Work Tracker/
├── app/                      # Next.js App Router Pages & API Endpoints
│   ├── api/                  # Server-side API Routes (Protected with RBAC)
│   │   ├── auth/             # NextAuth credentials route handler
│   │   ├── dashboard/        # Metrics, upcoming works & activity logs
│   │   ├── members/          # Member management & password reset routes
│   │   ├── profile/          # User profile update route
│   │   └── works/            # Work CRUD & comment routes
│   ├── dashboard/            # Dashboard page
│   ├── login/                # Sign in page with Quick Demo triggers
│   ├── members/              # Admin member management center
│   ├── my-works/             # Member one-tap complete checklist
│   ├── profile/              # User settings & profile page
│   ├── works/                # Team board & work detail views
│   ├── globals.css           # Global design tokens & glassmorphism
│   └── layout.tsx            # App root layout with Session & Query Providers
├── components/               # React UI Components
│   ├── layout/               # AppShell navigation (Sidebar & Mobile Nav Bar)
│   ├── providers/            # AuthProvider & QueryProvider
│   └── ui/                   # StatusBadge, CategoryBadge, PriorityBadge, AvatarGroup
├── lib/                      # Infrastructure Helpers
│   ├── auth.ts               # NextAuth credentials provider & JWT callbacks
│   ├── auth-utils.ts         # Server authorization functions & rate limiting
│   └── db.ts                 # Serverless-safe Mongoose connection helper
├── models/                   # Mongoose Database Schemas (User, Work, Activity, Comment)
├── scripts/                  # Seeding scripts (seed.ts)
├── services/                 # Client API data fetching layer (work.ts, member.ts)
├── types/                    # DTO interfaces & NextAuth session extensions
└── validators/               # Zod validation schemas (auth.ts, work.ts)
```

---

## ⚙️ Environment Variables Setup

Create a `.env.local` file in the root directory (or copy from `.env.example`):

```bash
# Database Connection (MongoDB Atlas or Local MongoDB)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/nusa_media?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_SECRET=a_random_secure_secret_key_at_least_32_characters_long
NEXTAUTH_URL=http://localhost:3000

# Cloudinary Setup (Optional for media reference links)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Initial Chairman Seed Account
SEED_ADMIN_NAME="Chairman Nusa"
SEED_ADMIN_EMAIL=chairman@nusamedia.id
SEED_ADMIN_PASSWORD=AdminNusa2026!
```

---

## 🚀 Quickstart & Local Development Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Initial Database
Seed the initial **Chairman account**, conveners, members, sample works, activities, and comments:
```bash
npm run seed
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Quick Demo Credentials (Pre-seeded)

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Chairman** | `chairman@nusamedia.id` | `AdminNusa2026!` | Full admin access (Create/Edit/Delete works & manage members) |
| **Convener** | `convener@nusamedia.id` | `AdminNusa2026!` | Admin access (Create/Edit works & assign members) |
| **Member** | `budi@nusamedia.id` | `AdminNusa2026!` | View team works & toggle status ONLY on assigned works |

---

## ☁️ Vercel Deployment Instructions

### 1. Setup MongoDB Atlas (Free M0)
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Cluster**.
3. Under **Database Access**, create a user (e.g. `nusa_admin`) and password.
4. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere for Vercel functions).
5. Copy the connection string into `MONGODB_URI`.

### 2. Deploy to Vercel
1. Push your repository to GitHub / GitLab.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. Under **Environment Variables**, add:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET` (generate using `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your Vercel deployment URL, e.g. `https://nusa-media.vercel.app`)
   - `SEED_ADMIN_EMAIL`
   - `SEED_ADMIN_PASSWORD`
4. Click **Deploy**.

### 3. Seed Production Database
Run the seed script locally pointing to your production MongoDB Atlas cluster:
```bash
MONGODB_URI="your_mongodb_atlas_uri" npx tsx scripts/seed.ts
```

---

## 🧪 Production Testing Checklist

- [x] **Authentication**: Verify logging in as Chairman, Convener, and Member. Verify invalid password or deactivated account blocks login.
- [x] **Role Authorization**: Verify a logged-in Member receives `403 Forbidden` if attempting to create/delete works or add members.
- [x] **Optimistic UI**: Go to `/my-works`, tap the completion checkbox on a work item, and observe the instant UI response.
- [x] **Team Board Filters**: Filter works by status (`Pending`, `In Progress`, `Completed`), category (`Poster`, `Video`, `Reels`), priority, or member assignee. Toggle between Card view and List view.
- [x] **Discussion & Activities**: Post a comment on `/works/[id]` and verify it appears immediately in the comment stream and activity audit log.
- [x] **Theme Switcher**: Click the Dark/Light toggle in the sidebar and verify UI tokens transition smoothly across all cards and modals.
- [x] **Responsive Mobile Shell**: Inspect in mobile viewport to test bottom navigation bar.

---

## 📄 License

Built for **Nusa Media**. Developed with Next.js, Mongoose, and NextAuth.
