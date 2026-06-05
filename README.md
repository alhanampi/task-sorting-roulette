# Task Sorting Roulette 🎡

A full-stack gamified task manager where you **spin a wheel to decide what to do next**. No more decision paralysis — the wheel chooses, you execute, you earn points.

Works instantly in **guest mode** (no account needed, tasks saved locally), and upgrades to a full experience with Clerk auth, PostgreSQL persistence, and a **partner system** to share task lists with another person.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [App Flow](#app-flow)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Features

### Guest Mode
- Works without any account — just open the app and start
- Pre-loaded with seed tasks to demonstrate the wheel immediately
- All tasks and state persisted to `localStorage`
- Banner prompting sign-up without blocking usage

### Task Management
- Create tasks with a **title** and **difficulty rating** (1–5)
- Tasks are separated into **pending** and **completed** lists
- Visual highlight on the currently assigned task
- First task created auto-assigns itself if no active task is set

### Spin to Assign
- All pending tasks are fed into a **prize wheel** as segments
- Spinning randomly selects a task and assigns it as the active one
- Replaces an existing assigned task if one is already set

### Points & Gamification
- Completing a task awards points equal to its **difficulty level**
- Points are tracked per user and displayed in the stats bar
- Encourages tackling harder tasks first

### Partner System *(authenticated only)*
- Toggle between **solo mode** and **partner mode**
- Send a partner invite by entering a registered email
- Partner receives an email notification via Resend
- On acceptance, both accounts are linked and can see each other's info in the header
- Incoming requests surface as a dialog on next app load

### Authentication
- Powered by **Clerk** — no passwords managed in this codebase
- On first sign-in, a new user record is created automatically in the database
- Sign-out clears Redux state and reverts to guest mode

### Internationalization
- UI fully translated in **English**, **Spanish**, and **Portuguese**
- Language toggle in the header, preference saved to `localStorage`

### Progressive Web App
- Installable on Android and iOS from the browser
- Offline support via service worker (vite-plugin-pwa)
- Auto-updates on new deployments

---

## Tech Stack

### Frontend
| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| UI library | Material UI (MUI) v5 |
| State management | Redux Toolkit |
| Auth | Clerk (`@clerk/clerk-react`) |
| i18n | react-i18next |
| Wheel | react-wheel-of-prizes |
| PWA | vite-plugin-pwa |

### Backend
| | |
|---|---|
| Runtime | Node.js + TypeScript |
| Server | Express.js |
| Database | Neon (serverless PostgreSQL) |
| Email | Resend |
| Dev runner | tsx + concurrently |

---

## App Flow

```
Open app
│
├── Not signed in
│   ├── Load tasks from localStorage (seed tasks on first visit)
│   ├── Create tasks → saved to localStorage
│   ├── Spin wheel → assigns task locally (no DB call)
│   ├── Complete task → updates localStorage
│   └── Banner: "Sign up to sync across devices"
│
└── Signed in (Clerk)
    ├── First sign-in → auto-creates user in DB
    ├── Load user + tasks + partner from Neon
    ├── Check for pending partner requests → show dialog
    ├── Create tasks → saved to DB + Redux
    ├── Spin wheel → assigns task in DB + Redux
    ├── Complete task → DB update, points awarded
    └── Partner section → invite by email (Resend), accept/reject flow
```

---

## Project Structure

```
task-sorting-roulette/
│
├── server/
│   └── index.ts                  # Express server — all REST endpoints
│
├── src/
│   ├── App.tsx                   # Root: Clerk provider, Redux provider, MUI theme
│   ├── main.tsx                  # Vite entry point
│   ├── globals.ts                # Global constants and shared config
│   ├── vite-env.d.ts             # Vite type declarations
│   │
│   ├── pages/
│   │   ├── HomePage.tsx          # Main page — all app logic lives here
│   │   └── AuthPage.tsx          # Clerk-hosted sign-in / sign-up page
│   │
│   ├── components/
│   │   ├── AppHeader/            # App title, user greeting, partner link, language switcher, auth buttons
│   │   ├── StatsBar/             # Points total + pending task count
│   │   ├── CreateTaskForm/       # Task title input + difficulty slider + submit
│   │   ├── SpinWheelSection/     # Wheel container — feeds tasks as segments, emits selected task
│   │   ├── TaskWheel/            # Wrapper around react-wheel-of-prizes iframe
│   │   ├── ActiveTaskSection/    # Displays current assigned task + complete button
│   │   ├── TaskListSection/      # Two lists: pending tasks and completed tasks
│   │   ├── TaskCard/             # Individual task row (title, difficulty badge, status)
│   │   ├── PartnerSection/       # Solo/partner toggle, invite dialog, linked partner status
│   │   └── LanguageSwitcher/     # EN / ES / PT toggle buttons
│   │
│   ├── store/
│   │   ├── store.ts              # Redux store configuration
│   │   ├── hooks.ts              # Typed useAppSelector / useAppDispatch
│   │   └── slices/
│   │       └── appSlice.ts       # users[], tasks[], pendingRequests[] — all CRUD reducers
│   │
│   ├── db/
│   │   ├── schema.sql            # PostgreSQL table definitions (run once in Neon)
│   │   ├── client.ts             # Neon HTTP client instance
│   │   └── queries.ts            # All DB query functions (load, upsert, insert, update)
│   │
│   ├── i18n/
│   │   ├── index.ts              # i18next setup
│   │   └── locales/
│   │       ├── en.json
│   │       ├── es.json
│   │       └── pt.json
│   │
│   ├── utils/
│   │   ├── interfaces.ts         # All TypeScript interfaces (IUser, ITask, IPartnerRequest, component props)
│   │   └── types.ts              # Narrow types (Language, etc.)
│   │
│   └── styles/
│       └── pageStyles.ts         # Shared MUI sx style objects
│
├── public/
│   ├── favicon.png
│   └── icon.png
│
├── index.html                    # Vite HTML entry
├── vite.config.ts                # Vite + PWA plugin config
├── tsconfig.json
└── package.json
```

---

## Data Model

### `users`
| Column | Type | Notes |
|---|---|---|
| `email` | TEXT (PK) | Primary identifier — from Clerk |
| `username` | TEXT | Display name |
| `points` | INTEGER | Accumulated from completed tasks |
| `partner_email` | TEXT | FK to another user's email (nullable) |
| `assigned_task_id` | TEXT | FK to tasks.id — current active task (nullable) |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (PK) | Client-generated: `{timestamp}-{random}` |
| `title` | TEXT | Task description |
| `difficulty` | INTEGER | 1–5, enforced by CHECK constraint |
| `owner_email` | TEXT (FK) | References `users.email`, cascades on delete |
| `completed` | BOOLEAN | Default false |
| `created_at` | BIGINT | Unix timestamp (ms) |

### `partner_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (PK) | |
| `from_email` | TEXT (FK) | Sender |
| `to_email` | TEXT (FK) | Recipient |
| `status` | TEXT | `pending` / `accepted` / `rejected` |
| `created_at` | BIGINT | Unix timestamp (ms) |

Unique constraint on `(from_email, to_email)` prevents duplicate requests.

---

## API Reference

All endpoints are `POST`, accept `application/json`, and return JSON. The server runs on port `3001` by default.

| Endpoint | Body | Description |
|---|---|---|
| `POST /api/upsert-user` | `{ email, username, points, partnerEmail?, assignedTaskId? }` | Create or update a user |
| `POST /api/fetch-user` | `{ email }` | Get a single user by email |
| `POST /api/load-user` | `{ email }` | Load user + their tasks + their partner in one call |
| `POST /api/insert-task` | `{ id, title, difficulty, ownerEmail, completed, createdAt }` | Insert a new task |
| `POST /api/update-task` | `{ id, completed, ... }` | Update task fields (e.g. mark complete) |
| `POST /api/partner-request/send` | `{ fromEmail, toEmail }` | Send a partner invite — triggers email via Resend |
| `POST /api/partner-request/pending` | `{ email }` | Get all pending requests addressed to this user |
| `POST /api/partner-request/respond` | `{ requestId, response: "accepted"\|"rejected" }` | Accept or reject — links accounts on accept |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Clerk](https://clerk.com) project (free tier works)
- A [Neon](https://neon.tech) database (free tier works)
- A [Resend](https://resend.com) account with a verified sender domain

### 1. Clone and install

```bash
git clone https://github.com/alhanampi/task-sorting-roulette.git
cd task-sorting-roulette
npm install
```

### 2. Set up environment variables

Create a `.env` file in the root (see [Environment Variables](#environment-variables) below).

### 3. Initialize the database

In your Neon project, open the SQL Editor and run the contents of `src/db/schema.sql`. This creates the three tables and their indexes.

### 4. Start the development server

```bash
npm run dev
```

This runs both simultaneously:
- **Frontend** — Vite dev server at `http://localhost:5173`
- **Backend** — Express API at `http://localhost:3001`

### 5. Build for production

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_NEON_DB=postgresql://user:password@host.neon.tech/dbname?sslmode=require
VITE_RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Task Sorter <noreply@yourdomain.com>
```

| Variable | Where to get it | Notes |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys | Public key, safe to expose in frontend |
| `VITE_NEON_DB` | Neon dashboard → Connection string | Used by both frontend queries and the Express server |
| `VITE_RESEND_API_KEY` | Resend dashboard → API Keys | Only used server-side, but declared as VITE_ for the shared env file |
| `RESEND_FROM_EMAIL` | Any address from your verified Resend domain | Format: `Name <email@domain.com>` |

> **Never commit `.env` to version control.** It is listed in `.gitignore`.
