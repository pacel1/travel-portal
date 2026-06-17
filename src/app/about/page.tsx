import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl, serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About TripTimi",
  description:
    "TripTimi is a travel timing guide built by Paweł Celeński. Learn how the TripTimi Score works and where the data comes from.",
  robots: "index, follow",
  alternates: { canonical: `${getSiteUrl()}/about` },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Paweł Celeński",
  url: getSiteUrl(),
  jobTitle: "Founder",
  worksFor: {
    "@type": "Organization",
    name: "TripTimi",
    url: getSiteUrl(),
  },
};

export default function AboutPage() {
  return (
    <main className="pb-20 pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(personSchema) }}
      />

      <div className="shell max-w-3xl space-y-12">
        <header className="border-b border-[var(--border)] pb-8">
          <Link href="/" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            ← TripTimi
          </Link>
          <h1 className="mt-4 font-serif text-[3rem] font-medium leading-tight tracking-[-0.01em] text-[var(--foreground)]">
            About TripTimi
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            A travel timing guide built on climate data, crowd patterns, and price signals
            — designed to answer one practical question: when is the right month to visit?
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Who built this</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            TripTimi was created by <strong className="text-[var(--foreground)]">Paweł Celeński</strong>, a
            developer and traveller based in Poland. The project started as a personal tool for
            comparing travel windows across European cities and grew into a full guide covering
            71 cities, each with a single month-by-month guide that scores all 12 months.
          </p>
          <p className="leading-relaxed text-[var(--muted)]">
            The goal is to give travellers comparable, data-grounded answers instead of generic
            "best time to visit" articles that ignore crowd levels, price seasonality, and the
            actual shape of a month's weather.
          </p>
          <p className="leading-relaxed text-[var(--muted)]">
            Questions or feedback:{" "}
            <a href="mailto:contact@triptimi.com" className="text-[var(--accent)] underline underline-offset-2">
              contact@triptimi.com
            </a>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">How the TripTimi Score works</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            Each city-month page shows a TripTimi Score from 0 to 100. The score is a weighted
            composite of five factors derived from historical climate data and seasonal demand signals:
          </p>
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-[var(--muted)]">Factor</th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-[var(--muted)]">Weight</th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-[var(--muted)]">What it measures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {[
                  ["Temperature comfort", "30%", "Optimal day and night temps for walking-heavy city trips (peaks around 22°C day / 14°C night)"],
                  ["Precipitation", "30%", "Both rainy-day frequency and total rainfall mm — how often rain interrupts plans"],
                  ["Sunshine hours", "20%", "Daily average sunshine hours — affects mood, photography, and outdoor time"],
                  ["Crowd level", "10%", "Seasonal demand model based on tourism patterns and city population"],
                  ["Price level", "10%", "Relative accommodation and travel cost vs. the city's own annual average"],
                ].map(([factor, weight, desc]) => (
                  <tr key={factor}>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{factor}</td>
                    <td className="px-4 py-3 font-mono text-[var(--accent)]">{weight}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Score tiers: <strong className="text-[var(--foreground)]">80+</strong> Excellent ·{" "}
            <strong className="text-[var(--foreground)]">68–79</strong> Very Good ·{" "}
            <strong className="text-[var(--foreground)]">55–67</strong> Solid ·{" "}
            <strong className="text-[var(--foreground)]">45–54</strong> Mixed ·{" "}
            <strong className="text-[var(--foreground)]">&lt;45</strong> Only if the timing fits
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Data sources</h2>
          <ul className="space-y-2 text-[var(--muted)]">
            {[
              ["Climate data", "Open-Meteo historical climate averages (temperature, rainfall, sunshine hours, humidity) — 10+ year monthly averages per city."],
              ["Crowd signals", "Seasonal demand model built from population data, European tourism seasonality patterns, and city-scale multipliers."],
              ["Price signals", "Relative seasonal index — not absolute prices, but whether a given month is above or below a city's annual average."],
              ["Points of interest", "OpenStreetMap — popularity scores derived from edit frequency and map usage data. Photos are from Wikimedia Commons under their respective licences."],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-3">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>
                  <strong className="text-[var(--foreground)]">{label}</strong> — {desc}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Editorial standards</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            TripTimi pages are <strong className="text-[var(--foreground)]">data-first</strong>. Each
            city guide is built directly from the underlying datasets — the climate chart, the
            month-by-month comparison table, and the TripTimi Score — rather than from long-form
            written articles. The data is the content, and every figure traces back to a named
            source.
          </p>
          <p className="leading-relaxed text-[var(--muted)]">
            The TripTimi Score is an <strong className="text-[var(--foreground)]">indicative index</strong>,
            not a travel recommendation. It reflects typical seasonal conditions based on
            historical averages — actual weather, prices, and crowd levels in any given year
            will vary. Always check current conditions before booking. See the{" "}
            <Link href="/disclaimer" className="text-[var(--accent)] underline underline-offset-2">
              disclaimer
            </Link>{" "}
            for our affiliate disclosure.
          </p>
        </section>

        <footer className="border-t border-[var(--border)] pt-6 font-mono text-xs text-[var(--muted)]">
          <div className="flex flex-wrap gap-4">
            <Link href="/methodology" className="hover:text-[var(--foreground)]">Methodology</Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-[var(--foreground)]">Contact</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
