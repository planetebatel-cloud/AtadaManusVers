# ATADA — Per-Session Brief for LLM Assistants

> Read this file **before touching code**. It's the contract for every coding
> session. For full project state, also read `STATUS.md`.
>
> Last updated: 2026-05-14 (deploy day)

---

## 🚀 PRODUCTION (live right now)

| What | URL |
|---|---|
| **Frontend** (show this to people) | **https://atada.vercel.app** |
| Backend API | https://atada-api.onrender.com |
| Backend Swagger | https://atada-api.onrender.com/api/docs |
| GitHub repo (public) | https://github.com/planetebatel-cloud/AtadaManusVers |

**Deploy infra:**
- Backend: Render free tier, service `srv-d82sktrrjlhs73dr34t0`, Python buildpack, no Docker.
  Auto-deploys on push to `main`. Sleeps after 15 min idle → ~30s cold start.
- Frontend: Vercel free tier (hobby plan), project `prj_Y3LZ9fmDNVtqY0ijxZMn5qvE1lDW`.
  Auto-deploys on push to `main`. SSO protection disabled.
- DB: SQLite in the Render container — **resets on every restart**. Auto-seed in
  `backend/app/main.py:auto_seed_if_empty()` restores 47 jobs + 20 candidates +
  the two demo users on cold boot.
- Public demo flow: `/api/auth/otp/peek` endpoint returns the latest OTP for the
  two whitelisted demo phones (`+972501234567` worker, `+972509876543` employer).
  Any other phone gets 403.

**Tokens / secrets live in:** `D:\AtadaManusVers\.deploy-tokens.env` (in `.gitignore`,
contains `VERCEL_TOKEN`, `RENDER_API_KEY`, `MINIMAX_API_KEY`, `JWT_SECRET`).

**Before any demo session:** hit `https://atada-api.onrender.com/api/health` once
to warm the backend (~30s cold start otherwise).

---

## What is Atada

Job matching SaaS for the Israeli market. Two sides:
- **Workers** (free forever — Israeli law prohibits charging job seekers):
  swipe Tinder-style on jobs, AI-ranked by skills + commute + salary fit.
- **Employers** (paying side, 199 ILS/post or 999 ILS/mo): post jobs, view
  AI-matched applicants, manage hiring funnel.

Design philosophy: **"Quiet Modernism"** — monochrome (#0A0A0A / #FFFFFF /
greys), DM Sans + DM Mono fonts, golden-ratio spacing, no decoration.

---

## Stack (don't change without asking)

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React 19 + Vite 7 + TailwindCSS 4 | Existing polished MVP, not switching to Next.js |
| Routing | wouter | Tiny, framework-agnostic |
| UI library | shadcn/ui (Radix) | 60+ components already in `client/src/components/ui/` |
| Animation | Framer Motion | Stiffness 300, damping 28 — established pattern |
| Backend | FastAPI (Python 3.13) + SQLAlchemy 2 | DDD layout, async-ready |
| Database | SQLite (dev) / PostgreSQL (prod) | SQLite in `backend/atada.db`, gitignored |
| Auth | Phone OTP → JWT (access + refresh) | OTP code prints to console in dev |
| LLM | MiniMax M2.7 (Anthropic-compatible endpoint) | Chat (SSE) + VLM (parser) |
| Payments | Stripe Test Mode | ILS currency, employer-only billing |
| PDF | jsPDF + html2canvas (frontend) / ReportLab (backend) | Resume / invoice |
| Geocoding | Google Maps → Nominatim → city table | Tiered fallback, key optional |
| Commute | Google Distance Matrix → haversine | Tiered fallback, key optional |
| Scraper | Playwright (headed/headless) | `backend/fb_scraper.py` for FB groups |

---

## Project Structure (current as of 2026-05-14)

