import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl, serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How TripTimi Score Works — Methodology",
  description:
    "Detailed explanation of how the TripTimi Score is calculated: temperature curves, precipitation weighting, crowd demand model, and price signals.",
  robots: "index, follow",
  alternates: { canonical: `${getSiteUrl()}/methodology` },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "TripTimi Score Methodology",
  description: "How the TripTimi 0–100 travel timing score is calculated.",
  author: { "@type": "Person", name: "Paweł Celeński" },
  publisher: { "@type": "Organization", name: "TripTimi", url: getSiteUrl() },
  url: `${getSiteUrl()}/methodology`,
};

export default function MethodologyPage() {
  return (
    <main className="pb-20 pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <div className="shell max-w-3xl space-y-12">
        <header className="border-b border-[var(--border)] pb-8">
          <Link href="/about" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            ← About TripTimi
          </Link>
          <h1 className="mt-4 font-serif text-[3rem] font-medium leading-tight tracking-[-0.01em] text-[var(--foreground)]">
            Score Methodology
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            How TripTimi calculates a 0–100 score for every city-month combination — the data
            sources, the weighting model, and the tier thresholds.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Score formula</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            The TripTimi Score is a weighted sum of five component scores, each normalised to 0–100:
          </p>
          <div className="rounded-lg border border-[var(--border)] bg-white p-5 font-mono text-sm">
            <p className="text-[var(--foreground)]">Score = </p>
            <p className="mt-2 pl-4 text-[var(--muted)]">
              temperature_comfort × 0.30<br />
              + precipitation       × 0.30<br />
              + sunshine            × 0.20<br />
              + crowd_level         × 0.10<br />
              + price_level         × 0.10
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Component details</h2>

          <div className="space-y-6">
            {[
              {
                title: "Temperature comfort (30%)",
                body: "Scores daytime and night-time averages against an optimal curve for walking-heavy city travel. Peak comfort at 22°C day / 14°C night. Both extremes (below 0°C and above 35°C) are penalised non-linearly. Day temperature counts for 75% of the component, night for 25%.",
                source: "Open-Meteo historical monthly averages",
              },
              {
                title: "Precipitation (30%)",
                body: "Combines rainy-day frequency (65% weight) and total monthly rainfall in mm (35% weight). Rainy-day count matters more than total volume because a single heavy storm affects city travel less than 15 drizzly days. Threshold: 10+ rainy days or 130+ mm triggers significant penalties.",
                source: "Open-Meteo historical monthly averages",
              },
              {
                title: "Sunshine hours (20%)",
                body: "Daily average sunshine hours. Scoring curve: 0h = 0, rising linearly to 100 at 12h+. Sunshine affects mood, outdoor photography light, and the practical usability of parks and viewpoints.",
                source: "Open-Meteo historical monthly averages",
              },
              {
                title: "Crowd level (10%)",
                body: "A seasonal demand model built from European tourism seasonality by month, scaled by city population (larger cities attract proportionally more tourists year-round). Output: low / medium / high, mapped to fixed scores (low = 92, medium = 74, high = 52).",
                source: "Seasonal demand model + city population data",
              },
              {
                title: "Price level (10%)",
                body: "Relative seasonal price index — whether a given month sits above or below the city's own annual average for mid-range accommodation. Built from the same seasonal demand model. Output: low / medium / high, mapped to fixed scores (low = 92, medium = 74, high = 56).",
                source: "Seasonal demand model",
              },
            ].map((c) => (
              <div key={c.title} className="ed-surface rounded-lg p-5 space-y-2">
                <h3 className="font-serif text-lg font-medium text-[var(--foreground)]">{c.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">{c.body}</p>
                <p className="font-mono text-xs text-[var(--accent)]">Source: {c.source}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Score tiers</h2>
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-[var(--muted)]">Score</th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-[var(--muted)]">Label</th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-[var(--muted)]">Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {[
                  ["80–100", "Excellent", "Strong weather, manageable crowds, reasonable prices. Easy to recommend broadly."],
                  ["68–79", "Very Good", "Good conditions with minor trade-offs — typically one factor below ideal."],
                  ["55–67", "Solid", "Worth visiting with realistic expectations. Usually a weather or crowd compromise."],
                  ["45–54", "Mixed", "Noticeable trade-offs. Still suits specific traveller types (budget, indoor-focused)."],
                  ["< 45", "Only if the timing fits", "Significant limitations. Works only for very specific trip profiles."],
                ].map(([score, label, interp]) => (
                  <tr key={score}>
                    <td className="px-4 py-3 font-mono text-[var(--foreground)]">{score}</td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{label}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{interp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Limitations</h2>
          <ul className="space-y-2 text-[var(--muted)]">
            {[
              "Climate data is historical averages — any given year will differ due to weather variability.",
              "Crowd and price models are heuristic, not live market data. Actual prices vary with booking lead time and specific accommodation type.",
              "The score is calibrated for walking-heavy city trips. It does not account for skiing, beach holidays, or festival-specific travel.",
              "Cities with fewer data years in the Open-Meteo record may have less reliable averages.",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--border-strong)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-[var(--border)] pt-6 font-mono text-xs text-[var(--muted)]">
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-[var(--foreground)]">About</Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-[var(--foreground)]">Contact</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
