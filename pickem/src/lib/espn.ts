import { normalizeAbbr } from "./teams";

export type GameStatus = "scheduled" | "in_progress" | "final";

export type ParsedGame = {
  espnEventId: string;
  season: number;
  seasonType: number;
  week: number;
  kickoffAt: string;
  homeAbbr: string;
  awayAbbr: string;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  /** null while undecided, "TIE" for a tie, otherwise the winning abbreviation. */
  winnerAbbr: string | null;
};

const SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

function toStatus(state: unknown, completed: unknown): GameStatus {
  if (completed === true) return "final";
  if (state === "post") return "final";
  if (state === "in") return "in_progress";
  return "scheduled";
}

function toScore(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Turn one ESPN scoreboard payload into our game rows.
 *
 * Written defensively on purpose: anything missing a usable event id, both
 * competitors or a kickoff time is skipped rather than throwing, so one odd
 * event can never take down a whole sync.
 */
export function parseScoreboard(payload: unknown): ParsedGame[] {
  const root = payload as Record<string, any> | null;
  const events: any[] = Array.isArray(root?.events) ? root!.events : [];
  const games: ParsedGame[] = [];

  for (const event of events) {
    const comp = Array.isArray(event?.competitions) ? event.competitions[0] : null;
    const competitors: any[] = Array.isArray(comp?.competitors) ? comp.competitors : [];
    if (!comp || competitors.length < 2) continue;

    const home = competitors.find((c) => c?.homeAway === "home") ?? competitors[0];
    const away = competitors.find((c) => c?.homeAway === "away") ?? competitors[1];
    const homeAbbr = normalizeAbbr(String(home?.team?.abbreviation ?? ""));
    const awayAbbr = normalizeAbbr(String(away?.team?.abbreviation ?? ""));
    if (!homeAbbr || !awayAbbr || homeAbbr === awayAbbr) continue;

    const espnEventId = String(event?.id ?? comp?.id ?? "");
    const kickoffRaw = event?.date ?? comp?.date;
    if (!espnEventId || !kickoffRaw) continue;
    const kickoff = new Date(String(kickoffRaw));
    if (Number.isNaN(kickoff.getTime())) continue;

    const statusNode = comp?.status ?? event?.status;
    const status = toStatus(statusNode?.type?.state, statusNode?.type?.completed);
    const homeScore = toScore(home?.score);
    const awayScore = toScore(away?.score);

    let winnerAbbr: string | null = null;
    if (status === "final") {
      // Trust ESPN's explicit winner flag first; fall back to the scores.
      if (home?.winner === true) winnerAbbr = homeAbbr;
      else if (away?.winner === true) winnerAbbr = awayAbbr;
      else if (homeScore !== null && awayScore !== null) {
        if (homeScore > awayScore) winnerAbbr = homeAbbr;
        else if (awayScore > homeScore) winnerAbbr = awayAbbr;
        else winnerAbbr = "TIE";
      }
    }

    games.push({
      espnEventId,
      season: Number(event?.season?.year ?? root?.season?.year ?? kickoff.getUTCFullYear()),
      seasonType: Number(event?.season?.type ?? root?.season?.type ?? 2),
      week: Number(event?.week?.number ?? root?.week?.number ?? 0),
      kickoffAt: kickoff.toISOString(),
      homeAbbr,
      awayAbbr,
      homeScore,
      awayScore,
      status,
      winnerAbbr,
    });
  }

  return games;
}

/** Which season/week ESPN currently considers live. */
export function parseCurrentWeek(payload: unknown): { season: number; seasonType: number; week: number } | null {
  const root = payload as Record<string, any> | null;
  const season = Number(root?.season?.year);
  const week = Number(root?.week?.number);
  if (!Number.isFinite(season) || !Number.isFinite(week)) return null;
  return { season, seasonType: Number(root?.season?.type ?? 2), week };
}

export async function fetchScoreboard(params?: {
  season?: number; week?: number; seasonType?: number;
}): Promise<unknown> {
  const url = new URL(SCOREBOARD);
  if (params?.week) {
    url.searchParams.set("week", String(params.week));
    url.searchParams.set("seasontype", String(params.seasonType ?? 2));
    if (params.season) url.searchParams.set("dates", String(params.season));
  }
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`ESPN scoreboard returned ${res.status}`);
  return res.json();
}
