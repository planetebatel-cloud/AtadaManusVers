# ATADA — Investment Audit & Product Roadmap

> Perspective: Multi-billion dollar investor evaluating an early-stage SaaS MVP
> Date: April 2026
> Market: Israel (4.2M workforce, $18B annual recruitment market)

---

## VERDICT: Current State

**What you have:** A beautiful job-swiping UI prototype with a working Python backend, 100 seeded jobs, AI chat (MiniMax), and resume PDF export.

**What you don't have:** A product.

The app today is a **tech demo with no user journeys**. A user cannot sign up, track applications, or pay. An employer cannot post a job or review applicants. 11 out of 16 API functions are built but never connected to any UI.

**Investment readiness:** Pre-seed. Not fundable yet, but the foundation is solid — the design quality alone is top 5% of MVPs I see. The delta between "demo" and "usable product" is smaller than most founders realize.

---

## SECTION 1: CRITICAL PATH TO FIRST PAYING USER

These are non-negotiable. Without all 5, you have zero revenue.

### Step 1: Authentication Flow
**Why it blocks everything:** No auth = no user data = no personalization = no payments = no business.

**Frontend to build:**
- `/auth` page: phone number input + OTP code input (2-step form)
- Auth context (React Context wrapping App.tsx)
- Protected routes (redirect to /auth if no token)
- Progressive onboarding: let guests see 3 cards, then auth wall
- After first login: quick profile setup (name, location, 3 skills)

**Backend exists:** OTP send/verify + JWT + guest sessions are done. Wire them.

**Effort:** 1 session. This is the highest-ROI work in the entire project.

### Step 2: Application Tracking Page
**Why it matters:** "Apply" is meaningless if users never see what happened.

**Frontend to build:**
- `/applications` page: list of applied jobs with statuses
- Status badges: Applied → Reviewed → Interview → Offer → Rejected
- Tap to expand → show job details + applied date
- Empty state: "No applications yet. Start swiping!"

**Backend exists:** `GET /api/users/me/applications` is done. Just render it.

**Effort:** 1 session.

### Step 3: Employer Dashboard (Minimum Viable)
**Why it matters:** Employers are the PAYING side. Without this, revenue = 0.

**Frontend to build:**
- `/employer` route group (3 pages):
  - `/employer/dashboard`: stats (posted jobs, new applicants, views)
  - `/employer/jobs`: list of posted jobs + "Post New Job" form
  - `/employer/applicants`: applicant list per job, status dropdown (review/interview/reject)
- Role-based routing: if `user.role === "employer"`, redirect to employer view

**Backend exists:** All 4 employer endpoints are done. Need UI only.

**Effort:** 2 sessions.

### Step 4: Pricing & Checkout
**Why it matters:** Without this you literally cannot make money.

**Frontend to build:**
- `/pricing` page: 3 plan cards (Free / Pro 29 ILS / Pro+ 49 ILS)
- Employer plan card (999 ILS/mo)
- Checkout button → calls `createCheckout()` → redirects to Stripe
- After payment success: update user plan in UI
- Plan badge on profile

**Backend exists:** Stripe checkout + webhook + plans are done.

**Effort:** 1 session.

### Step 5: User Settings
**Why it matters:** Users need control over their account.

