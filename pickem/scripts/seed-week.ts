/**
 * Load the handwritten sheet into the database.
 *
 * Run `npm run seed -- --season 2026 --week 2` AFTER the week's games exist
 * (hit "Sync scores" on the board, or GET /api/sync?season=…&week=…). Picks are
 * matched to games by the two team abbreviations, so no ESPN ids are needed here.
 *
 * Reading the sheet: when both picked the same team the initials are stacked
 * under it; when they split, the initials sit side by side under each team.
 * Entries marked `uncertain` are ones where the stack's side was genuinely hard
 * to read off the photo -- check those two on the board before trusting them.
 */
import { createClient } from "@supabase/supabase-js";
import { normalizeAbbr } from "../src/lib/teams";

type SheetRow = {
  away: string;
  home: string;
  chris: string;
  steven: string;
  uncertain?: boolean;
};

/** The 14 games from the photo, in the order they were written. */
const SHEET: SheetRow[] = [
  { away: "CHI", home: "CAR", chris: "CHI", steven: "CHI" },
  { away: "TB",  home: "CIN", chris: "TB",  steven: "TB"  },
  { away: "NO",  home: "DET", chris: "NO",  steven: "NO",  uncertain: true },
  { away: "BUF", home: "HOU", chris: "BUF", steven: "BUF" },
  { away: "BAL", home: "IND", chris: "BAL", steven: "IND" }, // split, clearly readable
  { away: "CLE", home: "JAX", chris: "CLE", steven: "CLE" },
  { away: "ATL", home: "PIT", chris: "PIT", steven: "ATL" }, // split, clearly readable
  { away: "NYJ", home: "TEN", chris: "TEN", steven: "TEN", uncertain: true },
  { away: "GB",  home: "MIN", chris: "MIN", steven: "MIN", uncertain: true },
  { away: "MIA", home: "LV",  chris: "LV",  steven: "MIA" }, // split, clearly readable
  { away: "WAS", home: "PHI", chris: "PHI", steven: "PHI", uncertain: true },
  { away: "ARI", home: "LAC", chris: "LAC", steven: "LAC" },
  { away: "DAL", home: "NYG", chris: "DAL", steven: "DAL" },
  { away: "DEN", home: "KC",  chris: "KC",  steven: "DEN" }, // split, clearly readable
];

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  const value = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");

  const season = arg("season", 2026);
  const week = arg("week", 2);
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: players, error: playerErr } = await supabase.from("players").select("*");
  if (playerErr) throw playerErr;
  const byCode = new Map((players ?? []).map((p) => [p.code, p.id as number]));
  const chrisId = byCode.get("CP");
  const stevenId = byCode.get("SW");
  if (!chrisId || !stevenId) throw new Error("Players CP and SW are missing from the database.");

  const { data: games, error: gameErr } = await supabase
    .from("games").select("id, home_abbr, away_abbr").eq("season", season).eq("week", week);
  if (gameErr) throw gameErr;
  if (!games?.length) {
    throw new Error(
      `No games stored for ${season} week ${week}. Sync the week first, then re-run this.`,
    );
  }

  const findGame = (away: string, home: string) =>
    games.find((g) =>
      g.away_abbr === normalizeAbbr(away) && g.home_abbr === normalizeAbbr(home)) ??
    // The sheet writes "AWAY/HOME" by habit, but fall back to the reverse in
    // case a matchup was jotted down the other way round.
    games.find((g) =>
      g.away_abbr === normalizeAbbr(home) && g.home_abbr === normalizeAbbr(away));

  const rows: { player_id: number; game_id: number; picked_abbr: string }[] = [];
  const missing: string[] = [];
  const flagged: string[] = [];

  for (const row of SHEET) {
    const game = findGame(row.away, row.home);
    if (!game) { missing.push(`${row.away}/${row.home}`); continue; }
    rows.push({ player_id: chrisId,  game_id: game.id, picked_abbr: normalizeAbbr(row.chris) });
    rows.push({ player_id: stevenId, game_id: game.id, picked_abbr: normalizeAbbr(row.steven) });
    if (row.uncertain) flagged.push(`${row.away}/${row.home} -> both ${row.chris}`);
  }

  const { error } = await supabase.from("picks").upsert(rows, { onConflict: "player_id,game_id" });
  if (error) throw error;

  console.log(`Seeded ${rows.length} picks across ${rows.length / 2} games for ${season} week ${week}.`);
  if (missing.length) console.log(`Not found in the schedule: ${missing.join(", ")}`);
  if (flagged.length) {
    console.log("\nWorth a second look -- the stacked initials were hard to place:");
    for (const f of flagged) console.log(`  ${f}`);
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
