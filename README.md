# Atada

> **AI-powered job matching for Israel.**
> Workers swipe on jobs Tinder-style. Employers find pre-matched candidates.

[![Status: MVP](https://img.shields.io/badge/status-MVP-orange)](./STATUS.md)
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20FastAPI-blue)]()
[![License: proprietary](https://img.shields.io/badge/license-proprietary-red)]()

---

## What it is

Atada is a job marketplace built for the Israeli market.
- **Workers** swipe on AI-ranked job cards (free forever — Israeli law).
- **Employers** post jobs and receive pre-matched applicants (199 ILS/post or
  999 ILS/mo subscription).
- A **screenshot parser** turns Facebook group job posts into structured
  database entries via MiniMax VLM.
- **Commute-aware matching** ranks jobs by skills × distance × salary fit.

### Why it exists

Israeli job boards (AllJobs, Drushim) feel like 2010. Atada is mobile-first,
swipe-driven, and ranks jobs by actual commute time — not just by date posted.

---

## Quick start

You need: Python 3.13, Node 22+, pnpm.

```bash
# Clone
git clone https://github.com/YOUR-USERNAME/atada.git
cd atada

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env             # add MINIMAX_API_KEY here (optional)
python seed_realistic.py         # 47 jobs + 20 candidates
python -m uvicorn app.main:app --port 8002

# Frontend (new terminal, from project root)
pnpm install
pnpm dev
```

Open http://localhost:3000.

**Demo logins** (OTP code prints in the backend terminal):
- Worker: `+972501234567`
- Employer: `+972509876543`

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 7, TailwindCSS 4, Framer Motion, wouter |
| Backend | FastAPI (Python 3.13), SQLAlchemy 2, Pydantic v2 |
| Database | SQLite (dev), PostgreSQL (prod) |
| Auth | Phone OTP → JWT (access + refresh) |
| LLM | MiniMax M2.7 (chat + vision) |
| Payments | Stripe (test mode, ILS currency) |
| Geocode + commute | Google Maps Distance Matrix → Nominatim → haversine |
| Scraper | Playwright (Facebook groups → screenshots → parser) |

---

## Project Status

This is a **functional MVP** with all main user journeys wired end-to-end.
What's not done: production hosting, real SMS provider, Hebrew translation,
test suite.

For a precise list of what works, what's mocked, and what's missing, read
**[STATUS.md](./STATUS.md)** — it's the single source of truth.

For LLM coding assistants picking up the project: read **[CLAUDE.md](./CLAUDE.md)**
before editing anything.

---

## Architecture

```
                      ┌─────────────────┐
                      │  Worker (free)  │
                      │ swipes on jobs  │
                      └────────┬────────┘
                               │
                          /api/jobs/feed
                               │
                               ▼
┌──────────────┐   GET   ┌───────────────┐   SQL   ┌─────────────────┐
│  Vite :3000  │────────▶│  FastAPI :8002│────────▶│  SQLite atada.db│
│  React 19    │  proxy  │  7 routers    │         │  9 tables       │
└──────┬───────┘         └───────┬───────┘         └─────────────────┘
       │                         │
       │                         ├──▶ MiniMax LLM (chat SSE + VLM parser)
       │                         ├──▶ Stripe (Checkout, webhooks)
       │                         ├──▶ Google Maps (geocode + commute, opt.)
       │                         └──▶ Nominatim fallback (geocode)
       │
       └──▶ html2canvas + jsPDF (resume PDF with watermark)

  fb_scraper.py ──▶ Playwright ──▶ screenshots ──▶ /api/parser/parse
```

Full layout in [STATUS.md](./STATUS.md#architecture-one-pager).

---

## Documents

| File | What it covers |
|------|---------------|
| [STATUS.md](./STATUS.md) | **Start here.** Current state, what works, what's mocked. |
| [CLAUDE.md](./CLAUDE.md) | Operating manual for LLM coding assistants. |
| [AUDIT.md](./AUDIT.md) | Honest investor-style audit. |
| [NextPlanStep.md](./NextPlanStep.md) | Forward roadmap with effort estimates. |
| [PRODUCTION_MIGRATION.md](./PRODUCTION_MIGRATION.md) | Mock-by-mock list to swap before deploy. |
| [ideas.md](./ideas.md) | Original design philosophy brainstorm. |

---

## Contributing

This is a closed-source pre-launch project. If you found this repo via a
referral, contact the founder before opening PRs.

---

## License

Proprietary. All rights reserved. © Atada 2026.
