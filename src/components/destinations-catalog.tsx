"use client";

import { useState } from "react";
import Link from "next/link";

const SUMMER_MONTHS = new Set(["june", "july", "august"]);
const WINTER_MONTHS = new Set(["november", "december", "january", "february"]);

type CatalogMonth = { href: string; label: string; month: string; score: number };

type CatalogCity = {
  cityName: string;
  citySlug: string;
  cityHref: string;
  country: string;
  countryLabel: string;
  bestMonth: CatalogMonth;
  months: CatalogMonth[];
  bestLabel: string;
  scoreLabel: string;
  cityDescription: string;
  formattedBestMonth: string;
  formattedBestScore: string;
  monthGuideLabel: string;
};

type CatalogCountry = {
  country: string;
  countryLabel: string;
  description: string;
  cities: CatalogCity[];
};

type FilterLabels = {
  all: string;
  summer: string;
  winter: string;
  topScore: string;
};

type SeasonFilter = "all" | "summer" | "winter";
type ScoreFilter = "all" | "top";

function matchesSeason(city: CatalogCity, season: SeasonFilter) {
  if (season === "all") return true;
  const month = city.bestMonth.month;
  return season === "summer" ? SUMMER_MONTHS.has(month) : WINTER_MONTHS.has(month);
}

function matchesScore(city: CatalogCity, scoreFilter: ScoreFilter) {
  return scoreFilter === "all" || city.bestMonth.score >= 80;
}

function scoreTierColor(score: number): string {
  if (score >= 80) return "var(--tier-prime-bg)";
  if (score >= 68) return "var(--tier-good-bg)";
  if (score >= 55) return "rgba(0,0,0,0.22)";
  return "rgba(0,0,0,0.10)";
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "score-ticket-prime";
  if (score >= 68) return "score-ticket-great";
  if (score >= 55) return "score-ticket-good";
  if (score >= 45) return "score-ticket-plan";
  return "score-ticket-fit";
}

function DestCard({ city, locale }: { city: CatalogCity; locale: string }) {
  const score = city.bestMonth.score;
  const allMonths = city.months;
  const maxScore = 100;

  return (
    <Link
      href={city.cityHref}
      prefetch={false}
      className="ed-surface flex flex-col gap-4 p-5 lift no-underline hover:border-[var(--border-strong)]"
      style={{ borderRadius: "0.75rem", minHeight: "11rem" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-xl font-medium leading-tight text-[var(--foreground)]">
            {city.cityName}
          </p>
          <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">{city.countryLabel}</p>
        </div>
        <span
          className={`score-badge ${scoreBadgeClass(score)} inline-flex shrink-0 items-baseline gap-1 px-2.5 py-1 rounded-full text-sm font-serif font-medium`}
        >
          {score}
        </span>
      </div>

      {/* Best month footer */}
      <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3 font-mono text-[11px] text-[var(--muted)]">
        <span>
          {city.bestLabel}: {city.formattedBestMonth}
        </span>
        <span>{city.formattedBestScore}</span>
      </div>

      {/* Mini 12-month bar */}
      <div className="flex gap-px" aria-hidden="true">
        {allMonths.map((m) => {
          const h = Math.max(4, (m.score / maxScore) * 20);
          const isBest = m.month === city.bestMonth.month;
          return (
            <div
              key={m.month}
              className="flex flex-1 flex-col items-stretch"
              style={{ height: 20 }}
            >
              <div style={{ flex: `0 0 ${20 - h}px` }} />
              <div
                style={{
                  flex: `0 0 ${h}px`,
                  background: isBest ? "var(--accent-warm)" : scoreTierColor(m.score),
                  borderRadius: "1px 1px 0 0",
                  opacity: isBest ? 1 : 0.8,
                }}
              />
            </div>
          );
        })}
      </div>
    </Link>
  );
}

export function DestinationsCatalog({
  countries,
  locale,
  filterLabels,
}: {
  countries: CatalogCountry[];
  locale: string;
  filterLabels: FilterLabels;
}) {
  const [season, setSeason] = useState<SeasonFilter>("all");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");

  const filtered = countries
    .map((country) => ({
      ...country,
      cities: country.cities.filter(
        (city) => matchesSeason(city, season) && matchesScore(city, scoreFilter),
      ),
    }))
    .filter((country) => country.cities.length > 0);

  const totalVisible = filtered.reduce((n, c) => n + c.cities.length, 0);

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-y border-[var(--border)] py-4">
        <div className="flex flex-wrap gap-1.5">
          {(["all", "summer", "winter"] as SeasonFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={[
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border",
                season === s
                  ? "bg-[var(--foreground)] text-white border-[var(--foreground)]"
                  : "bg-transparent text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]",
              ].join(" ")}
            >
              {s === "all" ? filterLabels.all : s === "summer" ? filterLabels.summer : filterLabels.winter}
            </button>
          ))}
        </div>
        <button
          onClick={() => setScoreFilter((f) => (f === "top" ? "all" : "top"))}
          className={[
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border",
            scoreFilter === "top"
              ? "bg-[var(--accent)] text-white border-[var(--accent)]"
              : "bg-transparent text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]",
          ].join(" ")}
        >
          {filterLabels.topScore}
        </button>
        <span className="ml-auto font-mono text-xs text-[var(--muted)]">{totalVisible}</span>
      </div>

      {/* Countries + DestCard grid */}
      {filtered.map((country) => (
        <section key={country.country} className="space-y-4">
          <div>
            <p className="eyebrow text-[var(--accent)]">{country.countryLabel}</p>
            <h2 className="mt-1 font-serif text-[1.75rem] font-medium text-[var(--foreground)]">
              {country.countryLabel}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              {country.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {country.cities.map((city) => (
              <DestCard key={city.citySlug} city={city} locale={locale} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
