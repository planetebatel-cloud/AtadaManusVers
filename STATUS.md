# ATADA — Project Status

> **Read this file first.** It's the single source of truth for what works,
> what's broken, and what's next.
>
> Last updated: 2026-05-14 (deploy day)

---

## TL;DR

Atada is a **job matching platform for the Israeli market**, MVP stage,
**deployed live on free tiers** for a conference demo.

- Workers swipe on jobs (Tinder-style), employers find candidates via AI chat.
- Workers are free forever (Israeli law), employers pay (199 ILS/post or 999 ILS/mo).
- **Public demo:** any visitor can one-click-login as a demo Worker or Employer
  (no phone, no SMS) and walk through the full flow.

| Layer | Where | URL |
|---|---|---|
| 🌐 Frontend | Vercel (free, hobby) | **https://atada.vercel.app** |
| 🔧 Backend | Render (free) | **https://atada-api.onrender.com** |
| 📚 API docs (Swagger) | Render | https://atada-api.onrender.com/api/docs |
| 📦 GitHub | public repo | https://github.com/planetebatel-cloud/AtadaManusVers |

---

## Production infrastructure (live)

### Render (backend)
- **Service:** `atada-api` — `srv-d82sktrrjlhs73dr34t0`
- **Owner workspace:** `tea-d82shod7vvec738ch2u0` (planetebatel@gmail.com)
- **Dashboard:** https://dashboard.render.com/web/srv-d82sktrrjlhs73dr34t0
- **Runtime:** Python 3.13.0, no Docker. Buildpack reads `backend/requirements-prod.txt`.
- **Build:** `pip install -r requirements-prod.txt`
- **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health:** `/api/health`
- **Region:** Oregon (us-west)
- **Auto-deploy:** yes (push to `main` → rebuild)
- **Cold start:** ~30-40s after 15 min of inactivity (free-tier sleeps).
  **Warm the backend before any demo** by hitting `/api/health`.

### Vercel (frontend)
- **Project:** `atada` — `prj_Y3LZ9fmDNVtqY0ijxZMn5qvE1lDW`
- **Team:** `team_IAsbw3Ot1l0EaUQWk53TGCEb` (planetebatel-5775s-projects)
- **Dashboard:** https://vercel.com/planetebatel-5775s-projects/atada
- **Build:** `pnpm vite build` → `dist/public`
- **SSO protection:** **OFF** (so visitors hit the app directly, not a Vercel login wall)
- **SPA fallback:** `vercel.json` rewrites all non-`/api/` paths to `/index.html`

### Tokens / secrets
- Stored locally in `D:\AtadaManusVers\.deploy-tokens.env` (in `.gitignore`, never pushed).
- Contains: `VERCEL_TOKEN`, `RENDER_API_KEY`, `MINIMAX_API_KEY`, `JWT_SECRET`.
- Render env vars (synced via API): `MINIMAX_API_KEY`, `JWT_SECRET`,
  `CORS_ORIGINS=https://atada.vercel.app`, `DEBUG=False`, `PYTHON_VERSION=3.13.0`.
- Vercel env: `VITE_API_URL=https://atada-api.onrender.com/api` (production/preview/dev).

### GitHub
- **Repo:** https://github.com/planetebatel-cloud/AtadaManusVers
- **Visibility:** **PUBLIC** (required so Render free tier can clone without OAuth).
  Can be flipped back to private — but Render will stop rebuilding until you
  reconnect via GitHub App.
- **Auth scopes on local `gh`:** `gist`, `read:org`, `repo`, `workflow`.

---

## How to run (local dev)

**Two terminals.**

### Terminal 1 — Backend
```powershell
cd D:\AtadaManusVers\backend
python -m uvicorn app.main:app --port 8002
```
- Health: http://127.0.0.1:8002/api/health
- API docs: http://127.0.0.1:8002/api/docs

### Terminal 2 — Frontend
```powershell
cd D:\AtadaManusVers
pnpm dev
```
- Site: http://localhost:3000
- Vite proxies `/api/*` to :8002

### Demo logins
On the live site or locally, hit `/auth` and click **Worker demo** or
**Employer demo** — one click, no phone, no SMS needed. Backend whitelists
exactly these two numbers for `/api/auth/otp/peek`:
- Worker: `+972501234567`
- Employer: `+972509876543`

