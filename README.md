# Christopher Prempeh

**Backend engineering — Python, FastAPI, PostgreSQL, Redis, Docker.**

Computer Science graduate building production-style APIs with tests and CI on every project. By day I keep broadcast-critical Linux infrastructure online for live MLS matches and the FIFA World Cup 2026 — which is where I learned that the interesting part of a system is what happens when it breaks at the worst possible moment.

📍 Dallas–Fort Worth, TX · 🌐 [chrisprem.xyz](https://chrisprem.xyz) · 💼 [LinkedIn](https://linkedin.com/in/christopher-prempeh) · ✉️ ckprempeh@outlook.com

---

## What I'm building

### [Fantasy Football Toolkit](https://github.com/ckwame-jpg/fantasy-tool) · [live →](https://fantasy-tool.vercel.app)
A full fantasy football platform, not a toy. Mock draftboard with ADP tiers, VORP-based trade analyzer, waiver-wire rankings, weekly lineup optimizer, matchups, projections and league sync — 15 feature areas in total.

`Next.js 15` `React 19` `TypeScript` `FastAPI` `Tailwind`
→ ~12,400 lines of TypeScript over a FastAPI backend exposing 31 endpoints, with dedicated Sleeper and ESPN integrations.

### [Taskboard](https://github.com/ckwame-jpg/taskboard) · [live →](https://taskboard-jade-nine.vercel.app)
Real-time collaborative task board. Card moves propagate to every connected client instantly over a WebSocket channel, on top of 17 REST endpoints and role-based permissions for owner, editor and viewer.

`FastAPI` `Next.js` `PostgreSQL` `WebSockets` `Docker`
→ Three-service Docker Compose stack, 16 pytest tests, CI covering both the frontend build and the backend suite.

### [URL Shortener with Async Analytics](https://github.com/ckwame-jpg/url-shortener)
Redirects stay fast because the analytics never block them — click data is handed to Celery workers that parse device type, referrer and IP out of band.

`FastAPI` `Celery` `Redis` `PostgreSQL` `Docker`
→ Four-service stack (API, worker, PostgreSQL, Redis), JWT auth across 7 endpoints, 16 tests in CI.

### [Habitual-Habits](https://github.com/ckwame-jpg/Habitual-Habits)
Habit-tracking REST API with bcrypt-hashed credentials, JWT authentication and streak computation.

`FastAPI` `SQLAlchemy` `pytest` `Docker`
→ 10 endpoints, 16 tests, ruff-linted, enforced by GitHub Actions on every push.

---

## Stack

**Languages** Python · TypeScript · JavaScript · SQL · Java · C++
**Backend** FastAPI · SQLAlchemy · Celery · PostgreSQL · Redis · REST · WebSockets · JWT
**Frontend** Next.js · React · Tailwind CSS
**Infra** Docker · Docker Compose · GitHub Actions · Linux · pytest · Vercel · AWS S3

---

## Currently

Looking for backend, full-stack, and platform engineering roles.

The three Python services above run their suites in GitHub Actions on every push. They also run standalone — clone one, `pip install -r requirements.txt`, `make test`, and 16 tests go green without a database, a Redis instance, or any environment setup, because the fixtures use in-memory SQLite and mock the external services.
