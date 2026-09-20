"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GameRow, PickRow, PlayerRow } from "@/lib/db";
import type { WeekSummary } from "@/lib/scoring";
import { team } from "@/lib/teams";
import { post } from "@/lib/client-passcode";

const PLAYER_COLOR = ["var(--chris)", "var(--steven)"];

function kickoffLabel(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", hour: "numeric", minute: "2-digit",
  });
}

export default function Board(
  { players, games, picks, summary, season, week }:
  { players: PlayerRow[]; games: GameRow[]; picks: PickRow[];
    summary: WeekSummary; season: number; week: number },
) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local mirror so a tap lands immediately instead of waiting on the round trip.
  const [local, setLocal] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(picks.map((p) => [`${p.player_id}:${p.game_id}`, p.picked_abbr])),
  );

  const pickOf = (playerId: number, gameId: number) => local[`${playerId}:${gameId}`] ?? null;

  async function setPick(playerId: number, gameId: number, abbr: string) {
    const key = `${playerId}:${gameId}`;
    const nextValue = local[key] === abbr ? null : abbr; // tapping the same team clears it
    const previous = local[key] ?? null;
    setLocal((s) => ({ ...s, [key]: nextValue }));
    setError(null);

    const res = await post("/api/picks", { playerId, gameId, pickedAbbr: nextValue });
    if (!res.ok) {
      setLocal((s) => ({ ...s, [key]: previous }));
      setError((await res.json().catch(() => ({}))).error ?? "Could not save that pick.");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function setWinner(gameId: number, abbr: string | null) {
    setError(null);
    const res = await post("/api/result", { gameId, winnerAbbr: abbr });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not set that result.");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function syncWeek() {
    setBusy(true);
    setError(null);
    const res = await post("/api/sync", { season, week });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(body.error ?? "Sync failed. You can still set results by hand.");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="panel rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            {players.map((p, i) => {
              const row = summary.byPlayer[p.id];
              const won = summary.winners.length === 1 && summary.winners[0] === p.id;
              return (
                <div key={p.id}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: PLAYER_COLOR[i] }}>
                    {p.display_name}{won && " 👑"}
                  </div>
                  <div className="text-3xl font-bold tabular-nums">{row?.correct ?? 0}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {row?.decided ?? 0} graded · {row?.picked ?? 0} picked
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={syncWeek}
            disabled={busy}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3.5 py-2 text-sm font-medium hover:border-[var(--chris)] disabled:opacity-50"
          >
            {busy ? "Syncing…" : "Sync scores"}
          </button>
        </div>
        {summary.winners.length > 1 && summary.finalGames > 0 && (
          <div className="mt-3 text-sm text-[var(--muted)]">Dead even this week.</div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--loss)] bg-[var(--loss)]/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {games.length === 0 ? (
        <div className="panel rounded-2xl p-8 text-center">
          <p className="text-[var(--muted)]">No games loaded for week {week}.</p>
          <button
            onClick={syncWeek}
            disabled={busy}
            className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-4 py-2 text-sm font-medium hover:border-[var(--chris)] disabled:opacity-50"
          >
            {busy ? "Loading…" : "Load this week from ESPN"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((g) => {
            const decided = g.winner_abbr !== null;
            const sides = [g.away_abbr, g.home_abbr];
            return (
              <div key={g.id} className="panel rounded-2xl p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    {team(g.away_abbr).abbr}
                    <span className="mx-1.5 text-[var(--muted)]">@</span>
                    {team(g.home_abbr).abbr}
                  </div>
                  <div className="text-right text-xs text-[var(--muted)]">
                    {g.status === "final" ? (
                      <span>
                        Final {g.away_score}–{g.home_score}
                        {g.winner_source === "manual" && " · set by hand"}
                      </span>
                    ) : g.status === "in_progress" ? (
                      <span className="text-[var(--win)]">Live {g.away_score}–{g.home_score}</span>
                    ) : (
                      kickoffLabel(g.kickoff_at)
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {players.map((p, i) => {
                    const picked = pickOf(p.id, g.id);
                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        <div
                          className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide"
                          style={{ color: PLAYER_COLOR[i] }}
                        >
                          {p.display_name}
                        </div>
                        <div className="grid flex-1 grid-cols-2 gap-2">
                          {sides.map((abbr) => {
                            const isPicked = picked === abbr;
                            const right = decided && isPicked && g.winner_abbr === abbr;
                            const wrong = decided && isPicked && g.winner_abbr !== abbr;
                            return (
                              <button
                                key={abbr}
                                onClick={() => setPick(p.id, g.id, abbr)}
                                className="rounded-xl border px-3 py-2 text-sm font-medium transition"
                                style={{
                                  borderColor: isPicked ? PLAYER_COLOR[i] : "var(--line)",
                                  background: isPicked ? `${PLAYER_COLOR[i]}1a` : "transparent",
                                }}
                              >
                                <span>{team(abbr).abbr}</span>
                                {right && <span className="ml-2 text-[var(--win)]">✓</span>}
                                {wrong && <span className="ml-2 text-[var(--loss)]">✗</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--text)]">
                    Set result by hand
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[...sides, "TIE"].map((abbr) => (
                      <button
                        key={abbr}
                        onClick={() => setWinner(g.id, abbr)}
                        className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs hover:border-[var(--win)]"
                      >
                        {abbr === "TIE" ? "Tie" : `${team(abbr).abbr} won`}
                      </button>
                    ))}
                    <button
                      onClick={() => setWinner(g.id, null)}
                      className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--muted)] hover:border-[var(--loss)]"
                    >
                      Clear
                    </button>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
