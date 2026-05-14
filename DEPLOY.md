# ATADA — Деплой демо (бесплатно)

Бэк → **Render free**, фронт → **Vercel free**, БД → SQLite (auto-seed на каждом
старте, поэтому persistent disk не нужен). Docker не используется.

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
