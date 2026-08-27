# HORMUUD-VISITORS

> **Booqasho** (meaning "Visit" in Somali) is a field marketing management platform by **Hormuud Telecom** that helps you track, verify, and report on every client visit your team makes.

![Booqasho App Screenshot](App_screenshot.png)

---

## What It Does

Marketing teams spend most of their time in the field — visiting shops, businesses, schools, and hospitals. Booqasho App replaces paper logs and spreadsheets with a **digital system** that records every visit, including:

- **Where** the visit happened (with address details)
- **Who** was met (contact person, phone number)
- **Why** the visit was made (purpose, activities, offers presented)
- **What happened** (successful deal, follow-up needed, or declined)

---

## How It Works

### 1. Secure Login

Each team member signs in with their company email and password. Admin users can manage who has access to the system.

### 2. Log a Visit

When a field agent visits a client, they open the app and fill in a simple form:
- Establishment name and type (shop, school, hospital, etc.)
- Contact person details
- Date and time of visit
- Purpose and activities performed
- Visit outcome (Successful / Pending / Failed)

No paper, no lost data — everything is saved instantly.

### 3. Track Performance

Managers and administrators get a **live dashboard** showing:
- Total visits logged across the team
- Success rates per employee
- Weekly activity trends
- Visit status distribution (successful, pending, failed)
- Recent audit logs for full accountability

### 4. Export Reports

Generate professional reports in **Excel** or **CSV** format with a single click. Filter by date range, employee, status, or establishment type.

---

## Who It's For

| Role | What They See |
|------|---------------|
| **Field Marketing Agents** | Log visits, view their own history and performance |
| **Marketing Managers** | Dashboard overview, team KPIs, visit details |
| **Administrators** | Full access: manage users, approve visits, export reports |

---

## Key Features

- **GPS-Verified Visits** — Each visit is logged with location data
- **SMS OTP Security** — Two-factor authentication protects accounts
- **Dark & Light Mode** — Switch themes to suit your preference
- **Somali & English** — Full bilingual interface
- **Real-Time Dashboard** — See team performance as it happens
- **One-Click Reports** — Export data to Excel or CSV instantly

---

## Quick Start

**For first-time use, contact your system administrator to create your account.**

1. Open the app in your browser at the company-provided link
2. Sign in with your email and password (provided by your admin)
3. Start logging your field visits from the **Log Visit** page
4. View your performance on the **Dashboard**

---

## Local Development

```bash
# Install backend + frontend dependencies
npm install
npm install --prefix backend
npm install --prefix frontend

# Run both servers together (backend on :5000, frontend on :5173)
npm run dev
```

The app runs in **mock in-memory DB mode** by default when no `DATABASE_URL` is set,
or when `USE_MOCK_DB=true`, so you can try it without PostgreSQL:
- Admin: `admin@booqasho.com` / `admin123`
- Marketing: `marketing@booqasho.com` / `marketing123`

To connect to a real Supabase PostgreSQL database, configure `backend/.env` with a
`DATABASE_URL` (see `backend/.env.example`).

---

## Deploying to Vercel (single project — frontend + backend)

This repository is set up as **one Vercel project**. The Express backend runs as a
Vercel serverless function (`api/index.js`) and the React frontend is built to static
files that Vercel serves. Everything lives in a single deployment, and the app is a
fully installable **PWA**.

### 1. Prerequisites
- A **Supabase** project (or any PostgreSQL host) with the schema from `database.sql`
  applied and seeded (run `backend/seed_pg.js`).

### 2. Push to GitHub & import into Vercel
1. Create a GitHub repo and push this folder (`.env` files are git-ignored).
2. In Vercel → **New Project** → import the repo.
3. Vercel will detect the config automatically.

### 3. Set environment variables (Vercel → Project → Settings → Environment Variables)
Add these for the production environment:
- `DATABASE_URL` — **PostgreSQL connection string**. For Supabase, use the
  **transaction pooler** string, e.g. `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` (port `6543` is essential for serverless to avoid exhausting connections).
- `JWT_SECRET` — a long random secret string.
- `USE_MOCK_DB` — set to `false` (leave unset to connect to a real DB; set `true` only for demo).
- Optional: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SMS_API_URL`, `SMS_CLIENT_ID`, `SMS_SECRET_KEY`.
- Optional: `FRONTEND_URL` — your exact production domain if you want strict CORS.

> **Note:** Do **not** add `VITE_API_URL` from `frontend/.env` — keep it as `/api` so the
> built frontend calls the same-origin serverless API. No change needed.

### 4. Deploy
Just push to GitHub — Vercel runs `npm run vercel-build` (builds the React app into
`public/`) and deploys the serverless API plus static files in one shot.

That's it. Your app is live at `https://your-app.vercel.app` and users can **install it**
from the browser (it's a PWA with an app icon, service worker offline caching, and a
standalone full-screen experience).

> **Important:** the free Vercel Hobby plan restricts serverless function sizes and
> execution timing. For guaranteed uptime on `pg` Pool connections, use Supabase's
> transaction pooler URL (above). The app also gracefully falls back to the mock DB if
> the database is unreachable.

---

> Built for **Hormuud Telecom** — Somalia's leading telecommunications company.
