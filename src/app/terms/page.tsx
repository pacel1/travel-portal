import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms for using TripTimi — a free travel-timing reference. Informational use only; data is provided without warranty.",
  robots: "index, follow",
  alternates: { canonical: `${getSiteUrl()}/terms` },
};

export default function TermsPage() {
  return (
    <main className="pb-20 pt-8">
      <div className="shell max-w-3xl space-y-12">
        <header className="border-b border-[var(--border)] pb-8">
          <Link href="/about" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            ← About TripTimi
          </Link>
          <h1 className="mt-4 font-serif text-[3rem] font-medium leading-tight tracking-[-0.01em] text-[var(--foreground)]">
            Terms of Use
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            Plain-language terms for using TripTimi.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Using the site</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            TripTimi is a free reference for travel timing. You may use it for personal,
            non-commercial trip planning. You may not scrape, republish, or resell the datasets or
            the TripTimi Score in bulk without written permission.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Informational use only</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            Content is provided for general information and is based on historical averages and
            modelled signals. It is not professional travel advice. See the{" "}
            <Link href="/disclaimer" className="text-[var(--accent)] underline underline-offset-2">
              Disclaimer
            </Link>{" "}
            for how to read the data and our affiliate disclosure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">Third-party data and links</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            Climate data comes from Open-Meteo, points of interest from OpenStreetMap, and photos
            from Wikimedia Commons, each under its own licence and terms. TripTimi links to
            third-party booking and travel services, including affiliate partners, and is not
            responsible for their content, pricing, or availability.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-medium text-[var(--foreground)]">No warranty</h2>
          <p className="leading-relaxed text-[var(--muted)]">
            The site is provided &ldquo;as is&rdquo;, without warranties of any kind. To the extent
            permitted by law, TripTimi is not liable for any loss arising from use of the site or
            reliance on its data. We may update these terms; continued use means you accept the
            current version.
          </p>
        </section>

        <footer className="border-t border-[var(--border)] pt-6 font-mono text-xs text-[var(--muted)]">
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-[var(--foreground)]">About</Link>
            <Link href="/disclaimer" className="hover:text-[var(--foreground)]">Disclaimer</Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
            <Link href="/contact" className="hover:text-[var(--foreground)]">Contact</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
