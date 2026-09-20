"use client";

import { useRouter } from "next/navigation";

export default function WeekPicker(
  { season, week, seasons, weeks }:
  { season: number; week: number; seasons: number[]; weeks: number[] },
) {
  const router = useRouter();
  const go = (s: number, w: number) => router.push(`/?season=${s}&week=${w}`);

  const idx = weeks.indexOf(week);
  const prev = idx > 0 ? weeks[idx - 1] : null;
  const next = idx >= 0 && idx < weeks.length - 1 ? weeks[idx + 1] : null;

  return (
    <div className="panel flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5">
      <button
        onClick={() => prev && go(season, prev)}
        disabled={!prev}
        className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] enabled:hover:bg-[var(--panel-2)] enabled:hover:text-[var(--text)] disabled:opacity-30"
        aria-label="Previous week"
      >
        ←
      </button>

      <div className="text-sm font-semibold">Week {week}</div>

      <button
        onClick={() => next && go(season, next)}
        disabled={!next}
        className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] enabled:hover:bg-[var(--panel-2)] enabled:hover:text-[var(--text)] disabled:opacity-30"
        aria-label="Next week"
      >
        →
      </button>

      <div className="ml-auto flex items-center gap-2">
        <select
          value={season}
          onChange={(e) => go(Number(e.target.value), week)}
          className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1.5 text-sm"
          aria-label="Season"
        >
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={week}
          onChange={(e) => go(season, Number(e.target.value))}
          className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1.5 text-sm"
          aria-label="Week"
        >
          {weeks.map((w) => <option key={w} value={w}>Week {w}</option>)}
        </select>
      </div>
    </div>
  );
}
