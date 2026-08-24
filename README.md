# Christopher Prempeh

**Backend and systems engineering. Python, C++, Java.**

Computer Science graduate building production-style APIs, and algorithmic and concurrent systems, with tests and CI on every project. By day I keep broadcast-critical Linux infrastructure online for live MLS matches and the FIFA World Cup 2026, which is where I learned that the interesting part of a system is what happens when it breaks at the worst possible moment.

📍 Dallas-Fort Worth, TX · 🌐 [chrisprem.xyz](https://chrisprem.xyz) · 💼 [LinkedIn](https://linkedin.com/in/christopher-prempeh) · ✉️ ckprempeh@outlook.com

---

## What I'm building

### [lineup-optimizer](https://github.com/ckwame-jpg/lineup-optimizer)
Exact salary-cap roster optimizer for daily fantasy. A 0/1 knapsack per position convolved over the salary axis, with legal roster shapes precomputed by bipartite matching, which is what makes overlapping FLEX slots need no special case at all.

`C++17` `CMake` `GoogleTest`
The first version was branch and bound: 16.8 billion nodes and 183 seconds on a 300-player pool. The DP returns the same answers in **3.8 ms**, a 48,000x speedup, verified against a brute-force oracle over every legal 9-player subset.

### [season-sim](https://github.com/ckwame-jpg/season-sim)
Monte Carlo fantasy season simulator that is bit-for-bit reproducible no matter how many threads it runs on. Three separate things break that guarantee: shared random state, floating-point accumulation order, and partitioning that follows the thread count. The last one was a real bug, caught by the test suite.

`Java 17` `Maven` `JUnit 5`
4.3M simulated seasons/sec at 5.1x scaling on 8 threads. Tests assert cross-thread determinism to exactly `0.0`, not "close enough".

### [Fantasy Football Toolkit](https://github.com/ckwame-jpg/fantasy-tool) · [live demo](https://fantasy-tool.vercel.app)
A full fantasy football platform, not a toy. Mock draftboard with ADP tiers, VORP-based trade analyzer, waiver-wire rankings, weekly lineup optimizer, matchups, projections and league sync, for 15 feature areas in total.

`Next.js 15` `React 19` `TypeScript` `FastAPI` `Tailwind`
Roughly 12,400 lines of TypeScript over a FastAPI backend exposing 31 endpoints, with dedicated Sleeper and ESPN integrations.

### [Taskboard](https://github.com/ckwame-jpg/taskboard) · [live demo](https://taskboard-jade-nine.vercel.app)
Real-time collaborative task board. Card moves propagate to every connected client instantly over a WebSocket channel, on top of 17 REST endpoints and role-based permissions for owner, editor and viewer.

`FastAPI` `Next.js` `PostgreSQL` `WebSockets` `Docker`
Three-service Docker Compose stack, 16 pytest tests, CI covering both the frontend build and the backend suite.

### [URL Shortener with Async Analytics](https://github.com/ckwame-jpg/url-shortener)
Redirects stay fast because the analytics never block them. Click data is handed to Celery workers that parse device type, referrer and IP out of band.

`FastAPI` `Celery` `Redis` `PostgreSQL` `Docker`
Four-service stack (API, worker, PostgreSQL, Redis), JWT auth across 7 endpoints, 16 tests in CI.

### [Habitual-Habits](https://github.com/ckwame-jpg/Habitual-Habits)
Habit-tracking REST API with bcrypt-hashed credentials, JWT authentication and streak computation.

`FastAPI` `SQLAlchemy` `pytest` `Docker`
10 endpoints, 16 tests, ruff-linted, enforced by GitHub Actions on every push.

---

## Stack

**Languages** Python · TypeScript · JavaScript · SQL · Java · C++
**Backend** FastAPI · SQLAlchemy · Celery · PostgreSQL · Redis · REST · WebSockets · JWT
**Frontend** Next.js · React · Tailwind CSS
**Infra** Docker · Docker Compose · GitHub Actions · Linux · CMake · Maven · pytest · GoogleTest · JUnit 5 · Vercel

---

## Currently

Looking for backend, full-stack, and platform engineering roles.

Everything above runs its test suite in GitHub Actions on every push, and everything runs standalone. Clone any of the Python services and `make test` puts 16 tests green with no database and no environment setup, because the fixtures use in-memory SQLite and mock the external services. `lineup-optimizer` needs only CMake and a C++17 compiler; `season-sim` needs only a JDK.