### Re-seed DB (only if empty)
The backend auto-seeds on startup when the `jobs` table is empty (handles
Render's diskless free tier). To force a fresh local seed:
```powershell
cd D:\AtadaManusVers\backend
python seed_realistic.py    # 47 hand-curated jobs + 20 candidates
```

---

## What works end-to-end (verified on production 2026-05-14)

| Flow | Status | Notes |
|------|--------|-------|
| Frontend loads at `atada.vercel.app` | ✅ | HTML + JS bundle ship from Vercel CDN |
| Backend health at `atada-api.onrender.com/api/health` | ✅ | Returns `{"status":"ok"}` |
| CORS preflight from Vercel → Render | ✅ | `allow-origin: https://atada.vercel.app`, credentials=true |
| Auto-seed on cold start | ✅ | 47 jobs + 20 candidates + 2 demo users created if DB empty |
| Demo banner (sticky black strip) | ✅ | Visible on `/`, hidden on `/auth` and when logged in |
| One-click Worker demo login | ✅ | `otp/send → otp/peek → otp/verify → /me` chain, redirects to `/` |
| One-click Employer demo login | ✅ | Same chain, redirects to `/employer` |
| Phone OTP login (for non-demo numbers) | ⚠️ | Backend still prints code to console — fine for local dev, broken for any visitor who tries their real phone on prod (no SMS provider) |
| Personalized job feed | ✅ | Match score by skills × commute × salary; Wix at 70% for demo worker |
| Swipe Apply / Skip | ✅ | `POST /api/jobs/swipe` records Application row, match_score persisted |
| Employer dashboard | ✅ | `/api/employer/dashboard` returns total_jobs, applicants, plan |
| Resume builder + PDF | ✅ | html2canvas + jsPDF, diagonal "ATADA" watermark, works locally — needs re-test on prod |
| AI chat (SSE streaming) | ⚠️ | **Mock responses only.** Code calls MiniMax OpenAI-style endpoint; user's Token Plan needs Anthropic-compatible URL (see "Known issues") |
| Screenshot parser `/api/parser/parse` | ✅ | Endpoint works; depends on MiniMax VLM — currently uses same OpenAI-style call, may share the mock-fallback fate |
| Stripe checkout | ✅ | Test mode. Real cards rejected. Buttons work, flow visible. |

---

## What's mocked / not production-ready

| Thing | Where | What to swap to make it real |
|-------|-------|------------------------------|
| SMS OTP for real phone numbers | `backend/app/services/auth.py:send_otp` → `print()` + Render console | Twilio (~$0.04/SMS to IL). Demo accounts bypass via `/otp/peek`. |
| AI chat → MiniMax | `backend/app/services/chat.py:_stream_minimax` | Rewrite for Anthropic-compatible endpoint (user has Token Plan) |
| Database | SQLite on Render free (resets every restart) | PostgreSQL on Render paid / Neon / Supabase |
| Stripe keys | `backend/.env` → `sk_test_PLACEHOLDER` | Real `sk_live_...` from Stripe Israel |
| Invoice PDF | `backend/app/services/invoice.py` (ReportLab) | Real Israeli tax invoice (Green Invoice / iCount API) |
| Real avatars / job photos | Stock Unsplash URLs from seeder | S3 / Cloudflare R2 user uploads |
| Hebrew + RTL | UI is English-only | react-i18next + Tailwind RTL plugin |

---

## Known issues

1. **MiniMax chat is mock.** `chat.py` calls
   `https://api.minimaxi.chat/v1/text/chatcompletion_v2` (OpenAI-style). User
   has a **Token Plan** key, which needs an **Anthropic-compatible** endpoint
   per global `~/.claude/CLAUDE.md`. Backend catches the failure and yields
   nothing; frontend falls back to `getNextAiResponse()` in `data.ts`. To fix:
   need exact Token Plan endpoint URL + model name from the user, then rewrite
   `_stream_minimax` to use `x-api-key` + `messages` + `content_block_delta`
   chunks. Also strip `<think>...</think>` tags from output.
2. **Render free sleeps after 15 min.** First request after idle = ~30s
   cold-start. Warm `/api/health` before any demo session.
3. **SQLite resets on restart on Render free.** Auto-seed in `main.py:auto_seed_if_empty`
   restores jobs + demo users every cold boot. Any real applications created
   by visitors will be wiped — acceptable for conference demo.
4. **CORS is locked to one domain.** `CORS_ORIGINS=https://atada.vercel.app`.
   Preview deploys at `atada-*-planetebatel-5775s-projects.vercel.app` will be
   blocked. If you need preview deploys to talk to prod backend, add their
   exact URL to `CORS_ORIGINS` (comma-separated).
5. **GitHub repo is public.** Required for Render free without OAuth. If you
   flip to private, Render rebuilds will start failing. Either keep public, or
   set up the Render GitHub App via the Render dashboard.
6. **Repo contains no production secrets**, but the `.deploy-tokens.env` file
   exists locally on the user's machine with live API keys for Render, Vercel,
   MiniMax, plus the production `JWT_SECRET`. Treat as sensitive. Rotate after
   the conference if needed.

---

## What's deployed but not yet polished (priorities for next session)

In rough priority order:

1. **Fix MiniMax chat** — see Known issues #1. ~15-30 min once endpoint is confirmed.
2. **Conference warm-up routine** — script that pings `/api/health` + a few
   endpoints from a cron, so the bot never goes cold during the show. Or just
   manually hit the URL 2 min before stage.
3. **Real SMS for visitors who want to try with their phone** — Twilio trial
   credits. Otherwise the only working path for a real human is the demo buttons.
4. **Persist applications between Render restarts** — switch to Postgres (Neon
   free tier is fine for demo loads).
5. **Avatar/photo upload** — Cloudflare R2 free tier.
6. **Sentry + Posthog** — see what real users actually click on the live site.

---

## Architecture (one-pager)

```
                       ┌─────────────────┐
                       │  Visitor        │
                       │  any browser    │
                       └────────┬────────┘
                                │ HTTPS
                                ▼
                  ┌─────────────────────────┐
                  │   atada.vercel.app      │ ← Vercel CDN edge
                  │   React 19 + Vite SPA   │
                  └────────────┬────────────┘
                               │ fetch /api/*
                               │ (VITE_API_URL baked into bundle)
                               ▼
              ┌──────────────────────────────────┐
              │ atada-api.onrender.com           │ ← Render free web service
              │ FastAPI + uvicorn :PORT          │
              │ 7 routers + auto-seed on boot    │
              └───────────────┬──────────────────┘
                              │
            ┌─────────────────┼─────────────────────┐
            │                 │                     │
            ▼                 ▼                     ▼
     SQLite atada.db   MiniMax API (mock)   Stripe (test mode)
     (in-container,       chat + VLM         checkout URLs
      resets every restart)
```

---

## Backend layout (DDD-ish)

```
backend/
├── app/
│   ├── main.py              FastAPI app, mounts 7 routers, auto_seed_if_empty()
│   ├── config.py            Settings from .env, CORS_ORIGINS via NoDecode validator
│   ├── db/database.py       SQLAlchemy engine + session
│   ├── domain/
│   │   ├── models.py        9 SQLAlchemy tables
│   │   └── schemas.py       Pydantic I/O contracts
│   ├── services/
│   │   ├── auth.py          OTP, JWT, guest sessions  (DEMO_PHONES whitelisted)
│   │   ├── chat.py          SSE stream, MiniMax + mock  ← needs Anthropic rewrite
│   │   ├── matching.py      Skill × distance × salary scoring
│   │   ├── geocode.py       Google → Nominatim → city fallback
│   │   ├── commute.py       Distance Matrix → haversine fallback
│   │   ├── parser.py        MiniMax VLM image → JSON
│   │   └── invoice.py       ReportLab PDF
│   └── api/
│       ├── auth.py          /api/auth/*  (incl. GET /otp/peek for demo)
│       ├── jobs.py          /api/jobs/*
│       ├── users.py         /api/users/*
│       ├── chat.py          /api/chat/stream  (SSE)
│       ├── payments.py      /api/payments/*  (Stripe)
│       ├── employer.py      /api/employer/*
│       └── parser.py        /api/parser/*
├── seed_realistic.py        Hand-curated (47 + 20)  ← invoked by auto-seed
├── seed_mock_db.py          Faker bulk seeder (100 + 100, unused on prod)
├── fb_scraper.py            Playwright FB group scraper (local only)
├── requirements.txt         Full local deps (incl. playwright)
├── requirements-prod.txt    Production deps (no playwright) — used by Render
├── atada.db                 SQLite (gitignored)
└── .env                     Local secrets (gitignored)
```

---

## Frontend layout

```
client/src/
├── App.tsx                  Wouter routes, AuthProvider, Onboarding, DemoBanner
├── pages/
│   ├── Home.tsx             SwipeLayout container (Discovery ↔ Feed)
│   ├── DiscoveryPage.tsx    Avatar + chat + job cards
│   ├── FeedPage.tsx         AI chat + scrollable job feed
│   ├── ProfilePage.tsx      Resume editor + PDF
│   ├── AuthPage.tsx         One-click Worker/Employer demo + phone OTP form
│   ├── ApplicationsPage.tsx Track applied jobs
│   ├── EmployerPage.tsx     Dashboard + post job
│   ├── PricingPage.tsx      Employer plans
│   └── NotFound.tsx
├── components/
│   ├── DemoBanner.tsx       NEW: sticky top strip for unauthenticated visitors
│   ├── JobCard.tsx          Hero image + match badge + Apply/Skip
│   ├── JobFeed.tsx          List with thumbnails
│   ├── ChatPanel.tsx        SSE-aware chat UI (falls back to mock on empty stream)
│   ├── AvatarPanel.tsx      Left sidebar
│   ├── SwipeLayout.tsx      Mouse/touch swipe between sibling pages
│   ├── Onboarding.tsx       First-visit 3-slide intro
│   ├── ErrorBoundary.tsx
│   ├── profile/             Resume form, preview, PDF download
│   └── ui/                  60+ shadcn components
├── contexts/
│   ├── AuthContext.tsx      JWT state + login/logout
│   └── ThemeContext.tsx     Light/dark (dark disabled)
└── lib/
    ├── api.ts               All HTTP + SSE calls; reads VITE_API_URL
    ├── data.ts              Job interface, mockJobs fallback, apiJobToJob adapter
    └── utils.ts             cn()
```

---

## API endpoints (cheat sheet)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET    | `/api/health` | – | Health check |
| POST   | `/api/auth/guest` | – | Anonymous session token |
| POST   | `/api/auth/otp/send` | – | Send OTP (prints to console; demo phones get `demo:true` flag) |
| GET    | `/api/auth/otp/peek?phone=...` | – | **NEW:** Return latest OTP for whitelisted demo phones (others get 403) |
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
| POST   | `/api/chat/stream` | optional | SSE chat (mock until MiniMax fixed) |
| POST   | `/api/payments/checkout` | JWT | Stripe Checkout URL |
| POST   | `/api/payments/webhook` | Stripe sig | Stripe events |
| GET    | `/api/employer/dashboard` | JWT employer | Stats |
| GET    | `/api/employer/applicants` | JWT employer | Applicant list |
| PATCH  | `/api/employer/applicants/:id` | JWT employer | Update applicant status |
| POST   | `/api/employer/jobs` | JWT employer | Post a job |
| POST   | `/api/parser/parse` | optional | Screenshot → DB job |
| POST   | `/api/parser/parse/preview` | – | Screenshot → JSON (no save) |

Full schema: https://atada-api.onrender.com/api/docs

---

## Document map (which file to read for what)

| File | What it covers |
|------|---------------|
| `STATUS.md` (this) | **Start here.** Current state, what works, what's mocked, prod URLs |
| `CLAUDE.md` | LLM operating rules + production infra block |
| `README.md` | Public-facing intro |
| `DEPLOY.md` | How to deploy from scratch + current live-deploy snapshot |
| `CONFERENCE.md` | Day-of-conference checklist (warm-up, talking points, fallback plan) |
| `AUDIT.md` | Pre-deploy investor-style audit (slightly stale, useful for "before vs after") |
| `NextPlanStep.md` | Forward roadmap with effort estimates |
| `PRODUCTION_MIGRATION.md` | Mock-by-mock list — partially completed by the May 14 deploy |
| `ideas.md` | Original design philosophy brainstorm (Quiet Modernism) |

When picking this project up cold:
1. Read **STATUS.md** (this file) — current state + prod URLs
2. Read **CLAUDE.md** — operating rules
3. Open **https://atada.vercel.app** — see it live
4. Run locally if you need to change code:
   ```powershell
   cd backend; python -m uvicorn app.main:app --port 8002
   # in another terminal
   pnpm dev
   ```
