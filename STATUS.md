# ATADA — Project Status

> **Read this file first.** It's the single source of truth for what works,
> what's broken, and what's next.
>
> Last updated: 2026-04-14

---

## TL;DR

Atada is a **job matching platform for the Israeli market**, MVP stage.
Workers swipe on jobs (Tinder-style), employers find candidates via AI chat.
Workers are free forever (Israeli law), employers pay (199 ILS/post or 999 ILS/mo).

The MVP runs end-to-end locally:
- Backend: FastAPI + SQLite, all endpoints implemented
- Frontend: React + Vite, all main pages built
- Parser: takes screenshots of job posts → MiniMax VLM → structured DB entries
- Facebook scraper: scrolls a group feed, screenshots posts, hits the parser

What's missing to launch: production hosting, real SMS provider, payment
go-live keys, Hebrew translation. See "Critical Gaps" below.

---

## How to Run (Windows)

**Two terminals.**

### Terminal 1 — Backend
```powershell
cd D:\AtadaManusVers\backend
python -m uvicorn app.main:app --port 8002
```
- Health check: http://127.0.0.1:8002/api/health
- API docs: http://127.0.0.1:8002/api/docs
- If port is busy: `python -m uvicorn app.main:app --port 8003`
  (and update `vite.config.ts` proxy target to match)

### Terminal 2 — Frontend
```powershell
cd D:\AtadaManusVers
pnpm dev
```
- Site: http://localhost:3000
- Vite proxies `/api/*` to the backend on :8002

### Demo logins (OTP code prints in backend console)
- Worker: `+972501234567`
- Employer: `+972509876543`

### Re-seed database
```powershell
cd D:\AtadaManusVers\backend
python seed_realistic.py    # 47 hand-curated jobs + 20 candidates
# or
python seed_mock_db.py      # 100 Faker-generated jobs + 100 candidates
```

---

## What Works End-to-End

| Flow | Status | Notes |
|------|--------|-------|
| Open site → see job cards with images | ✅ | Real data from SQLite, Unsplash hero images |
| Swipe right → "Apply" recorded | ✅ | Authed users get applications written to DB |
| Swipe left → "Skip" recorded | ✅ | Match record marked, won't reappear in feed |
| AI chat (SSE streaming) | ✅ | Uses MiniMax if `MINIMAX_API_KEY` set; falls back to mock |
| Phone OTP login | ✅ | Code prints in backend console (no Twilio yet) |
| JWT refresh on 401 | ✅ | Frontend `api.ts` auto-retries with refresh token |
| Personalized feed (`/api/jobs/feed`) | ✅ | Match score by skills × commute × salary |
| Commute time (drive + transit) | ✅ | Google Maps if key set, else haversine fallback |
| Geocoding on profile location change | ✅ | Auto-invalidates cached matches |
| Resume builder with PDF download | ✅ | html2canvas + jsPDF, diagonal "ATADA" watermark |
| Applications tracking page | ✅ | `/applications` shows user's swipes with status |
| Employer dashboard | ✅ | `/employer` — stats + applicants + post-job form |
| Pricing page (employer-only) | ✅ | Stripe Checkout in test mode |
| Onboarding flow | ✅ | 3-slide intro on first visit, dismissable |
| Screenshot parser (`POST /api/parser/parse`) | ✅ | MiniMax VLM extracts job data from images |
| Facebook scraper (`fb_scraper.py`) | ✅ | Scrolls group, screenshots posts, posts to parser |

---

## What's Mocked / Not Production-Ready

| Thing | Where | What to swap |
|-------|-------|--------------|
| SMS OTP delivery | `backend/app/services/auth.py:send_otp` → `print()` | Twilio / MessageBird API call |
| AI chat fallback | `backend/app/services/chat.py:MOCK_RESPONSES` | Auto-disabled when `MINIMAX_API_KEY` is set |
| Stripe keys | `backend/.env` → `sk_test_PLACEHOLDER` | Real `sk_live_...` from Stripe Dashboard |
| Invoice PDF | `backend/app/services/invoice.py` (ReportLab) | Real Israeli tax invoice (Green Invoice / iCount) |
| Database | SQLite file `backend/atada.db` | PostgreSQL on Railway/Neon |
| JWT secret | `backend/.env` → dev string | `openssl rand -hex 32` |
| Seed data | `seed_realistic.py` (47 hand-written) | Real data from parser pipeline |
| Commute estimation | `commute.py` haversine fallback | Google Maps Distance Matrix (set `GOOGLE_MAPS_API_KEY`) |
| Geocoding | Nominatim fallback (rate-limited) | Google Geocoding (same key) |

See `PRODUCTION_MIGRATION.md` for the full deploy checklist.

---

## Known Issues

1. **Background uvicorn dies on terminal close** — Windows quirk. Always run
   in foreground in PowerShell, not via background jobs from another shell.
