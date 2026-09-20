# Pick'em — Chris vs Steven

Two-person NFL pick'em tracker. One point per correct pick, straight-up winners,
exactly like the paper sheet it replaces. Chris enters both columns; the schedule
and final scores come from ESPN, and anything the feed gets wrong can be set by hand.

## Stack

`Next.js 15` `React 19` `TypeScript` `Tailwind` `Supabase Postgres` `Vitest`

## How scoring works

- One point per correct pick. Most correct takes the week.
- A tie scores for neither player.
- A week that ends level counts as won by nobody, and breaks a win streak
  without starting a new one.
- Percentages are computed over decided picks only, so an unplayed game never
  drags a record down.

All of it lives in `src/lib/scoring.ts` as pure functions over plain rows, which
is why the rules are testable without a database.

## Running it

```bash
npm install
cp .env.example .env.local   # fill in the service-role key
npm run dev
```

| Variable | Required | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | one of the two | Server-only. Bypasses RLS entirely. Preferred when set. |
| `SUPABASE_PUBLISHABLE_KEY` | one of the two | Server-only fallback. Maps to `anon`, which has RLS policies granting board access. |
| `PICKEM_PASSCODE` | no | When set, editing picks or results needs this passcode. Unset leaves the board open. |
| `CRON_SECRET` | no | Lets the scheduled sync authenticate itself. Vercel sends it automatically once the variable exists. |

## Deployment

Vercel project `nfl-pickem`, linked to this repository with the root directory set
to `pickem/`. Production tracks `main`; pushes to other branches get preview builds.

Deployment protection is **off**, so the URL is publicly reachable — that is what
lets Steven open it without a Vercel account. `PICKEM_PASSCODE` is therefore set in
production: anyone can read the board, only someone with the passcode can change a
pick or a result. Turning protection back on would make the passcode redundant, and
dropping the passcode while the URL is public would leave the board world-editable.

All four environment variables are configured in Vercel. The database key is
`SUPABASE_PUBLISHABLE_KEY`, which maps to the `anon` role and carries explicit
RLS policies, rather than the service-role key — that choice trades some
security for needing no secret pasted by hand. Anyone holding the publishable
key could edit pick data directly, bypassing the passcode. To tighten it, set
`SUPABASE_SERVICE_ROLE_KEY` (the app prefers it whenever present) and drop the
`board_access` policies.

## Getting a week onto the board

1. Open the board and press **Sync scores** (or `GET /api/sync?season=2026&week=2`).
   That pulls the slate from ESPN and upserts it.
2. Tap a team under each name to record picks. Tapping the same team again clears it.
3. After games finish, press **Sync scores** again to grade them. A daily Vercel
   cron does the same at 09:00 UTC.

### Loading the handwritten sheet

`scripts/seed-week.ts` holds the 14 games from the original photo. Run it once the
week's games exist:

```bash
npm run seed -- --season 2026 --week 2
```

It matches picks to games by team abbreviation and prints the entries that were
hard to read off the photo so they can be checked on the board.

## When the feed is wrong

Every game has a **Set result by hand** control. A hand-set winner is pinned with
`winner_source='manual'` and later syncs leave it alone, so a correction is never
silently undone. Clearing it hands the game back to the feed.

## Tests

```bash
npm test        # 25 tests, no network and no database
npm run build
```

The ESPN parser is covered against a fixture shaped like a real scoreboard
payload — finished, live, unplayed, and tied games, plus malformed events that
must be skipped rather than throw. Scoring is covered for ties, undecided games,
level weeks and streaks.

## Data model

| Table | Holds |
| --- | --- |
| `players` | The two pickers. No auth rows: one operator enters both columns. |
| `games` | One row per game, keyed by ESPN event id. Carries the winner and whether it came from the feed or a person. |
| `picks` | One row per player per game, unique on the pair. A database trigger rejects a team that is not playing in that game. |
| `pick_results` | View joining the two and grading each pick. |
