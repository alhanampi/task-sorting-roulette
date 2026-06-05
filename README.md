# Task Sorting Roulette

A gamified task management PWA. Instead of deciding what to do next, you spin a wheel — it picks for you.

Built with React + Vite, MUI v5, Redux, Clerk auth, and a Neon (PostgreSQL) backend. Works fully in **guest mode** without any account.

---

## Features

- **Guest mode** — try it instantly, tasks saved to localStorage
- **Spin to assign** — a wheel randomly picks your next task
- **Difficulty & points** — tasks have a 1–5 difficulty; completing them earns points
- **Partner system** — link with another user to manage tasks together
- **Multilingual** — English, Spanish, and Portuguese
- **PWA** — installable on mobile, works offline

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, MUI v5 |
| State | Redux Toolkit |
| Auth | Clerk |
| i18n | react-i18next |
| Backend | Express.js (Node.js + TypeScript) |
| Database | Neon (serverless PostgreSQL) |
| Email | Resend |
| PWA | vite-plugin-pwa |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account
- A [Neon](https://neon.tech) PostgreSQL database
- A [Resend](https://resend.com) account (for partner invite emails)

### 1. Clone and install

```bash
git clone https://github.com/alhanampi/task-sorting-roulette.git
cd task-sorting-roulette
npm install
```

### 2. Set up environment variables

Create a `.env` file in the root:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_NEON_DB=postgresql://user:password@host/dbname
VITE_RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Task Sorter <noreply@yourdomain.com>
```

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (from Clerk dashboard) |
| `VITE_NEON_DB` | Neon connection string |
| `VITE_RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender address for partner request emails |

### 3. Initialize the database

Run the schema from `src/db/schema.sql` in your Neon SQL editor. This creates the `users`, `tasks`, and `partner_requests` tables.

### 4. Run locally

```bash
npm run dev
```

This starts both the Vite dev server (`localhost:5173`) and the Express API (`localhost:3001`) concurrently.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend in dev mode |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## Project Structure

```
task-sorting-roulette/
├── server/
│   └── index.ts              # Express API (all endpoints)
├── src/
│   ├── App.tsx               # Root: Clerk + Redux + MUI Theme
│   ├── pages/
│   │   ├── HomePage.tsx      # Main page (guest / authenticated)
│   │   └── AuthPage.tsx      # Clerk sign-in / sign-up
│   ├── components/           # UI components (TaskCard, StatsBar, etc.)
│   ├── store/                # Redux store + slices
│   ├── db/                   # DB schema and query functions
│   ├── i18n/                 # Translation files (en, es, pt)
│   └── utils/                # TypeScript types and interfaces
├── public/                   # Static assets
├── index.html
└── vite.config.ts
```

---

## API Endpoints

All endpoints are `POST` and accept/return JSON.

| Endpoint | Description |
|---|---|
| `/api/load-user` | Load a user with their tasks |
| `/api/fetch-user` | Get user info by email |
| `/api/upsert-user` | Create or update a user |
| `/api/insert-task` | Add a new task |
| `/api/update-task` | Update a task (e.g. mark complete) |
| `/api/partner-request/send` | Send a partner invite email |
| `/api/partner-request/pending` | Get pending partner requests |
| `/api/partner-request/respond` | Accept or reject a request |

---

## License

MIT
