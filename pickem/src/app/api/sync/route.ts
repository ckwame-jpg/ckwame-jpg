import { NextResponse } from "next/server";
import { db, type GameRow } from "@/lib/db";
import { fetchScoreboard, parseScoreboard, parseCurrentWeek } from "@/lib/espn";
import { checkPasscode, PASSCODE_HEADER } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SyncTarget = { season?: number; week?: number; seasonType?: number };

/**
 * Pull a week's schedule and scores from ESPN into our games table.
 *
 * A result that was set by hand is never overwritten: rows carrying
 * winner_source='manual' keep their winner even if the feed disagrees.
 */
async function sync(target: SyncTarget) {
  const payload = await fetchScoreboard(target);
  const parsed = parseScoreboard(payload);
  const current = parseCurrentWeek(payload);

  if (parsed.length === 0) {
    return { synced: 0, current, note: "ESPN returned no usable events for that week." };
  }

  const supabase = db();
  const eventIds = parsed.map((g) => g.espnEventId);

  const { data: existing, error: readErr } = await supabase
    .from("games")
    .select("espn_event_id, winner_abbr, winner_source")
    .in("espn_event_id", eventIds);
  if (readErr) throw new Error(`reading existing games: ${readErr.message}`);

  const manual = new Map(
    (existing ?? [])
      .filter((g) => g.winner_source === "manual")
      .map((g) => [g.espn_event_id as string, g.winner_abbr as string | null]),
  );

  const rows = parsed.map((g) => {
    const isManual = manual.has(g.espnEventId);
    return {
      espn_event_id: g.espnEventId,
      season: g.season,
      season_type: g.seasonType,
      week: g.week,
      kickoff_at: g.kickoffAt,
      home_abbr: g.homeAbbr,
      away_abbr: g.awayAbbr,
      home_score: g.homeScore,
      away_score: g.awayScore,
      status: g.status,
      winner_abbr: isManual ? manual.get(g.espnEventId)! : g.winnerAbbr,
      winner_source: isManual ? "manual" : "feed",
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from("games").upsert(rows, { onConflict: "espn_event_id" });
  if (error) throw new Error(`upserting games: ${error.message}`);

  return { synced: rows.length, current, keptManual: manual.size };
}

function authorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  return checkPasscode(req.headers.get(PASSCODE_HEADER));
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Wrong or missing passcode." }, { status: 401 });
  const url = new URL(req.url);
  const season = url.searchParams.get("season");
  const week = url.searchParams.get("week");
  try {
    const result = await sync({
      season: season ? Number(season) : undefined,
      week: week ? Number(week) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Wrong or missing passcode." }, { status: 401 });
  let body: SyncTarget = {};
  try { body = await req.json(); } catch { /* empty body means "current week" */ }
  try {
    return NextResponse.json(await sync(body));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
