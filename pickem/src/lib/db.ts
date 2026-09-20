import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 *
 * Everything in this app talks to the database from a server component or a
 * route handler, so neither key ever reaches the browser.
 */
let cached: SupabaseClient | null = null;

/**
 * The key this server uses to reach Postgres.
 *
 * The service-role key is preferred and bypasses RLS entirely. Falling back to
 * the publishable key is what lets the board run without anyone pasting a
 * secret; that key maps to the `anon` role, which carries explicit RLS
 * policies. Either way the key stays on the server -- note the deliberate
 * absence of a NEXT_PUBLIC_ prefix -- and writes are gated by PICKEM_PASSCODE.
 */
function serverKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
}

/** Whether the server has what it needs to reach the database. */
export function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && serverKey());
}

export function db(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = serverKey();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY or " +
        "SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in.",
    );
  }

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export type PlayerRow = { id: number; code: string; display_name: string; sort_order: number };

export type GameRow = {
  id: number;
  espn_event_id: string | null;
  season: number;
  season_type: number;
  week: number;
  kickoff_at: string;
  home_abbr: string;
  away_abbr: string;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "in_progress" | "final";
  winner_abbr: string | null;
  winner_source: "feed" | "manual";
};

export type PickRow = {
  id: number;
  player_id: number;
  game_id: number;
  picked_abbr: string;
};
