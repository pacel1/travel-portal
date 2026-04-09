import Link from "next/link";

import {
  cityRecords,
  getFeaturedPages,
  getTopMonthsForCity,
  monthLabel,
} from "@/lib/catalog";

const signalTone = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
} as const;

export default function Home() {
  const featuredPages = getFeaturedPages();

  return (
    <main className="pb-16 pt-6 sm:pb-24 sm:pt-8">
      <div className="shell space-y-8">
        <section className="panel overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-5">
              <p className="eyebrow text-[var(--accent)]">Travel Portal MVP</p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
                Data-first city and month landing pages built for programmatic SEO.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
                Each page is generated from structured travel data, not long generic
                articles. The MVP ships weather stats, travel scoring, attraction
                picks, quick tips, and internal links for a scalable city + month
                publishing model.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/rome-in-may"
                  className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                >
                  View sample page
                </Link>
                <a
                  href="#cities"
                  className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold transition hover:bg-white/60"
                >
                  Explore city matrix
                </a>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-white/60 bg-white/70 p-6">
              <p className="eyebrow text-[var(--accent-warm)]">MVP Principles</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                <li>No runtime third-party API calls</li>
                <li>Static pages fed by a generated page cache</li>
                <li>Short unique copy derived from real metrics</li>
                <li>Separate data, scoring logic, and route UI</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="panel rounded-[2rem] px-6 py-8 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--accent)]">Featured Pages</p>
              <h2 className="mt-2 text-2xl font-semibold">Highest-scoring travel windows</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
              Scores combine temperature comfort, rainfall, crowd pressure, and
              price pressure to avoid vague “best time to visit” advice.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredPages.map((page) => (
              <Link
                key={page.slug}
                href={`/${page.slug}`}
                className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--muted)]">{page.country}</p>
                    <h3 className="mt-1 text-xl font-semibold">
                      {page.cityName} in {monthLabel(page.month)}
                    </h3>
                  </div>
                  <div className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-semibold text-white">
                    {page.score}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{page.summary}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="cities" className="space-y-5">
          <div>
            <p className="eyebrow text-[var(--accent)]">City Matrix</p>
            <h2 className="mt-2 text-2xl font-semibold">Every city gets a full 12-month landing page set</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {cityRecords.map((city) => {
              const topMonths = getTopMonthsForCity(city.slug);

              return (
                <article key={city.id} className="panel rounded-[1.75rem] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--muted)]">{city.country}</p>
                      <h3 className="mt-1 text-2xl font-semibold">{city.name}</h3>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                      {(city.population / 1000000).toFixed(1)}M people
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {topMonths.map((month) => (
                      <Link
                        key={`${city.slug}-${month.month}`}
                        href={`/${city.slug}-in-${month.month}`}
                        className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 transition hover:border-[var(--accent)]"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {city.name} in {monthLabel(month.month)}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            Best window for this city in the current seed set
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-semibold">{month.score}</p>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${signalTone[month.crowdLevel]}`}
                          >
                            {month.crowdLevel} crowds
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