**Frontend to build:**
- `/settings` page: edit name, email, phone, location, skills
- Current plan display + upgrade button
- Logout button (clear tokens)
- Delete account request (sends email, doesn't auto-delete)

**Effort:** 1 session.

**Total for Critical Path: 6 sessions = ~2 weeks of focused work.**

---

## SECTION 2: FEATURES THAT DRIVE RETENTION

Without these, users try the app once and never return.

### 2.1 Notifications System
**Problem:** Users apply and hear nothing back. Silence = churn.

**Build:**
- Backend: `notifications` table (user_id, type, message, read, created_at)
- Backend: trigger notification on: application status change, new matching job, employer message
- Frontend: notification bell icon in header with unread count
- Frontend: `/notifications` page with chronological list
- Phase 2: email notifications via SendGrid/Resend (start with in-app only)

**Effort:** 2 sessions.

### 2.2 Job Detail View
**Problem:** "More" button says "coming soon". Users can't read full job descriptions before applying.

**Build:**
- Expandable card or modal with: full description, company info, salary breakdown, skills match explanation, "Apply" CTA
- "Save for later" button (new `saved_jobs` table)
- Share button (copy link)

**Effort:** 1 session.

### 2.3 Onboarding Flow
**Problem:** New users land in the app with zero context.

**Build:**
- First launch: 3-slide intro carousel ("Swipe right to apply", "AI matches you", "Track applications")
- After signup: mandatory profile completion (name + location + 3 skills)
- Skip option that nags after 5 swipes
- Employer path: separate onboarding ("Post your first job in 60 seconds")

**Effort:** 1 session.

### 2.4 Personalized Feed (Use the Match Engine)
**Problem:** Right now jobs are loaded via `getJobs()` (raw list). The `getJobFeed()` endpoint exists but isn't called. It returns match-scored, personalized results.

**Fix:**
- Authenticated users: call `getJobFeed()` instead of `getJobs()`
- Show match score prominently on each card
- Add "Why this match?" tooltip showing factor breakdown (skills 40%, location 30%, etc.)

**Effort:** 0.5 sessions (mostly wiring).

---

## SECTION 3: FEATURES THAT DRIVE REVENUE

### 3.1 Employer Job Posting with Payment
**Flow:**
1. Employer clicks "Post a Job" → form (title, description, location, salary, tags)
2. Preview card (shows exactly what workers see)
3. "Post for 199 ILS" → Stripe checkout → job goes live
4. "Boost for 99 ILS/week" → priority in matching algorithm

**Revenue impact:** Single largest revenue driver. 10 employers posting 3 jobs/month = 5,970 ILS/month from day 1.

### 3.2 Premium Worker Features
**Free tier limits (implement these):**
- 10 swipes/day (count in backend, enforce)
- Basic match score (no factor breakdown)
- No resume AI review

**Pro tier (29 ILS/mo):**
- Unlimited swipes
- Full match breakdown
- AI resume review (Claude/MiniMax analyzes resume against job requirements)
- Priority in employer search results

**Pro+ tier (49 ILS/mo):**
- Everything in Pro
- Direct message employers
- Salary insights (anonymized market data)
- "Early access" to new jobs (24h before free users)

### 3.3 Employer Analytics Dashboard
**Premium employer feature:**
- Views per job posting over time
- Application conversion rate
- Candidate quality score distribution
- Competitor benchmark (how their salary compares to market)
- Exportable reports (PDF/CSV)

---

## SECTION 4: BACKEND PRIORITIES

### Must Build Before Launch:
1. **Rate limiting** — prevent API abuse (use SlowAPI or custom middleware)
2. **Input validation** — Zod is installed but unused; validate all user inputs
3. **Application status change notifications** — when employer changes status, notify worker
4. **Swipe limits enforcement** — free users get 10/day, count in DB
5. **Job expiration** — auto-deactivate jobs after 30 days
6. **Saved jobs endpoint** — `POST/DELETE /api/jobs/:id/save`

### Must Build Before Scale:
1. **PostgreSQL migration** — SQLite won't handle concurrent writes
2. **Redis caching** — cache match scores, hot job listings
3. **Background job queue** — Celery or ARQ for match computation, emails
4. **File storage** — S3/Cloudflare R2 for resume PDFs, company logos
5. **Audit logging** — track who did what for compliance
6. **API versioning** — `/api/v1/` prefix for backward compatibility

---

## SECTION 5: MARKETING STRATEGY (ISRAEL)

### Phase A: Pre-Launch (Weeks 1-4)
**Goal:** 500 email signups before writing a single ad.

1. **Landing page** (separate from app): "Swipe your way to your next job"
   - Hero: phone mockup showing swipe UI
   - 3 value props: AI matching, commute-aware, one-swipe apply
   - Email capture form: "Get early access"
   - Deploy on atada.co.il

2. **LinkedIn content strategy:**
   - Founder posts 3x/week about Israeli job market pain points
   - Topics: "Why Israeli job boards are stuck in 2010", "The commute problem nobody talks about", "I'm building Tinder for jobs"
   - Target: Israeli tech community (200K+ on LinkedIn)
   - Cost: 0 ILS

3. **Tech community seeding:**
   - Post on Hacker News: "Show HN: Tinder for jobs — built for Israel"
   - Israeli tech Facebook groups (Mamas & Papas B'Hi-Tech, Secret Tel Aviv Jobs)
   - Product Hunt launch (day 1 of public beta)
   - Israeli tech podcasts (Geektime, The Gentlemen)

### Phase B: Soft Launch (Weeks 5-8)
**Goal:** 2,000 workers + 20 employers in Tel Aviv tech.

1. **Niche focus: React/TypeScript developers in Gush Dan**
   - This is your demo user "Alex M." — build for exactly this person
   - Seed 200 real React/TS job listings (manual + parser)
   - Partner with 5-10 Israeli tech companies for launch (Wix, Monday, Fiverr — approach their talent teams)

2. **Referral program:**
   - "Invite a friend → both get 1 week Pro free"
   - Referral link in app + share button on job cards
   - Target: 30% viral coefficient (each user brings 0.3 new users)

3. **Employer outreach (direct sales):**
   - Email 100 Israeli tech HR managers personally
   - Offer: "Post your first 3 jobs free, get 50 pre-matched candidates"
   - Use the AI matching as the hook — "We only send relevant applicants"
   - Sales tool: employer dashboard demo video (60 seconds)

### Phase C: Growth (Months 3-6)
**Goal:** 25,000 workers + 200 employers.

1. **Google Ads (Hebrew + English):**
   - Keywords: "work in tel aviv", "tech jobs israel", "find developers israel"
   - Budget: 3,000-5,000 ILS/month
   - Target CAC: < 15 ILS per worker signup

2. **Content marketing:**
   - Blog: "Salary Report: What React Developers Earn in Israel 2026"
   - Use anonymized data from the platform (job posting salaries)
   - SEO play: rank for "jobs in tel aviv", "developer salary israel"

3. **University partnerships:**
   - Partner with 3-5 Israeli universities (Technion, TAU, Hebrew U)
   - "Atada for Students" — free Pro tier for .ac.il emails
   - Campus ambassador program

4. **Expand to blue-collar/gig:**
   - Phase 2 of product: plumbers, electricians, delivery drivers
   - Different UI (simpler cards, location-first, hourly rate prominent)
   - Partnership with Israeli gig platforms

### Phase D: Scale (Months 6-12)
1. **B2B enterprise sales:** Dedicated account managers for companies with 50+ openings
2. **ATS integration:** Connect with existing HR tools (Comeet, Greenhouse — both Israeli)
3. **Geographic expansion:** Consider UAE, Cyprus, Greece (similar market size + dynamics)

---

## SECTION 6: FINANCIAL MODEL

### Revenue Streams (Priority Order):
1. **Employer job postings** (199 ILS/post) — 60% of revenue
2. **Employer subscriptions** (999 ILS/mo) — 25% of revenue
3. **Worker Pro/Pro+** (29-49 ILS/mo) — 15% of revenue

### 12-Month Projection:

| Month | Workers | Employers | MRR (ILS) | Burn (ILS) | Net |
|-------|---------|-----------|-----------|------------|-----|
| 1 | 500 | 5 | 2,000 | 15,000 | -13,000 |
| 2 | 1,500 | 15 | 8,000 | 15,000 | -7,000 |
| 3 | 4,000 | 35 | 22,000 | 18,000 | +4,000 |
| 4 | 8,000 | 60 | 45,000 | 20,000 | +25,000 |
| 6 | 20,000 | 120 | 95,000 | 25,000 | +70,000 |
| 9 | 40,000 | 250 | 200,000 | 35,000 | +165,000 |
| 12 | 70,000 | 400 | 350,000 | 45,000 | +305,000 |

**Break-even: Month 3** (if employer acquisition goes well).

**Key assumption:** 1 employer = ~3 job posts/month average = ~600 ILS/month revenue per employer.

### Funding Needs:
- **Pre-seed (now):** 50,000 ILS to cover months 1-3 (runway to break-even)
- **Seed (month 6):** 500,000-1,000,000 ILS for team, marketing, geographic expansion
- **Series A (month 18):** If 500K+ MRR, raise 5-10M ILS for regional expansion

---

## SECTION 7: EXECUTION PRIORITY MATRIX

### Do FIRST (Week 1-2):
| # | Task | Impact | Effort | ROI |
|---|------|--------|--------|-----|
| 1 | Auth UI (login/signup page) | Critical | 1 session | Infinite (unlocks everything) |
| 2 | Wire `getJobFeed()` for personalized matches | High | 0.5 session | Instant UX lift |
| 3 | Applications tracking page | High | 1 session | Retention driver |
| 4 | Basic onboarding (3 slides + profile setup) | High | 1 session | First impression |

### Do SECOND (Week 3-4):
| # | Task | Impact | Effort | ROI |
|---|------|--------|--------|-----|
| 5 | Employer dashboard + job posting form | Critical (revenue) | 2 sessions | Enables monetization |
| 6 | Pricing page + Stripe checkout wiring | Critical (revenue) | 1 session | First payment |
| 7 | Job detail modal (replace "coming soon") | Medium | 1 session | Better conversion |
| 8 | Notification system (in-app) | Medium | 1.5 sessions | Retention |

### Do THIRD (Week 5-6):
| # | Task | Impact | Effort | ROI |
|---|------|--------|--------|-----|
| 9 | Landing page (atada.co.il) | High (marketing) | 1 session | User acquisition |
| 10 | User settings page | Medium | 1 session | Account control |
| 11 | Saved jobs feature | Medium | 0.5 session | Engagement |
| 12 | Swipe limits (free tier enforcement) | Medium | 0.5 session | Conversion to paid |

### Do FOURTH (Week 7-8):
| # | Task | Impact | Effort | ROI |
|---|------|--------|--------|-----|
| 13 | PostgreSQL migration | Technical | 1 session | Scale readiness |
| 14 | E2E tests (Playwright, critical paths) | Technical | 2 sessions | Ship confidence |
| 15 | Production deploy (Vercel + Railway) | Critical | 1 session | Go live |
| 16 | Analytics (Posthog) + Error tracking (Sentry) | Medium | 0.5 session | Data-driven decisions |

---

## SECTION 8: COMPETITIVE MOAT

### What makes Atada defensible:

1. **Network effects:** More workers = more employers = more workers. Once you hit critical mass in one city, it's hard to displace.

2. **AI matching data:** Every swipe trains the algorithm. After 100K swipes, your matching quality is unreplicable by a new entrant.

3. **Commute integration:** No Israeli job platform factors in real commute time. This is a genuine differentiator.

4. **Mobile-first UX:** AllJobs and Drushim look like they were built in 2008. The UX gap is your moat.

5. **Two-sided lock-in:** Employers who post on Atada get pre-matched candidates (not 500 random applications). This quality filter is the value prop that keeps them paying.

### What does NOT protect you:
- Technology (anyone can build a swipe UI)
- Design (can be copied in weeks)
- AI (MiniMax/OpenAI available to everyone)

**Your only real moat is execution speed + network density in Israel.** First mover who hits 50K workers in Gush Dan wins.

---

## SECTION 9: RISKS & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|------------|
| No employers sign up | Fatal | Scrape existing job boards first. Employers come when they see applicants. |
| Workers churn after first visit | High | Onboarding + notifications + application tracking. Give reasons to return. |
| LinkedIn launches similar feature | High | LinkedIn is global and slow. You're local and fast. Commute feature is your edge. |
| Regulation (Israeli labor law) | Medium | You're a marketplace, not an employer. Standard legal disclaimer. |
| MiniMax API quality | Medium | Keep mock fallback. Evaluate switching to Claude/GPT if quality is low. |
| Solo founder burnout | High | Ship MVP in 8 weeks, get first revenue, hire first employee. |

---

## FINAL VERDICT

**Should I invest?**

Not yet. But I would **in 8 weeks** if you:
1. Ship auth + employer dashboard + payments (Steps 1-6 above)
2. Get 10 real employers posting real jobs
3. Get 1,000 real workers swiping
4. Show me month-over-month growth in applications

**The technical foundation is strong.** The design is excellent. The market is real. What's missing is the last 30% of product work that turns a demo into a business.

**The path from here to 350K ILS/month MRR is 8 weeks of code + 4 months of sales.** That's an unusually short path for a SaaS startup. Most founders spend 12+ months before first revenue.

You have a real shot. Execute fast.
