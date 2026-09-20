import { describe, it, expect } from "vitest";
import {
  gradePick, summarizeWeek, summarizeSeason, currentStreak,
  longestStreak, summarizeAllTime, agreementOn,
  type ScoredGame, type ScoredPick,
} from "@/lib/scoring";

const CHRIS = 1, STEVEN = 2;

const games: ScoredGame[] = [
  { id: 10, season: 2026, week: 2, status: "final",     winnerAbbr: "CAR" },
  { id: 11, season: 2026, week: 2, status: "final",     winnerAbbr: "BAL" },
  { id: 12, season: 2026, week: 2, status: "final",     winnerAbbr: "TIE" },
  { id: 13, season: 2026, week: 2, status: "scheduled", winnerAbbr: null  },
];

describe("gradePick", () => {
  it("scores a right pick, a wrong pick, and nothing for the undecided", () => {
    expect(gradePick({ playerId: CHRIS, gameId: 10, pickedAbbr: "CAR" }, games[0])).toBe(true);
    expect(gradePick({ playerId: CHRIS, gameId: 10, pickedAbbr: "CHI" }, games[0])).toBe(false);
    expect(gradePick({ playerId: CHRIS, gameId: 13, pickedAbbr: "KC"  }, games[3])).toBeNull();
  });

  it("gives a tie to nobody", () => {
    expect(gradePick({ playerId: CHRIS,  gameId: 12, pickedAbbr: "IND" }, games[2])).toBeNull();
    expect(gradePick({ playerId: STEVEN, gameId: 12, pickedAbbr: "BAL" }, games[2])).toBeNull();
  });

  it("returns null for a pick whose game is missing", () => {
    expect(gradePick({ playerId: CHRIS, gameId: 99, pickedAbbr: "CAR" }, undefined)).toBeNull();
  });
});

describe("summarizeWeek", () => {
  const picks: ScoredPick[] = [
    { playerId: CHRIS,  gameId: 10, pickedAbbr: "CAR" }, // right
    { playerId: CHRIS,  gameId: 11, pickedAbbr: "IND" }, // wrong
    { playerId: CHRIS,  gameId: 12, pickedAbbr: "IND" }, // tie, ungraded
    { playerId: CHRIS,  gameId: 13, pickedAbbr: "KC"  }, // not played
    { playerId: STEVEN, gameId: 10, pickedAbbr: "CAR" }, // right
    { playerId: STEVEN, gameId: 11, pickedAbbr: "BAL" }, // right
  ];
  const week = summarizeWeek(2026, 2, games, picks, [CHRIS, STEVEN]);

  it("counts only decided games toward a record", () => {
    expect(week.byPlayer[CHRIS]).toMatchObject({ correct: 1, wrong: 1, picked: 4, decided: 2 });
    expect(week.byPlayer[STEVEN]).toMatchObject({ correct: 2, wrong: 0, picked: 2, decided: 2 });
  });

  it("names the player with the most correct picks", () => {
    expect(week.winners).toEqual([STEVEN]);
  });

  it("reports the slate size independently of what was picked", () => {
    expect(week.games).toBe(4);
    expect(week.finalGames).toBe(3);
  });

  it("returns both players when the week is level", () => {
    const level = summarizeWeek(2026, 2, games, [
      { playerId: CHRIS,  gameId: 10, pickedAbbr: "CAR" },
      { playerId: STEVEN, gameId: 11, pickedAbbr: "BAL" },
    ], [CHRIS, STEVEN]);
    expect(level.winners.sort()).toEqual([CHRIS, STEVEN]);
  });

  it("names no winner before anything is decided", () => {
    const early = summarizeWeek(2026, 2, [games[3]], [
      { playerId: CHRIS, gameId: 13, pickedAbbr: "KC" },
    ], [CHRIS, STEVEN]);
    expect(early.winners).toEqual([]);
  });

  it("ignores picks belonging to another week", () => {
    const other: ScoredGame[] = [...games, { id: 20, season: 2026, week: 3, status: "final", winnerAbbr: "GB" }];
    const week2 = summarizeWeek(2026, 2, other, [
      { playerId: CHRIS, gameId: 20, pickedAbbr: "GB" },
    ], [CHRIS, STEVEN]);
    expect(week2.byPlayer[CHRIS].correct).toBe(0);
  });
});

