import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Link Placeholder",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BookingPlaceholderPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string;
    month?: string;
    intent?: string;
  }>;
}) {
  const { city, month, intent } = await searchParams;

  return (
    <main className="pb-20 pt-10">
      <div className="shell">
        <section className="apple-panel rounded-[2rem] px-6 py-8 sm:px-8">
          <p className="eyebrow text-[var(--accent-warm)]">Booking Placeholder</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Booking affiliate link staging page
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            This route is a temporary placeholder for future Booking.com affiliate destinations.
            The visual placements on the city-month pages are live, and the final outbound URLs can
            replace this route later without redesigning the UI.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="apple-soft-card rounded-[1.4rem] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                City
              </p>
              <p className="mt-2 text-sm font-semibold">{city ?? "not provided"}</p>
            </div>
            <div className="apple-soft-card rounded-[1.4rem] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Month
              </p>
              <p className="mt-2 text-sm font-semibold">{month ?? "not provided"}</p>
            </div>
            <div className="apple-soft-card rounded-[1.4rem] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Intent
              </p>
              <p className="mt-2 text-sm font-semibold">{intent ?? "not provided"}</p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Return to homepage
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
