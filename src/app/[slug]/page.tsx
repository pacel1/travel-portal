import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPagePayload,
  getPagesForCity,
  monthLabel,
  pagePayloads,
} from "@/lib/catalog";

const signalTone = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
} as const;

export function generateStaticParams() {
  return pagePayloads.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPagePayload(slug);

  if (!page) {
    return {
      title: "Page not found",
    };
  }

  return {
    title: `${page.cityName} in ${monthLabel(page.month)} · Score ${page.score}`,
    description: page.summary,
  };
}

export default async function TravelMonthPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPagePayload(slug);

  if (!page) {
    notFound();
  }

  const allMonthsForCity = getPagesForCity(page.citySlug);

  return (
    <main className="pb-16 pt-6 sm:pb-24 sm:pt-8">
      <div className="shell space-y-8">
        <nav className="text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--foreground)]">
            Travel Portal
          </Link>
          <span className="px-2">/</span>
          <span>
            {page.cityName} in {monthLabel(page.month)}
          </span>
        </nav>

        <section className="panel rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <div className="section-grid items-start">
            <div className="space-y-5">
              <p className="eyebrow text-[var(--accent)]">Hero</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--muted)]">
                  {page.country}
                </span>
                <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-semibold text-white">
                  Travel score {page.score}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${signalTone[page.travelSignals.crowdLevel]}`}
                >
                  {page.travelSignals.crowdLevel} crowds
                </span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {page.cityName} in {monthLabel(page.month)}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">{page.summary}</p>
              <p className="text-sm font-medium text-[var(--accent-warm)]">
                Verdict: {page.scoreLabel}
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--border)] bg-white/80 p-5">
              <p className="eyebrow text-[var(--accent-warm)]">Weather Snapshot</p>
              <div className="mt-4 metric-grid">
                <Metric label="Day temp" value={`${page.climate.avgTempDay}C`} />
                <Metric label="Night temp" value={`${page.climate.avgTempNight}C`} />
                <Metric label="Rainfall" value={`${page.climate.rainfallMm} mm`} />
                <Metric label="Rainy days" value={`${page.climate.rainyDays}`} />
                <Metric label="Humidity" value={`${page.climate.humidity}%`} />
                <Metric label="Sunshine" value={`${page.climate.sunshineHours} h`} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="panel rounded-[1.75rem] p-6">
            <p className="eyebrow text-[var(--accent)]">Weather</p>
            <h2 className="mt-2 text-2xl font-semibold">Key planning stats</h2>
            <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-white/85">
              <table className="w-full text-left text-sm">
                <tbody>
                  <WeatherRow label="Average daytime temperature" value={`${page.climate.avgTempDay}C`} />
                  <WeatherRow label="Average night temperature" value={`${page.climate.avgTempNight}C`} />
                  <WeatherRow label="Monthly rainfall" value={`${page.climate.rainfallMm} mm`} />
                  <WeatherRow label="Rainy days" value={`${page.climate.rainyDays} days`} />
                  <WeatherRow label="Humidity" value={`${page.climate.humidity}%`} />
                  <WeatherRow label="Daily sunshine" value={`${page.climate.sunshineHours} hours`} />
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel rounded-[1.75rem] p-6">
            <p className="eyebrow text-[var(--accent)]">Verdict</p>
            <h2 className="mt-2 text-2xl font-semibold">Is it a good time to visit?</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{page.verdict.heading}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="text-sm font-semibold text-emerald-900">Pros</h3>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-emerald-900/80">
                  {page.verdict.pros.map((pro) => (
                    <li key={pro}>{pro}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
                <h3 className="text-sm font-semibold text-rose-900">Cons</h3>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-rose-900/80">
                  {page.verdict.cons.map((con) => (
                    <li key={con}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="panel rounded-[1.75rem] p-6">
            <p className="eyebrow text-[var(--accent)]">Attractions</p>
            <h2 className="mt-2 text-2xl font-semibold">What to do in this month</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <AttractionColumn
                title="Outdoor if the weather cooperates"
                items={page.attractions.outdoor}
              />
              <AttractionColumn
                title="Indoor fallback"
                items={page.attractions.indoor}
              />
            </div>
          </article>

          <article className="panel rounded-[1.75rem] p-6">
            <p className="eyebrow text-[var(--accent)]">Tips</p>
            <h2 className="mt-2 text-2xl font-semibold">Seasonal recommendations</h2>
            <div className="mt-5 space-y-3">
              {page.recommendations.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-[var(--border)] bg-white/80 p-4 text-sm leading-7 text-[var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(15,118,110,0.08)] p-5">
              <h3 className="text-sm font-semibold">Practical trip tips</h3>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--muted)]">
                {page.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <article className="panel rounded-[1.75rem] p-6">
            <p className="eyebrow text-[var(--accent)]">Internal Links</p>
            <h2 className="mt-2 text-2xl font-semibold">More {page.cityName} months</h2>
            <div className="mt-5 grid gap-3">
              {page.internalLinks.sameCity.map((link) => (
                <Link
                  key={link.slug}
                  href={`/${link.slug}`}
                  className="flex items-center justify-between rounded-[1.25rem] border border-[var(--border)] bg-white/80 px-4 py-3 transition hover:border-[var(--accent)]"
                >
                  <span className="text-sm font-semibold">{link.label}</span>
                  <span className="font-mono text-sm">{link.score}</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="panel rounded-[1.75rem] p-6">
            <p className="eyebrow text-[var(--accent)]">Similar Cities</p>
            <h2 className="mt-2 text-2xl font-semibold">
              Other cities for {monthLabel(page.month)}
            </h2>
            <div className="mt-5 grid gap-3">
              {page.internalLinks.similarCities.map((link) => (
                <Link
                  key={link.slug}
                  href={`/${link.slug}`}
                  className="flex items-center justify-between rounded-[1.25rem] border border-[var(--border)] bg-white/80 px-4 py-3 transition hover:border-[var(--accent)]"
                >
                  <span className="text-sm font-semibold">{link.label}</span>
                  <span className="font-mono text-sm">{link.score}</span>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="panel rounded-[1.75rem] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--accent)]">All Months</p>
              <h2 className="mt-2 text-2xl font-semibold">
                Full publishing set for {page.cityName}
              </h2>
            </div>
            <Link
              href={`/api/page-cache/${page.slug}`}
              className="text-sm font-semibold text-[var(--accent)]"
            >
              View cached JSON payload
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {allMonthsForCity.map((monthPage) => (
              <Link
                key={monthPage.slug}
                href={`/${monthPage.slug}`}
                className={`rounded-[1.25rem] border px-4 py-3 transition ${
                  monthPage.slug === page.slug
                    ? "border-[var(--accent)] bg-[rgba(15,118,110,0.1)]"
                    : "border-[var(--border)] bg-white/80 hover:border-[var(--accent)]"
                }`}
              >
                <p className="text-sm font-semibold">{monthLabel(monthPage.month)}</p>
                <p className="mt-1 font-mono text-sm text-[var(--muted)]">
                  Score {monthPage.score}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 font-mono text-xl font-semibold">{value}</p>
    </div>
  );
}

function WeatherRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <th className="px-4 py-4 text-sm font-medium text-[var(--muted)]">{label}</th>
      <td className="px-4 py-4 text-right font-mono text-sm font-semibold">{value}</td>
    </tr>
  );
}

function AttractionColumn({
  title,
  items,
}: {
  title: string;
  items: { id: string; name: string; category: string; popularityScore: number }[];
}) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/80 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-[1rem] border border-[var(--border)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {item.category}
                </p>
              </div>
              <span className="rounded-full bg-[rgba(196,126,46,0.16)] px-2 py-1 text-xs font-semibold text-[var(--foreground)]">
                {item.popularityScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
