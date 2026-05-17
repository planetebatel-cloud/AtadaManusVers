# ATADA — Деплой демо (бесплатно)

Бэк → **Render free**, фронт → **Vercel free**, БД → SQLite (auto-seed на каждом
старте, поэтому persistent disk не нужен). Docker не используется.

---

## ✅ Текущий живой деплой (2026-05-14)

Всё уже задеплоено и работает. Эта секция — снимок состояния, чтобы не
догадываться.

| Что | Где | ID / URL |
|---|---|---|
| Frontend | Vercel (hobby) | `https://atada.vercel.app` · project `prj_Y3LZ9fmDNVtqY0ijxZMn5qvE1lDW` · team `team_IAsbw3Ot1l0EaUQWk53TGCEb` |
| Backend | Render (free) | `https://atada-api.onrender.com` · service `srv-d82sktrrjlhs73dr34t0` · owner `tea-d82shod7vvec738ch2u0` |
| GitHub repo (public) | github.com | `planetebatel-cloud/AtadaManusVers` |
| API токены (локально, в `.gitignore`) | `D:\AtadaManusVers\.deploy-tokens.env` | `VERCEL_TOKEN`, `RENDER_API_KEY`, `MINIMAX_API_KEY`, `JWT_SECRET` |

---

## 🔑 Env vars для перехода с MVP-демо в product-ready

Бэк уже умеет работать с этими переменными — добавь их в Render Dashboard →
Environment → Add Environment Variable. Без них всё работает в "demo mode"
(SQLite, console-print SMS, no error tracking).

