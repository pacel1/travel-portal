import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "How to read TripTimi data: the TripTimi Score is an indicative index based on historical climate averages, not a guarantee. Includes our affiliate disclosure.",
  robots: "index, follow",
  alternates: { canonical: `${getSiteUrl()}/disclaimer` },
};

export default function DisclaimerPage() {
  return (
    <main className="pb-20 pt-8">
      <div className="shell max-w-3xl space-y-12">
        <header className="border-b border-[var(--border)] pb-8">
          <Link href="/about" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            ← About TripTimi
          </Link>
          <h1 className="mt-4 font-serif text-[3rem] font-medium leading-tight tracking-[-0.01em] text-[var(--foreground)]">
            Disclaimer
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            What TripTimi can and cannot tell you — and how we keep the site free.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Indicative, not a guarantee</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            The TripTimi Score and every figure on this site describe{" "}
            <strong className="text-[var(--foreground)]">typical</strong> conditions, calculated
            from historical monthly averages. They are an indicative index to compare months and
            cities — not a forecast, and not a guarantee of the weather, prices, or crowds you will
            experience in any specific year. Always check current forecasts and live prices before
            you book.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">What the numbers are</h2>
          <ul className="space-y-2 text-[var(--muted)]">
            {[
              ["Climate", "Historical monthly averages from Open-Meteo. Real years vary, sometimes substantially."],
              ["Crowds & prices", "Heuristic seasonal signals (low / medium / high), modelled from tourism seasonality and city scale — not live market data."],
              ["Attractions", "Points of interest and popularity from OpenStreetMap; photos from Wikimedia Commons under their respective licences."],
              ["TripTimi Score", "A transparent weighted formula explained in full on the Methodology page."],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>
                  <strong className="text-[var(--foreground)]">{label}</strong> — {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            See the full{" "}
            <Link href="/methodology" className="text-[var(--accent)] underline underline-offset-2">
              Score Methodology
            </Link>{" "}
            for sources, weighting, and limitations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Affiliate disclosure</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            TripTimi is free to use. Some links — including flight and hotel search, tours, and eSIM
            widgets — are{" "}
            <strong className="text-[var(--foreground)]">affiliate links</strong>. If you book through
            them, we may earn a commission at no extra cost to you. These commissions help keep the
            site free and independent.
          </p>
          <p className="leading-relaxed text-[var(--muted)]">
            Affiliate partnerships never influence the TripTimi Score or how cities and months are
            ranked. The score is computed only from the climate, crowd, and price model described in
            the methodology, with no commercial input.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">No liability</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            TripTimi is provided &ldquo;as is&rdquo; for general informational purposes. We are not
            liable for decisions made on the basis of the data presented here. Travel conditions,
            opening hours, prices, and events change; verify the details that matter for your trip
            with official and current sources.
          </p>
        </section>

        <footer className="border-t border-[var(--border)] pt-6 font-mono text-xs text-[var(--muted)]">
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-[var(--foreground)]">About</Link>
            <Link href="/methodology" className="hover:text-[var(--foreground)]">Methodology</Link>
            <Link href="/terms" className="hover:text-[var(--foreground)]">Terms</Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
            <Link href="/contact" className="hover:text-[var(--foreground)]">Contact</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
