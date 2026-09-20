/**
 * Scoring is one point per correct pick.
 *
 * Every function here is pure and takes plain rows, so the rules can be tested
 * without a database or a network call.
 */

export type ScoredGame = {
  id: number;
  season: number;
  week: number;
  status: "scheduled" | "in_progress" | "final";
  winnerAbbr: string | null;
};

export type ScoredPick = {
  playerId: number;
  gameId: number;
  pickedAbbr: string;
};

/** true = right, false = wrong, null = not decided yet (or a tie, which scores for nobody). */
export function gradePick(pick: ScoredPick, game: ScoredGame | undefined): boolean | null {
  if (!game || game.winnerAbbr === null || game.winnerAbbr === "TIE") return null;
  return pick.pickedAbbr === game.winnerAbbr;
}

export type PlayerWeek = {
  playerId: number;
  correct: number;
  wrong: number;
  /** Games this player actually made a pick on. */
  picked: number;
  /** Of those, how many have a decided result. */
  decided: number;
};

export type WeekSummary = {
  week: number;
  season: number;
  /** Total games on the slate, whether picked or not. */
  games: number;
  finalGames: number;
  byPlayer: Record<number, PlayerWeek>;
  /**
   * Player ids with the most correct picks. Empty until at least one game is
   * decided; more than one id means the week is tied.
   */
  winners: number[];
};

export function summarizeWeek(
  season: number,
  week: number,
  games: ScoredGame[],
  picks: ScoredPick[],
  playerIds: number[],
): WeekSummary {
  const weekGames = games.filter((g) => g.season === season && g.week === week);
  const gameById = new Map(weekGames.map((g) => [g.id, g]));

  const byPlayer: Record<number, PlayerWeek> = {};
  for (const id of playerIds) {
    byPlayer[id] = { playerId: id, correct: 0, wrong: 0, picked: 0, decided: 0 };
  }

  for (const pick of picks) {
    const game = gameById.get(pick.gameId);
    if (!game) continue;
    const row = byPlayer[pick.playerId];
    if (!row) continue;
    row.picked += 1;
    const graded = gradePick(pick, game);
    if (graded === null) continue;
    row.decided += 1;
    if (graded) row.correct += 1;
    else row.wrong += 1;
  }

  const anyDecided = Object.values(byPlayer).some((p) => p.decided > 0);
  let winners: number[] = [];
  if (anyDecided) {
    const best = Math.max(...Object.values(byPlayer).map((p) => p.correct));
    winners = Object.values(byPlayer).filter((p) => p.correct === best).map((p) => p.playerId);
  }

  return {
    season,
    week,
    games: weekGames.length,
    finalGames: weekGames.filter((g) => g.status === "final").length,
    byPlayer,
    winners,
  };
}

export type SeasonStanding = {
  playerId: number;
  correct: number;
  wrong: number;
  /** Weeks this player won outright. A tied week counts for nobody. */
  weeksWon: number;
  /** Weeks that ended level. */
  weeksTied: number;
  pct: number;
};

export type SeasonSummary = {
  season: number;
  weeks: WeekSummary[];
  standings: SeasonStanding[];
};

export function summarizeSeason(
  season: number,
  games: ScoredGame[],
  picks: ScoredPick[],
  playerIds: number[],
): SeasonSummary {
  const weekNumbers = [...new Set(games.filter((g) => g.season === season).map((g) => g.week))]
    .sort((a, b) => a - b);

  const weeks = weekNumbers.map((w) => summarizeWeek(season, w, games, picks, playerIds));

  const standings: SeasonStanding[] = playerIds.map((id) => {
    let correct = 0, wrong = 0, weeksWon = 0, weeksTied = 0;
    for (const week of weeks) {
      const row = week.byPlayer[id];
      if (row) { correct += row.correct; wrong += row.wrong; }
      if (week.winners.length === 1 && week.winners[0] === id) weeksWon += 1;
      else if (week.winners.length > 1 && week.winners.includes(id)) weeksTied += 1;
    }
    const decided = correct + wrong;
    return { playerId: id, correct, wrong, weeksWon, weeksTied, pct: decided ? correct / decided : 0 };
  });

  standings.sort((a, b) => b.correct - a.correct || b.weeksWon - a.weeksWon);
  return { season, weeks, standings };
}

/**
 * Current run of weeks won, counting back from the most recent decided week.
 * A tied week stops the streak without starting a new one.
 */
export function currentStreak(weeks: WeekSummary[], playerId: number): number {
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w.winners.length === 0) continue;
    if (w.winners.length === 1 && w.winners[0] === playerId) streak += 1;
    else break;
  }
  return streak;
}