| Env var | Что включает | Где взять |
|---|---|---|
| `DATABASE_URL` | Postgres вместо SQLite (данные не сбрасываются) | [neon.tech](https://neon.tech) → новый проект → копируй "Pooled connection" |
| `TWILIO_ACCOUNT_SID` | Реальные SMS вместо console-print | [console.twilio.com](https://console.twilio.com) → Account Info |
| `TWILIO_AUTH_TOKEN` | то же | то же |
| `TWILIO_FROM_NUMBER` | то же | купи израильский номер в Twilio (~$1/мес) |
| `SENTRY_DSN` | Error tracking | [sentry.io](https://sentry.io) → New Project → FastAPI → копируй DSN |
| `STRIPE_SECRET_KEY` | Реальные платежи (вместо test mode) | Stripe Dashboard → API keys → "Secret key" (sk_live_) |
| `STRIPE_WEBHOOK_SECRET` | Подпись webhooks | Stripe Dashboard → Webhooks → endpoint → "Signing secret" |
| `HCAPTCHA_SECRET` | Проверка captcha на бэке (если включишь) | [hcaptcha.com](https://hcaptcha.com) → site settings → Secret key |
| `VITE_HCAPTCHA_SITE_KEY` (на Vercel) | Виджет на фронте | hCaptcha → site key |

**Порядок применения:** добавил переменные → Render автоматически передеплоит
бэк → проверь `curl /api/health`. Никаких code-changes не нужно — всё уже
env-driven.

**Rate limits активны независимо от env:**
- `/api/auth/otp/send` — 5/мин на IP + 3/час на phone (demo phones освобождены)

**Что отличается от инструкций ниже:**
- Деплой был выполнен через API Render и Vercel, не через их UI.
- Репо был сделан публичным (Render free без OAuth не может клонировать private).
- `CORS_ORIGINS` уже сужен до `https://atada.vercel.app`.
- SSO protection на Vercel выключена (иначе visitors упрутся в Vercel login).
- Один баг был починен по ходу: `pydantic-settings` пытался JSON-парсить
  `CORS_ORIGINS=*` — исправлено через `Annotated[list[str], NoDecode]` в
  `backend/app/config.py`.

**Как воссоздать с нуля** (если случится катастрофа) — следуй разделам 1-5
ниже. **Если просто хочешь починить что-то в текущем деплое** — push в `main`,
оба сервиса перезапустят билд автоматически.

### Быстрая диагностика prod

```bash
# 1. Бэк жив?
curl https://atada-api.onrender.com/api/health

# 2. Фид отдаёт seeded jobs?
curl "https://atada-api.onrender.com/api/jobs?limit=3"

# 3. Демо-OTP-peek работает?
curl -X POST https://atada-api.onrender.com/api/auth/otp/send \
  -H "Content-Type: application/json" -d '{"phone":"+972501234567"}'
curl "https://atada-api.onrender.com/api/auth/otp/peek?phone=%2B972501234567"

# 4. CORS preflight пускает фронт?
curl -i -X OPTIONS https://atada-api.onrender.com/api/auth/otp/send \
  -H "Origin: https://atada.vercel.app" \
  -H "Access-Control-Request-Method: POST"
# Должно вернуть access-control-allow-origin: https://atada.vercel.app
```

---

## 0. Перед началом

- Аккаунт на [github.com](https://github.com) (бесплатно)
- Аккаунт на [render.com](https://render.com) (бесплатно, можно войти через GitHub)
- Аккаунт на [vercel.com](https://vercel.com) (бесплатно, можно войти через GitHub)
- Локально работающий проект (проверь: `python -m uvicorn app.main:app --port 8002` в `backend/`)

---

## 1. Запушить код на GitHub

В корне проекта:

```powershell
git status            # убедиться что нет лишнего
git add .
git commit -m "Deploy-ready: demo OTP peek, auto-seed, Render+Vercel configs"
```

Создать репо на GitHub (приватный или публичный — всё равно), затем:

```powershell
git remote add origin https://github.com/<USERNAME>/atada.git
git branch -M main
git push -u origin main
```

⚠️ `backend/.env` уже в `.gitignore` — секреты НЕ попадут в репо. Если попали — поменять JWT_SECRET и MiniMax ключ.

---

## 2. Деплой бэкенда на Render

1. Зайти на https://dashboard.render.com → **New** → **Blueprint**
2. Подключить GitHub репо `atada`
3. Render увидит `render.yaml` и предложит создать сервис `atada-api`
4. Нажать **Apply** — пойдёт первый билд (5-10 минут)
5. Когда сервис поднимется, в **Environment** добавить секреты вручную:
   - `MINIMAX_API_KEY` = тот же ключ что у тебя в локальном `backend/.env`
   - `CORS_ORIGINS` = пока поставь `*` (после Vercel поменяем на конкретный домен)

После старта проверь health:

```
https://atada-api.onrender.com/api/health
```

Должно отдать `{"status":"ok","app":"Atada API"}`.

Проверь что фид работает:

```
https://atada-api.onrender.com/api/jobs?limit=3
```

Должны прийти 3 джоба — это значит auto-seed отработал.

⚠️ **Free tier спит после 15 минут неактивности.** Первый запрос после простоя
проснёт сервис за ~30 секунд. Перед демонстрацией на конференции "разогрей"
бэкенд — открой `/api/health` за минуту до показа.

---

## 3. Деплой фронта на Vercel

1. https://vercel.com/new → **Import Git Repository** → выбрать `atada`
2. Framework Preset: **Other** (или **Vite** если Vercel автоопределит)
3. Vercel прочитает `vercel.json` — команды уже там
4. В **Environment Variables** добавить:
   - `VITE_API_URL` = `https://atada-api.onrender.com/api`
5. Нажать **Deploy** — ~2 минуты

После деплоя получишь URL вида `https://atada-xxxx.vercel.app`.

---

## 4. Связать фронт и бэк (CORS)

Скопируй Vercel URL → вернись в Render → **Environment**:

- `CORS_ORIGINS` = `https://atada-xxxx.vercel.app,https://atada-xxxx-*.vercel.app`

(вторая запись с `*` нужна для preview-деплоев Vercel — каждый PR получает свой URL)

Render автоматически перезапустит бэкенд.

---

## 5. End-to-end проверка

Открой Vercel URL и пройди 5 действий:

1. ✅ Главная: видны job-карточки с картинками
2. ✅ Чёрная полоска сверху "ATADA · Live demo · Try demo" — кликается на /auth
3. ✅ На /auth кнопка **Worker demo** → один клик → должен залогинить и редиректнуть на /
4. ✅ Свайпнуть карточку — должно сохраниться в applications
5. ✅ В чате (правая панель) написать "Find me a frontend job" — должен пойти SSE ответ от MiniMax

Если что-то падает — открой DevTools → Network → найди красный запрос → проверь:
- 401 на бэке → CORS_ORIGINS не включает твой Vercel URL
- 502/504 → бэк ещё просыпается (Render free tier)
- 404 на `/api/...` → VITE_API_URL не задан в Vercel или указан без `/api`

---

## 6. Что НЕ заработает в free-демо (и это нормально)

| Фича | Состояние | Почему |
|------|-----------|--------|
| Stripe checkout | test mode | Реальные карты отвергаются, кнопка работает но не списывает |
| Загрузка аватара | не реализовано | Нужен S3/R2 — отложено до Phase 5 |
| Реальный SMS | заменено на peek | Любой может зайти как demo worker/employer без телефона |
| Постоянство данных | сбрасывается | Render free не имеет диска, auto-seed восстановит при рестарте |
| Hebrew/RTL | не переведено | UI только English |

---

## 7. Если потом захочешь свой домен

- Купить в Cloudflare/Namecheap (`atada.app`, `atada-demo.com` и т.п.)
- В Vercel → Project → Settings → Domains → добавить
- В Render → нет смысла, держи `atada-api.onrender.com` как API-домен
- Обновить `CORS_ORIGINS` на Render
- Обновить `VITE_API_URL` если меняешь бэк-домен
