import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeAbbr } from "@/lib/teams";
import { checkPasscode, PASSCODE_HEADER } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Set a winner by hand, for when the feed is wrong, late, or unreachable.
 * Marking it manual pins it: later syncs leave it alone. Sending winnerAbbr
 * null hands the game back to the feed.
 */
export async function POST(req: Request) {
  if (!checkPasscode(req.headers.get(PASSCODE_HEADER))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { gameId?: number; winnerAbbr?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const gameId = Number(body.gameId);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  const supabase = db();

  if (body.winnerAbbr === null || body.winnerAbbr === undefined) {
    const { error } = await supabase.from("games")
      .update({ winner_abbr: null, winner_source: "feed", updated_at: new Date().toISOString() })
      .eq("id", gameId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, winnerAbbr: null, source: "feed" });
  }

  const winner = String(body.winnerAbbr).toUpperCase() === "TIE"
    ? "TIE"
    : normalizeAbbr(String(body.winnerAbbr));

  const { data: game, error: readErr } = await supabase
    .from("games").select("home_abbr, away_abbr").eq("id", gameId).single();
  if (readErr || !game) return NextResponse.json({ error: "no such game" }, { status: 404 });

  if (winner !== "TIE" && winner !== game.home_abbr && winner !== game.away_abbr) {
    return NextResponse.json(
      { error: `${winner} is not playing in that game` }, { status: 400 },
    );
  }

  const { error } = await supabase.from("games").update({
    winner_abbr: winner,
    winner_source: "manual",
    status: "final",
    updated_at: new Date().toISOString(),
  }).eq("id", gameId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, winnerAbbr: winner, source: "manual" });
}