2. **Port 8002 sometimes stays bound after Ctrl-C** —
   `netstat -ano | findstr :8002` then `taskkill /PID <id> /F`.
3. **Onboarding overlay shows even after auth** — toggle is local storage
   only (`atada_onboarded` key). Clear localStorage to retest.
4. **No avatar upload yet** — candidate `photo_url` and job `image_url` are
   stock Unsplash URLs from the seeder. Users can't upload their own.
5. **Pricing checkout in test mode** — uses Stripe test mode. Real cards
   will be rejected until you swap to live keys.
6. **Facebook scraper requires manual cookie capture** —
   `python fb_scraper.py --login` opens a headed browser, you log in once,
   cookies are saved to `fb_cookies.json` (gitignored).
7. **Hebrew is not translated** — UI is English only. Real Israeli launch
   needs i18next + RTL (Phase 5).

---

## Architecture (One-Pager)

```
                      ┌─────────────────┐
                      │  Worker (free)  │
                      │ swipes on jobs  │
                      └────────┬────────┘
                               │
                          /api/jobs/feed
                               │
                               ▼
┌──────────────┐   GET   ┌───────────────┐   POST  ┌─────────────────┐
│  Vite :3000  │────────▶│  FastAPI :8002│────────▶│  SQLite atada.db│
│  React 19    │  proxy  │  9 routers    │   SQL   │  9 tables       │
└──────┬───────┘         └───────┬───────┘         └─────────────────┘
       │                         │
       │                         ├──▶ MiniMax LLM (chat SSE + VLM parser)
       │                         ├──▶ Stripe (checkout sessions, webhooks)
       │                         ├──▶ Google Maps (geocode + commute, opt.)
       │                         └──▶ Nominatim fallback (geocode)
       │
       └──▶ html2canvas + jsPDF (resume PDF)

  fb_scraper.py ──▶ Playwright ──▶ screenshots ──▶ /api/parser/parse
  (separate CLI, populates jobs table from Facebook groups)
```

### Backend layout (DDD-ish)
```
backend/
├── app/
│   ├── main.py             FastAPI app, mounts 7 routers
│   ├── config.py           Settings from .env via pydantic-settings
│   ├── db/database.py      SQLAlchemy engine + session
│   ├── domain/
│   │   ├── models.py       9 SQLAlchemy tables
│   │   └── schemas.py      Pydantic I/O contracts
│   ├── services/           Business logic (no FastAPI deps)
│   │   ├── auth.py         OTP, JWT, guest sessions
│   │   ├── chat.py         SSE stream, MiniMax + mock
│   │   ├── matching.py     Skill × distance × salary scoring
│   │   ├── geocode.py      Google → Nominatim → city fallback
│   │   ├── commute.py      Distance Matrix → haversine fallback
│   │   ├── parser.py       MiniMax VLM image → JSON
│   │   └── invoice.py      ReportLab PDF
│   └── api/                Route handlers
│       ├── auth.py         /api/auth/*
│       ├── jobs.py         /api/jobs/*
│       ├── users.py        /api/users/*
│       ├── chat.py         /api/chat/stream  (SSE)
│       ├── payments.py     /api/payments/*  (Stripe)
│       ├── employer.py     /api/employer/*
│       └── parser.py       /api/parser/*
├── seed_mock_db.py         Faker bulk seeder (100 + 100)
├── seed_realistic.py       Hand-curated (47 + 20)  ← preferred
├── fb_scraper.py           Playwright FB group scraper
├── atada.db                SQLite (gitignored)
└── requirements.txt
```

### Frontend layout
```
client/src/
├── App.tsx                 Wouter routes, AuthProvider, Onboarding
├── pages/
│   ├── Home.tsx            SwipeLayout container (2 pages)
│   ├── DiscoveryPage.tsx   Avatar + chat + job cards (left/center/right)
│   ├── FeedPage.tsx        AI chat + scrollable job feed (2-column)
│   ├── ProfilePage.tsx     Resume editor + PDF download (/profile)
│   ├── AuthPage.tsx        Phone + OTP form  (/auth)
│   ├── ApplicationsPage.tsx Track applied jobs  (/applications)
│   ├── EmployerPage.tsx    Dashboard + post job  (/employer)
│   ├── PricingPage.tsx     Employer plans  (/pricing)
│   ├── NotFound.tsx
│   └── *SwipePage.tsx      Older swipe-layout variants (unused, kept for ref)
├── components/
│   ├── JobCard.tsx         Hero image + match badge + Apply/Skip
│   ├── JobFeed.tsx         List with thumbnails
│   ├── ChatPanel.tsx       SSE-aware chat UI
│   ├── AvatarPanel.tsx     Left sidebar (DiscoveryPage)
│   ├── SwipeLayout.tsx     Mouse/touch swipe between sibling pages
│   ├── Onboarding.tsx      First-visit 3-slide intro
│   ├── ErrorBoundary.tsx
│   ├── profile/            Resume form, preview, PDF download
│   └── ui/                 60+ shadcn components
├── contexts/
│   ├── AuthContext.tsx     JWT state + login/logout
│   └── ThemeContext.tsx    Light/dark (dark disabled)
├── hooks/                  useSwipe, useResumeState, etc.
└── lib/
    ├── api.ts              All HTTP + SSE calls
    ├── data.ts             Job interface, mockJobs fallback, apiJobToJob adapter
    ├── resume-types.ts
    └── utils.ts            cn()
```

