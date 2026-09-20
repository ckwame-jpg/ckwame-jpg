import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pick'em — Chris vs Steven",
  description: "Two-person NFL pick'em. One point per correct pick.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <header className="border-b border-[var(--line)] bg-[var(--panel)]/70 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-[var(--chris)]">Chris</span>
              <span className="mx-2 text-[var(--muted)]">vs</span>
              <span className="text-[var(--steven)]">Steven</span>
            </Link>
            <nav className="flex gap-1 text-sm">
              <Link href="/" className="rounded-lg px-3 py-1.5 text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]">
                Board
              </Link>
              <Link href="/standings" className="rounded-lg px-3 py-1.5 text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]">
                Standings
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 pb-10 pt-4 text-xs text-[var(--muted)]">
          One point per correct pick. Ties score for nobody.
        </footer>
      </body>
    </html>
  );
}
