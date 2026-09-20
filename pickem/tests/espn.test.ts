import { describe, it, expect } from "vitest";
import { parseScoreboard, parseCurrentWeek } from "@/lib/espn";

/**
 * Shaped like a real ESPN scoreboard payload, trimmed to the fields the parser
 * reads. Covers a finished game, a live one, one not started, a tie, and two
 * malformed events that must be skipped rather than throw.
 */
const payload = {
  season: { year: 2026, type: 2 },
  week: { number: 2 },
  events: [
    {
      id: "401700001",
      date: "2026-09-20T17:00Z",
      season: { year: 2026, type: 2 },
      week: { number: 2 },
      competitions: [{
        status: { type: { state: "post", completed: true } },
        competitors: [
          { homeAway: "home", score: "24", winner: true,  team: { abbreviation: "CAR" } },
          { homeAway: "away", score: "17", winner: false, team: { abbreviation: "CHI" } },
        ],
      }],
    },
    {
      id: "401700002",
      date: "2026-09-20T20:05Z",
      season: { year: 2026, type: 2 },
      week: { number: 2 },
      competitions: [{
        status: { type: { state: "in", completed: false } },
        competitors: [
          { homeAway: "home", score: "10", team: { abbreviation: "WSH" } },
          { homeAway: "away", score: "14", team: { abbreviation: "PHI" } },
        ],
      }],
    },
    {
      id: "401700003",
      date: "2026-09-21T00:20Z",
      season: { year: 2026, type: 2 },
      week: { number: 2 },
      competitions: [{
        status: { type: { state: "pre", completed: false } },
        competitors: [
          { homeAway: "home", score: "0", team: { abbreviation: "KC" } },
          { homeAway: "away", score: "0", team: { abbreviation: "DEN" } },
        ],
      }],
    },
    {
      id: "401700004",
      date: "2026-09-20T17:00Z",
      season: { year: 2026, type: 2 },
      week: { number: 2 },
      competitions: [{
        status: { type: { state: "post", completed: true } },
        competitors: [
          { homeAway: "home", score: "20", team: { abbreviation: "IND" } },
          { homeAway: "away", score: "20", team: { abbreviation: "BAL" } },
        ],
      }],
    },
    { id: "401700005", date: "2026-09-20T17:00Z", competitions: [{ competitors: [] }] },
    { id: "", date: "", competitions: [] },
  ],
};

describe("parseScoreboard", () => {
  const games = parseScoreboard(payload);

  it("skips events it cannot read instead of throwing", () => {
    expect(games).toHaveLength(4);
  });

  it("reads a finished game and its winner", () => {
    const g = games.find((x) => x.espnEventId === "401700001")!;
    expect(g).toMatchObject({
      homeAbbr: "CAR", awayAbbr: "CHI",
      homeScore: 24, awayScore: 17,
      status: "final", winnerAbbr: "CAR",
      season: 2026, week: 2,
    });
  });

  it("leaves a live game undecided", () => {
    const g = games.find((x) => x.espnEventId === "401700002")!;
    expect(g.status).toBe("in_progress");
    expect(g.winnerAbbr).toBeNull();
    expect(g.awayScore).toBe(14);
  });

  it("leaves a game that has not kicked off undecided", () => {
    const g = games.find((x) => x.espnEventId === "401700003")!;
    expect(g.status).toBe("scheduled");
    expect(g.winnerAbbr).toBeNull();
  });

  it("marks an equal final score as a tie", () => {
    const g = games.find((x) => x.espnEventId === "401700004")!;
    expect(g.status).toBe("final");
    expect(g.winnerAbbr).toBe("TIE");
  });

  it("falls back to scores when no winner flag is present", () => {
    const noFlag = parseScoreboard({
      ...payload,
      events: [{
        id: "x1", date: "2026-09-20T17:00Z",
        season: { year: 2026, type: 2 }, week: { number: 2 },
        competitions: [{
          status: { type: { state: "post", completed: true } },
          competitors: [
            { homeAway: "home", score: "3",  team: { abbreviation: "NYJ" } },
            { homeAway: "away", score: "31", team: { abbreviation: "TEN" } },
          ],
        }],
      }],
    });
    expect(noFlag[0].winnerAbbr).toBe("TEN");
  });

  it("normalizes abbreviations that differ from ours", () => {
    const aliased = parseScoreboard({
      ...payload,
      events: [{
        id: "x2", date: "2026-09-20T17:00Z",
        season: { year: 2026, type: 2 }, week: { number: 2 },
        competitions: [{
          status: { type: { state: "pre" } },
          competitors: [
            { homeAway: "home", team: { abbreviation: "WAS" } },
            { homeAway: "away", team: { abbreviation: "OAK" } },
          ],
        }],
      }],
    });
    expect(aliased[0].homeAbbr).toBe("WSH");
    expect(aliased[0].awayAbbr).toBe("LV");
  });

  it("returns nothing for junk input rather than throwing", () => {
    expect(parseScoreboard(null)).toEqual([]);
    expect(parseScoreboard({})).toEqual([]);
    expect(parseScoreboard({ events: "nope" })).toEqual([]);
  });
});

describe("parseCurrentWeek", () => {
  it("reads the season and week ESPN considers live", () => {
    expect(parseCurrentWeek(payload)).toEqual({ season: 2026, seasonType: 2, week: 2 });
  });

  it("returns null when the payload does not say", () => {
    expect(parseCurrentWeek({})).toBeNull();
  });
});
