import Link from "next/link";
import { db, type GameRow, type PickRow, type PlayerRow } from "@/lib/db";
import { summarizeSeason, currentStreak } from "@/lib/scoring";

export const dynamic = "force-dynamic";

const PLAYER_COLOR = ["var(--chris)", "var(--steven)"];

export default async function Standings(
  { searchParams }: { searchParams: Promise<{ season?: string }> },
) {
  const params = await searchParams;
  const supabase = db();

  const [{ data: players }, { data: allGames }, { data: allPicks }] = await Promise.all([
    supabase.from("players").select("*").order("sort_order"),
    supabase.from("games").select("*"),
    supabase.from("picks").select("*"),
  ]);

  const playerRows = (players ?? []) as PlayerRow[];
  const games = (allGames ?? []) as GameRow[];
  const picks = (allPicks ?? []) as PickRow[];

  const seasons = [...new Set(games.map((g) => g.season))].sort((a, b) => b - a);
  const season = Number(params.season) || seasons[0] || new Date().getFullYear();

  const summary = summarizeSeason(
    season,
    games.map((g) => ({ id: g.id, season: g.season, week: g.week, status: g.status, winnerAbbr: g.winner_abbr })),
    picks.map((p) => ({ playerId: p.player_id, gameId: p.game_id, pickedAbbr: p.picked_abbr })),
    playerRows.map((p) => p.id),
  );

  const nameOf = (id: number) => playerRows.find((p) => p.id === id)?.display_name ?? `#${id}`;
  const colorOf = (id: number) => PLAYER_COLOR[playerRows.findIndex((p) => p.id === id)] ?? "var(--text)";
  const playedWeeks = summary.weeks.filter((w) => w.winners.length > 0);

  if (games.length === 0) {
    return (
      <div className="panel rounded-2xl p-8 text-center text-[var(--muted)]">
        Nothing tracked yet. <Link href="/" className="underline">Load a week on the board</Link> to get started.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="panel rounded-2xl p-5">
        <h1 className="mb-4 text-sm uppercase tracking-wide text-[var(--muted)]">{season} season</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {summary.standings.map((s) => (
            <div key={s.playerId} className="panel-2 rounded-xl border border-[var(--line)] p-4">
              <div className="text-xs uppercase tracking-wide" style={{ color: colorOf(s.playerId) }}>
                {nameOf(s.playerId)}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums">{s.correct}</span>
                <span className="text-[var(--muted)]">
                  – {s.wrong} · {(s.pct * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-2 text-sm text-[var(--muted)]">
                {s.weeksWon} {s.weeksWon === 1 ? "week" : "weeks"} won
                {s.weeksTied > 0 && ` · ${s.weeksTied} tied`}
                {currentStreak(summary.weeks, s.playerId) > 1 &&
                  ` · ${currentStreak(summary.weeks, s.playerId)} in a row 🔥`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3 font-medium">Week</th>
              {playerRows.map((p, i) => (
                <th key={p.id} className="px-4 py-3 font-medium" style={{ color: PLAYER_COLOR[i] }}>
                  {p.display_name}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Took it</th>
            </tr>
          </thead>
          <tbody>
            {summary.weeks.map((w) => (
              <tr key={w.week} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/?season=${season}&week=${w.week}`} className="hover:underline">
                    Week {w.week}
                  </Link>
                </td>
                {playerRows.map((p) => {
                  const row = w.byPlayer[p.id];
                  const outright = w.winners.length === 1 && w.winners[0] === p.id;
                  return (
                    <td key={p.id} className="px-4 py-3 tabular-nums">
                      <span className={outright ? "font-bold" : ""}>{row?.correct ?? 0}</span>
                      <span className="text-[var(--muted)]">/{row?.decided ?? 0}</span>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-[var(--muted)]">
                  {w.winners.length === 0
                    ? "—"
                    : w.winners.length > 1
                      ? "Tied"
                      : nameOf(w.winners[0])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {playedWeeks.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          No games graded yet this season. Hit “Sync scores” on the board once games finish.
        </p>
      )}
    </div>
  );
}