describe("summarizeSeason", () => {
  const seasonGames: ScoredGame[] = [
    { id: 1, season: 2026, week: 1, status: "final", winnerAbbr: "GB"  },
    { id: 2, season: 2026, week: 2, status: "final", winnerAbbr: "KC"  },
    { id: 3, season: 2026, week: 3, status: "final", winnerAbbr: "SF"  },
  ];
  const seasonPicks: ScoredPick[] = [
    { playerId: CHRIS,  gameId: 1, pickedAbbr: "GB"  }, // Chris wins wk1
    { playerId: STEVEN, gameId: 1, pickedAbbr: "CHI" },
    { playerId: CHRIS,  gameId: 2, pickedAbbr: "KC"  }, // level wk2
    { playerId: STEVEN, gameId: 2, pickedAbbr: "KC"  },
    { playerId: CHRIS,  gameId: 3, pickedAbbr: "SF"  }, // Chris wins wk3
    { playerId: STEVEN, gameId: 3, pickedAbbr: "LAR" },
  ];
  const season = summarizeSeason(2026, seasonGames, seasonPicks, [CHRIS, STEVEN]);

  it("totals correct picks across weeks", () => {
    const chris = season.standings.find((s) => s.playerId === CHRIS)!;
    expect(chris.correct).toBe(3);
    expect(chris.weeksWon).toBe(2);
    expect(chris.weeksTied).toBe(1);
  });

  it("counts a level week for neither player's week total", () => {
    const steven = season.standings.find((s) => s.playerId === STEVEN)!;
    expect(steven.weeksWon).toBe(0);
    expect(steven.weeksTied).toBe(1);
  });

  it("ranks the leader first", () => {
    expect(season.standings[0].playerId).toBe(CHRIS);
  });

  it("computes a percentage over decided picks only", () => {
    const steven = season.standings.find((s) => s.playerId === STEVEN)!;
    expect(steven.correct).toBe(1);
    expect(steven.pct).toBeCloseTo(1 / 3);
  });
});

describe("currentStreak", () => {
  const weeks = summarizeSeason(
    2026,
    [
      { id: 1, season: 2026, week: 1, status: "final", winnerAbbr: "GB" },
      { id: 2, season: 2026, week: 2, status: "final", winnerAbbr: "KC" },
    ],
    [
      { playerId: CHRIS,  gameId: 1, pickedAbbr: "GB"  },
      { playerId: STEVEN, gameId: 1, pickedAbbr: "CHI" },
      { playerId: CHRIS,  gameId: 2, pickedAbbr: "KC"  },
      { playerId: STEVEN, gameId: 2, pickedAbbr: "DEN" },
    ],
    [CHRIS, STEVEN],
  ).weeks;

  it("counts back consecutive weeks won", () => {
    expect(currentStreak(weeks, CHRIS)).toBe(2);
  });

  it("is zero for the player who lost the latest week", () => {
    expect(currentStreak(weeks, STEVEN)).toBe(0);
  });
});