```
D:/AtadaManusVers/
├── client/                         React + Vite frontend
│   └── src/
│       ├── App.tsx                 Wouter routes, AuthProvider, Onboarding
│       ├── pages/                  9 pages (Home, Auth, Profile, Apps, …)
│       ├── components/
│       │   ├── JobCard.tsx         Hero image + match + drive/transit times
│       │   ├── JobFeed.tsx         List with thumbnails
│       │   ├── ChatPanel.tsx       SSE-aware chat
│       │   ├── AvatarPanel.tsx     Left sidebar (DiscoveryPage)
│       │   ├── SwipeLayout.tsx     Mouse/touch swipe between pages
│       │   ├── Onboarding.tsx      First-visit 3-slide intro
│       │   ├── profile/            Resume form + preview + PDF download
│       │   └── ui/                 60 shadcn/ui components
│       ├── contexts/
│       │   ├── AuthContext.tsx     JWT state, login/logout
│       │   └── ThemeContext.tsx    Light only (dark disabled)
│       ├── hooks/                  useSwipe, useResumeState, useMobile, …
│       └── lib/
│           ├── api.ts              All HTTP + SSE calls + JobData type
│           ├── data.ts             Job interface, apiJobToJob adapter, mock fallback
│           └── utils.ts            cn() classnames helper
│
├── backend/                        FastAPI backend
│   ├── app/
│   │   ├── main.py                 Mounts 7 routers, CORS, table autocreate
│   │   ├── config.py               pydantic-settings from .env
│   │   ├── db/database.py          SQLAlchemy engine, get_db dep
│   │   ├── domain/
│   │   │   ├── models.py           9 tables (User, Job, Candidate, …)
│   │   │   └── schemas.py          Pydantic I/O contracts
│   │   ├── services/               Pure business logic, no FastAPI deps
│   │   │   ├── auth.py             OTP gen/verify, JWT, guest sessions
│   │   │   ├── chat.py             SSE generator, MiniMax + mock fallback
│   │   │   ├── matching.py         Skill × commute × salary score
│   │   │   ├── geocode.py          Google → Nominatim → city fallback
│   │   │   ├── commute.py          Distance Matrix → haversine fallback
│   │   │   ├── parser.py           MiniMax VLM screenshot → JSON
│   │   │   └── invoice.py          ReportLab PDF receipt
│   │   └── api/                    HTTP route handlers
│   │       ├── auth.py             /api/auth/*
│   │       ├── jobs.py             /api/jobs/*
│   │       ├── users.py            /api/users/* (auto-geocodes on edit)
│   │       ├── chat.py             /api/chat/stream (SSE)
│   │       ├── payments.py         /api/payments/* (Stripe)
│   │       ├── employer.py         /api/employer/*
│   │       └── parser.py           /api/parser/* (screenshot intake)
│   ├── seed_mock_db.py             Faker bulk seed (100+100)
│   ├── seed_realistic.py           Hand-curated 47 jobs + 20 candidates ← preferred + invoked by auto-seed
│   ├── fb_scraper.py               Playwright FB group scraper CLI
│   ├── fb_cookies.json             FB session cookies (GITIGNORED)
│   ├── atada.db                    SQLite database (GITIGNORED)
│   ├── invoices/                   Generated PDF receipts (GITIGNORED)
│   ├── .env                        Real secrets (GITIGNORED)
│   ├── .env.example                Template, safe to commit
│   ├── Dockerfile                  Local Docker (not used in prod — Render uses Python buildpack)
│   ├── requirements.txt            Full dev deps (incl. playwright)
│   └── requirements-prod.txt       Prod deps (no playwright) ← used by Render
│
├── server/index.ts                 Legacy Express static-file server (production build)
├── shared/const.ts                 Cookie names, time constants
├── docker-compose.yml              Local-only — production doesn't use Docker
├── Dockerfile.frontend             Local-only
├── vite.config.ts                  Proxies /api → :8002, Manus debug plugins dev-only
├── render.yaml                     Render blueprint (live service config)
├── vercel.json                     Vercel project config (SPA rewrites + build)
├── package.json                    pnpm workspace, React 19
│
├── .deploy-tokens.env              LIVE API tokens for Render+Vercel+MiniMax+JWT (GITIGNORED)
│
├── STATUS.md                       Current state, what works/broken (READ FIRST)
├── CLAUDE.md                       This file — operating manual for LLM coding
├── DEPLOY.md                       How to deploy from scratch + current live snapshot
├── CONFERENCE.md                   Day-of-conference checklist (warm-up, talking points)
├── README.md                       Public project intro
├── AUDIT.md                        Investor-style honest audit (pre-deploy snapshot)
├── NextPlanStep.md                 Forward roadmap with effort estimates
├── PRODUCTION_MIGRATION.md         Mock → real swap checklist (partially done)
└── ideas.md                        Original Quiet Modernism design brainstorm
```