---

## API Endpoints (cheat sheet)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET    | `/api/health` | – | Health check |
| POST   | `/api/auth/guest` | – | Anonymous session token |
| POST   | `/api/auth/otp/send` | – | Send OTP code (prints to console) |
| POST   | `/api/auth/otp/verify` | – | Verify code → JWT pair |
| POST   | `/api/auth/refresh` | – | Refresh access token |
| GET    | `/api/auth/me` | JWT | Current user |
| GET    | `/api/jobs` | optional | Public job list |
| GET    | `/api/jobs/feed` | JWT | Personalized match-sorted feed |
| GET    | `/api/jobs/:id` | optional | Job detail |
| POST   | `/api/jobs` | JWT | Create job |
| POST   | `/api/jobs/swipe` | JWT | Record Apply/Skip |
| PATCH  | `/api/users/me` | JWT | Update profile (auto-geocodes location) |
| GET    | `/api/users/me/applications` | JWT | My applications |
| GET    | `/api/users/candidates` | JWT | List candidates (employer view) |
| POST   | `/api/chat/stream` | optional | SSE chat with AI |
| POST   | `/api/payments/checkout` | JWT | Stripe Checkout session URL |
| POST   | `/api/payments/webhook` | Stripe sig | Stripe events |
| GET    | `/api/payments/invoices` | JWT | List invoices |
| GET    | `/api/employer/dashboard` | JWT (employer) | Stats |
| GET    | `/api/employer/applicants` | JWT (employer) | Applicant list |
| PATCH  | `/api/employer/applicants/:id` | JWT (employer) | Update applicant status |
| POST   | `/api/employer/jobs` | JWT (employer) | Post a job |
| POST   | `/api/parser/parse` | optional | Screenshot → DB job |
| POST   | `/api/parser/parse/preview` | – | Screenshot → JSON (no save) |

---

## Critical Gaps to Launch

In priority order:

### Must-have (before any user touches it)
1. **Production hosting** — Vercel (frontend) + Railway/Render (backend) +
   managed Postgres.
2. **HTTPS + real domain** — `atada.co.il` already brainstormed in
   `NextPlanStep.md`. Cloudflare for DNS.
3. **Real SMS provider** — Twilio is the standard. Costs ~0.04 USD/SMS to IL.
4. **Real Stripe keys** — switch from test to live, wire webhook endpoint.
5. **PostgreSQL migration** — SQLite can't handle concurrent writes safely.
   Alembic migration tree already importable, just configure for Postgres.
6. **JWT_SECRET rotation** — current value is hardcoded dev string.

### Important (week 1 after launch)
7. **Sentry error tracking** — free tier is plenty for MVP.
8. **Posthog or Plausible analytics** — measure swipe → apply funnel.
9. **Rate limiting** — `slowapi` for FastAPI. Already in requirements? Check.
10. **CORS lockdown** — currently allows localhost; production needs the
    real domain only.

### Nice-to-have (Phase 5)
11. **Hebrew + RTL** — react-i18next + Tailwind RTL plugin.
12. **Email notifications** — when employer changes applicant status.
13. **Avatar/photo uploads** — S3 / Cloudflare R2 for user-supplied images.
14. **Real Israeli tax invoice** — Green Invoice or iCount API.
15. **Tests** — Vitest installed, zero tests written.

---

## Document Map (which file to read for what)

| File | What it covers |
|------|---------------|
| `STATUS.md` (this) | Current state, what works, what's mocked, gaps |
| `CLAUDE.md` | Per-session brief for LLM coding assistants |
| `README.md` | Public-facing project intro (for GitHub) |
| `AUDIT.md` | Honest investor-style audit of the MVP |
| `NextPlanStep.md` | Roadmap with effort estimates |
| `PRODUCTION_MIGRATION.md` | Mock-by-mock list of what to swap before deploy |
| `ideas.md` | Original design philosophy brainstorm (Quiet Modernism) |

When picking this project up cold:
1. Read **STATUS.md** (this file) — current state
2. Read **CLAUDE.md** — operating instructions for an LLM
3. Skim **NextPlanStep.md** — where we're headed
4. Touch nothing else until you've run the project locally and seen it work.
