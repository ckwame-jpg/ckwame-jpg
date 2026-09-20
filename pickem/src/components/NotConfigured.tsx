export default function NotConfigured() {
  return (
    <div className="panel rounded-2xl p-8">
      <h1 className="text-lg font-semibold">Almost there</h1>
      <p className="mt-2 max-w-prose text-sm text-[var(--muted)]">
        The board is deployed but has no database credentials yet, so there is
        nothing to read or write. Add the Supabase service-role key and it comes
        to life on the next deploy.
      </p>
      <ol className="mt-4 max-w-prose list-decimal space-y-1.5 pl-5 text-sm text-[var(--muted)]">
        <li>Supabase dashboard → <span className="text-[var(--text)]">nfl-pickem</span> → Project Settings → API</li>
        <li>Copy the <code className="text-[var(--text)]">service_role</code> key</li>
        <li>
          Vercel → <span className="text-[var(--text)]">nfl-pickem</span> → Settings → Environment Variables →
          add it as <code className="text-[var(--text)]">SUPABASE_SERVICE_ROLE_KEY</code>
        </li>
        <li>Redeploy</li>
      </ol>
    </div>
  );
}
