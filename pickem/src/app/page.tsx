import { db, isConfigured, type GameRow, type PickRow, type PlayerRow } from "@/lib/db";
import { summarizeWeek, summarizeSeason } from "@/lib/scoring";
import Board from "@/components/Board";
import WeekPicker from "@/components/WeekPicker";
import NotConfigured from "@/components/NotConfigured";

export const dynamic = "force-dynamic";

/** The week to show when the URL does not say: whichever slate is nearest to now. */
function defaultWeek(games: Pick<GameRow, "season" | "week" | "kickoff_at">[]) {
  if (games.length === 0) return null;
  const now = Date.now();
  let best = games[0];
  let bestGap = Math.abs(new Date(best.kickoff_at).getTime() - now);
  for (const g of games) {
    const gap = Math.abs(new Date(g.kickoff_at).getTime() - now);
    if (gap < bestGap) { best = g; bestGap = gap; }
  }
  return { season: best.season, week: best.week };
}

export default async function Home(
  { searchParams }: { searchParams: Promise<{ season?: string; week?: string }> },
) {
  if (!isConfigured()) return <NotConfigured />;

  const params = await searchParams;
  const supabase = db();

  const [{ data: players }, { data: allGames }] = await Promise.all([
    supabase.from("players").select("*").order("sort_order"),
    supabase.from("games").select("*").order("kickoff_at"),
  ]);

  const playerRows = (players ?? []) as PlayerRow[];
  const games = (allGames ?? []) as GameRow[];

  const fallback = defaultWeek(games);
  const season = Number(params.season) || fallback?.season || new Date().getFullYear();
  const week = Number(params.week) || fallback?.week || 1;

  const weekGames = games.filter((g) => g.season === season && g.week === week);
  const gameIds = weekGames.map((g) => g.id);

  const { data: allPickRows } = await supabase.from("picks").select("*");
  const allPicks = (allPickRows ?? []) as PickRow[];
  const gameIdSet = new Set(gameIds);
  const picks = allPicks.filter((p) => gameIdSet.has(p.game_id));

  const scoredGames = games.map((g) => ({
    id: g.id, season: g.season, week: g.week, status: g.status, winnerAbbr: g.winner_abbr,
  }));
  const scoredPicks = allPicks.map((p) => ({
    playerId: p.player_id, gameId: p.game_id, pickedAbbr: p.picked_abbr,
  }));

  const seasonSummary = summarizeSeason(season, scoredGames, scoredPicks, playerRows.map((p) => p.id));

  const summary = summarizeWeek(
    season, week,
    weekGames.map((g) => ({ id: g.id, season: g.season, week: g.week, status: g.status, winnerAbbr: g.winner_abbr })),
    picks.map((p) => ({ playerId: p.player_id, gameId: p.game_id, pickedAbbr: p.picked_abbr })),
    playerRows.map((p) => p.id),
  );

  const weeksAvailable = [...new Set(games.filter((g) => g.season === season).map((g) => g.week))]
    .sort((a, b) => a - b);
  const seasonsAvailable = [...new Set(games.map((g) => g.season))].sort((a, b) => b - a);

  return (
    <div className="space-y-5">
      <WeekPicker
        season={season}
        week={week}
        seasons={seasonsAvailable.length ? seasonsAvailable : [season]}
        weeks={weeksAvailable.length ? weeksAvailable : [week]}
      />
      <Board
        players={playerRows}
        games={weekGames}
        picks={picks}
        summary={summary}
        seasonStandings={seasonSummary.standings}
        season={season}
        week={week}
      />
    </div>
  );
}