describe("longestStreak", () => {
  const games: ScoredGame[] = [
    { id: 1, season: 2026, week: 1, status: "final", winnerAbbr: "GB"  },
    { id: 2, season: 2026, week: 2, status: "final", winnerAbbr: "KC"  },
    { id: 3, season: 2026, week: 3, status: "final", winnerAbbr: "SF"  },
    { id: 4, season: 2026, week: 4, status: "final", winnerAbbr: "BUF" },
  ];
  // Chris takes weeks 1 and 2, loses 3, takes 4. Longest run is 2, current is 1.
  const picks: ScoredPick[] = [
    { playerId: CHRIS,  gameId: 1, pickedAbbr: "GB"  },
    { playerId: STEVEN, gameId: 1, pickedAbbr: "CHI" },
    { playerId: CHRIS,  gameId: 2, pickedAbbr: "KC"  },
    { playerId: STEVEN, gameId: 2, pickedAbbr: "DEN" },
    { playerId: CHRIS,  gameId: 3, pickedAbbr: "LAR" },
    { playerId: STEVEN, gameId: 3, pickedAbbr: "SF"  },
    { playerId: CHRIS,  gameId: 4, pickedAbbr: "BUF" },
    { playerId: STEVEN, gameId: 4, pickedAbbr: "NYJ" },
  ];
  const weeks = summarizeSeason(2026, games, picks, [CHRIS, STEVEN]).weeks;

  it("finds the best run, not the current one", () => {
    expect(longestStreak(weeks, CHRIS)).toBe(2);
    expect(currentStreak(weeks, CHRIS)).toBe(1);
  });

  it("is zero for a player who never won a week", () => {
    expect(longestStreak(weeks, 99)).toBe(0);
  });
});

describe("summarizeAllTime", () => {
  const games: ScoredGame[] = [
    { id: 1, season: 2025, week: 17, status: "final", winnerAbbr: "GB" },
    { id: 2, season: 2026, week: 1,  status: "final", winnerAbbr: "KC" },
    { id: 3, season: 2026, week: 2,  status: "final", winnerAbbr: "SF" },
  ];
  // Chris wins the last week of 2025 and both weeks of 2026: a run of 3 that
  // has to survive the season boundary.
  const picks: ScoredPick[] = [
    { playerId: CHRIS,  gameId: 1, pickedAbbr: "GB"  },
    { playerId: STEVEN, gameId: 1, pickedAbbr: "CHI" },
    { playerId: CHRIS,  gameId: 2, pickedAbbr: "KC"  },
    { playerId: STEVEN, gameId: 2, pickedAbbr: "DEN" },
    { playerId: CHRIS,  gameId: 3, pickedAbbr: "SF"  },
    { playerId: STEVEN, gameId: 3, pickedAbbr: "LAR" },
  ];
  const all = summarizeAllTime(games, picks, [CHRIS, STEVEN]);

  it("spans every season", () => {
    expect(all.seasons).toEqual([2025, 2026]);
    expect(all.weeks).toHaveLength(3);
  });

  it("totals across seasons rather than per season", () => {
    const chris = all.standings.find((s) => s.playerId === CHRIS)!;
    expect(chris.correct).toBe(3);
    expect(chris.weeksWon).toBe(3);
  });

  it("carries a streak across a season boundary", () => {
    expect(all.longest[CHRIS]).toBe(3);
    expect(all.longest[STEVEN]).toBe(0);
  });

  it("orders weeks chronologically, oldest first", () => {
    expect(all.weeks.map((w) => [w.season, w.week])).toEqual([[2025, 17], [2026, 1], [2026, 2]]);
  });
});

describe("agreementOn", () => {
  const picks: ScoredPick[] = [
    { playerId: CHRIS,  gameId: 1, pickedAbbr: "GB" },
    { playerId: STEVEN, gameId: 1, pickedAbbr: "GB" },
    { playerId: CHRIS,  gameId: 2, pickedAbbr: "KC" },
    { playerId: STEVEN, gameId: 2, pickedAbbr: "DEN" },
    { playerId: CHRIS,  gameId: 3, pickedAbbr: "SF" },
  ];

  it("calls it agreed when both took the same team", () => {
    expect(agreementOn(1, picks, [CHRIS, STEVEN])).toBe("agreed");
  });

  it("calls it split when they went different ways", () => {
    expect(agreementOn(2, picks, [CHRIS, STEVEN])).toBe("split");
  });

  it("calls it incomplete until both have picked", () => {
    expect(agreementOn(3, picks, [CHRIS, STEVEN])).toBe("incomplete");
    expect(agreementOn(4, picks, [CHRIS, STEVEN])).toBe("incomplete");
  });
});
