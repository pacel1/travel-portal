import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="panel max-w-xl rounded-[2rem] px-8 py-10 text-center">
        <p className="eyebrow text-[var(--accent)]">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Travel page not found</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          The requested city and month slug is not in the current MVP dataset yet.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
        >
          Back to portal
        </Link>
      </div>
    </main>
  );
}
