/** NFL team metadata, keyed by the abbreviation ESPN uses. */
export type Team = { abbr: string; name: string; city: string; color: string };

export const TEAMS: Record<string, Team> = {
  ARI: { abbr: "ARI", city: "Arizona",      name: "Cardinals",  color: "#97233F" },
  ATL: { abbr: "ATL", city: "Atlanta",      name: "Falcons",    color: "#A71930" },
  BAL: { abbr: "BAL", city: "Baltimore",    name: "Ravens",     color: "#241773" },
  BUF: { abbr: "BUF", city: "Buffalo",      name: "Bills",      color: "#00338D" },
  CAR: { abbr: "CAR", city: "Carolina",     name: "Panthers",   color: "#0085CA" },
  CHI: { abbr: "CHI", city: "Chicago",      name: "Bears",      color: "#0B162A" },
  CIN: { abbr: "CIN", city: "Cincinnati",   name: "Bengals",    color: "#FB4F14" },
  CLE: { abbr: "CLE", city: "Cleveland",    name: "Browns",     color: "#311D00" },
  DAL: { abbr: "DAL", city: "Dallas",       name: "Cowboys",    color: "#003594" },
  DEN: { abbr: "DEN", city: "Denver",       name: "Broncos",    color: "#FB4F14" },
  DET: { abbr: "DET", city: "Detroit",      name: "Lions",      color: "#0076B6" },
  GB:  { abbr: "GB",  city: "Green Bay",    name: "Packers",    color: "#203731" },
  HOU: { abbr: "HOU", city: "Houston",      name: "Texans",     color: "#03202F" },
  IND: { abbr: "IND", city: "Indianapolis", name: "Colts",      color: "#002C5F" },
  JAX: { abbr: "JAX", city: "Jacksonville", name: "Jaguars",    color: "#006778" },
  KC:  { abbr: "KC",  city: "Kansas City",  name: "Chiefs",     color: "#E31837" },
  LAC: { abbr: "LAC", city: "Los Angeles",  name: "Chargers",   color: "#0080C6" },
  LAR: { abbr: "LAR", city: "Los Angeles",  name: "Rams",       color: "#003594" },
  LV:  { abbr: "LV",  city: "Las Vegas",    name: "Raiders",    color: "#000000" },
  MIA: { abbr: "MIA", city: "Miami",        name: "Dolphins",   color: "#008E97" },
  MIN: { abbr: "MIN", city: "Minnesota",    name: "Vikings",    color: "#4F2683" },
  NE:  { abbr: "NE",  city: "New England",  name: "Patriots",   color: "#002244" },
  NO:  { abbr: "NO",  city: "New Orleans",  name: "Saints",     color: "#D3BC8D" },
  NYG: { abbr: "NYG", city: "New York",     name: "Giants",     color: "#0B2265" },
  NYJ: { abbr: "NYJ", city: "New York",     name: "Jets",       color: "#125740" },
  PHI: { abbr: "PHI", city: "Philadelphia", name: "Eagles",     color: "#004C54" },
  PIT: { abbr: "PIT", city: "Pittsburgh",   name: "Steelers",   color: "#FFB612" },
  SEA: { abbr: "SEA", city: "Seattle",      name: "Seahawks",   color: "#002244" },
  SF:  { abbr: "SF",  city: "San Francisco",name: "49ers",      color: "#AA0000" },
  TB:  { abbr: "TB",  city: "Tampa Bay",    name: "Buccaneers", color: "#D50A0A" },
  TEN: { abbr: "TEN", city: "Tennessee",    name: "Titans",     color: "#0C2340" },
  WSH: { abbr: "WSH", city: "Washington",   name: "Commanders", color: "#5A1414" },
};

/**
 * Abbreviations that show up on paper or in other feeds but are not the ones
 * ESPN returns. The handwritten sheet uses WAS; ESPN says WSH.
 */
const ALIASES: Record<string, string> = {
  WAS: "WSH", WFT: "WSH",
  LA: "LAR", STL: "LAR",
  SD: "LAC",
  OAK: "LV", LVR: "LV",
  JAC: "JAX",
  KAN: "KC", TAM: "TB", NOR: "NO", NWE: "NE", SFO: "SF", GNB: "GB",
};

/** Normalize any abbreviation to the ESPN one. Unknown input is returned upper-cased. */
export function normalizeAbbr(raw: string): string {
  const up = raw.trim().toUpperCase();
  return ALIASES[up] ?? up;
}

export function team(abbr: string): Team {
  const key = normalizeAbbr(abbr);
  return TEAMS[key] ?? { abbr: key, city: "", name: key, color: "#64748b" };
}