---

## How to Run (always run from the project root)

```powershell
# Terminal 1 — backend (must run first)
cd D:\AtadaManusVers\backend
python -m uvicorn app.main:app --port 8002

# Terminal 2 — frontend
cd D:\AtadaManusVers
pnpm dev
```

Site at http://localhost:3000. API at http://127.0.0.1:8002. Vite proxies
`/api/*` automatically.

### Demo logins
Two whitelisted phones — `/api/auth/otp/peek` returns their OTP for one-click
login (any other phone gets 403). On the UI (`/auth`), the **Worker demo** and
**Employer demo** buttons drive the full chain automatically.
- Worker: `+972501234567` (locally OTP also prints in backend console)
- Employer: `+972509876543`

### Re-seed DB
Not needed on prod — backend auto-seeds when `jobs` table is empty (see
`backend/app/main.py:auto_seed_if_empty`). For a forced local refresh:
```powershell
python seed_realistic.py    # 47 hand-curated jobs (preferred)
python seed_mock_db.py      # 100 Faker-generated jobs
```

---

## Key Endpoints (cheat sheet)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST   | `/api/auth/otp/send` | – | Send OTP (prints code in console; returns `demo:true` for whitelisted phones) |
| GET    | `/api/auth/otp/peek?phone=...` | – | DEMO ONLY: latest OTP for the two demo phones; others get 403 |
| POST   | `/api/auth/otp/verify` | – | Verify code → JWT pair |
| GET    | `/api/jobs/feed` | JWT | Personalized match-sorted feed |
| POST   | `/api/jobs/swipe` | JWT | Record Apply/Skip |
| POST   | `/api/chat/stream` | optional | SSE chat with AI |
| POST   | `/api/parser/parse` | optional | Screenshot → DB job |
| POST   | `/api/payments/checkout` | JWT | Stripe Checkout URL |
| GET    | `/api/employer/dashboard` | JWT (employer) | Stats |

Full list in `STATUS.md` or http://127.0.0.1:8002/api/docs (Swagger).

---

## Data Flow

```
Frontend (React)
  └── lib/api.ts (fetch wrapper + SSE)
       └── Vite proxy /api → :8002
            └── FastAPI backend
                 ├── SQLite (jobs, users, matches, …)
                 ├── MiniMax LLM (chat SSE + VLM parser)
                 ├── Stripe (Checkout sessions, webhooks)
                 ├── Google Maps (geocode + commute) — optional, has fallbacks
                 └── Nominatim (free geocode fallback)
```

Job cards: `api.ts::getJobs/getJobFeed()` → `data.ts::apiJobToJob()` adapter
→ `Job` interface → `JobCard.tsx` (which now shows hero image, match score,
drive minutes, transit minutes).

Chat: `api.ts::streamChat()` async generator → `DiscoveryPage.tsx` progressively
updates messages as SSE chunks arrive.

Parser pipeline: `fb_scraper.py` (Playwright) → screenshot bytes → POST to
`/api/parser/parse` → MiniMax VLM → JSON → Job row in SQLite → visible in feed.

Fallback: if backend is down, all frontend pages fall back to mock data from
`data.ts`. UI never breaks because backend is offline.

---

## Coding Conventions

### Frontend
- **No CSS-in-JS** — Tailwind utility classes + custom CSS classes from
  `client/src/index.css` (`.atada-card`, `.btn-pill`, `.btn-pill-solid`,
  `.atada-input`, `.label-xs`, `.label-sm`).
- **Fonts via inline style** — `style={{ fontFamily: "'DM Mono', monospace" }}`
  for labels, `'DM Sans', sans-serif` for prose. Established pattern, don't
  refactor.
- **Animations** — Framer Motion. Default spring: `stiffness: 300, damping: 28`.
- **Icons** — lucide-react only. No emojis unless user asks.
- **State** — React Context for auth/theme, useState/useReducer otherwise.
  No Redux/Zustand.
