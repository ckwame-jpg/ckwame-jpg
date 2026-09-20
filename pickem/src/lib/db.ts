import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 *
 * RLS is enabled on every table with no policies, so the service-role key is
 * what makes any read or write possible. It must never reach the browser:
 * everything in this app talks to the database from a server component or a
 * route handler.
 */
let cached: SupabaseClient | null = null;

/** Whether the server has what it needs to reach the database. */
export function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function db(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Copy .env.example to .env.local and fill them in.",
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
