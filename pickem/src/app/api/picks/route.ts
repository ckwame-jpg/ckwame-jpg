import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeAbbr } from "@/lib/teams";
import { checkPasscode, PASSCODE_HEADER } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Set or clear one pick. Sending pickedAbbr: null removes it, which is how you
 * undo a mis-tap rather than being stuck with it.
 */
export async function POST(req: Request) {
  if (!checkPasscode(req.headers.get(PASSCODE_HEADER))) {
    return NextResponse.json({ error: "Wrong or missing passcode." }, { status: 401 });
  }

  let body: { playerId?: number; gameId?: number; pickedAbbr?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const playerId = Number(body.playerId);
  const gameId = Number(body.gameId);
  if (!Number.isInteger(playerId) || !Number.isInteger(gameId)) {
    return NextResponse.json({ error: "playerId and gameId are required" }, { status: 400 });
  }

  const supabase = db();

  if (body.pickedAbbr === null || body.pickedAbbr === undefined) {
    const { error } = await supabase.from("picks").delete()
      .eq("player_id", playerId).eq("game_id", gameId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, cleared: true });
  }

  const pickedAbbr = normalizeAbbr(String(body.pickedAbbr));
  const { error } = await supabase.from("picks").upsert(
    { player_id: playerId, game_id: gameId, picked_abbr: pickedAbbr, updated_at: new Date().toISOString() },
    { onConflict: "player_id,game_id" },
  );
  // The database trigger rejects a team that is not in that game.
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, pickedAbbr });
}