- **API calls** — always through `client/src/lib/api.ts`. Don't fetch directly
  from components.
- **Mock fallback** — every page that fetches from API should fall back to
  `mockJobs` (or similar) on failure, so the demo never breaks.

### Backend
- **DDD layers** —
  `api/` → calls `services/` → uses `domain/` (models, schemas).
  `services/` are pure Python, no FastAPI imports.
  Never import `services` from each other except via well-defined interfaces.
- **Auth** — JWT in `Authorization: Bearer …` header.
  `Depends(get_current_user)` for required auth, `get_optional_user` for
  guest-friendly endpoints.
- **Async** — `async def` only for endpoints doing I/O (LLM calls, file I/O).
  DB calls are sync via SQLAlchemy session.
- **Errors** — raise `HTTPException(status_code, detail)` from API layer.
  Services raise plain exceptions; let API translate them.
- **External APIs** — always have a fallback. MiniMax → mock. Google Maps →
  Nominatim → city table. Stripe test → mock URL.

---

## Israeli Market Context (don't forget)

- **Workers are free, always.** Israeli law prohibits charging job seekers
  for employment services. Revenue comes from employers only.
- **Hebrew is the primary language for blue-collar / service workers**, but
  the MVP launches in English for the tech market (Gush Dan / Tel Aviv).
  Add Hebrew + RTL in Phase 5.
- **Commute matters.** Israel is small but traffic is brutal. Drive minutes
  and transit minutes are core ranking factors, not nice-to-haves.
- **Currency is ILS (₪).** Stripe is in `ils` currency mode.
- **Phone format** `+972XXXXXXXXX` (no leading zero after country code).

---

## Things Already Tried (don't redo unless asked)

- **Don't migrate frontend to Next.js.** Existing Vite stack works, polished,
  and SSR isn't needed for an auth-walled SaaS. Switch was considered and
  rejected — see `NextPlanStep.md`.
- **Don't replace wouter with React Router.** Wouter is 1KB and works.
- **Don't add Hebrew/RTL yet.** Phase 5 only. Tech audience launches first.
- **Don't add per-worker pricing.** Illegal in Israel. Pricing page is
  employer-only.
- **Don't merge the old Express server (`server/index.ts`) into FastAPI.**
  It only serves the production static build. Kept for legacy.
- **Don't try to use Docker for deploy.** Render uses Python buildpack
  directly from `requirements-prod.txt`. The `Dockerfile` and `docker-compose.yml`
  are local-only artifacts. User's Docker Desktop on Windows is unreliable.
- **Don't try to JSON-parse `CORS_ORIGINS` env var in pydantic-settings.**
  The `Annotated[list[str], NoDecode]` + `field_validator(mode="before")` in
  `config.py` handles JSON, comma-separated, and `"*"`. Don't simplify back to
  `list[str]` — Render boot will crash on plain strings.
- **MiniMax chat is mock right now** — see Known Issue #1 in STATUS.md.
  Don't "fix" it by guessing the endpoint URL; the user has a Token Plan that
  needs an Anthropic-compatible endpoint and the user knows the exact URL.

---

## When You Pick This Up Cold

1. Open **https://atada.vercel.app** — see it live. Click the chevron banner
   → /auth → Worker demo. This is the proof the deploy is alive.
2. Read `STATUS.md` for the current state (what works, what's mocked, prod URLs).
3. Read this file (`CLAUDE.md`) for operating rules.
4. Skim `CONFERENCE.md` if a demo is imminent — it has warm-up and fallback steps.
5. Skim `NextPlanStep.md` for forward direction.
6. To change code, run locally:
   ```powershell
   cd backend; python -m uvicorn app.main:app --port 8002
   # in another terminal
   pnpm dev
   ```
7. Push to `main` → both Render and Vercel auto-redeploy (~5 min for backend,
   ~2 min for frontend).

---

## User's Communication Style

- Russian by default, English technical terms are fine.
- Direct, no fluff. Don't oversell completion when something is half-built.
- When something doesn't work, say what's broken and how to fix it, not "I
  tried but…". Push back if user is wrong with evidence.
- "Готово" means it's verified end-to-end, not "I wrote the code".
