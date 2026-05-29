import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact — TripTimi",
  description: "Get in touch with the TripTimi team.",
  robots: "index, follow",
  alternates: { canonical: `${getSiteUrl()}/contact` },
};

export default function ContactPage() {
  return (
    <main className="pb-20 pt-8">
      <div className="shell max-w-3xl space-y-10">
        <header className="border-b border-[var(--border)] pb-8">
          <Link href="/" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            ← TripTimi
          </Link>
          <h1 className="mt-4 font-serif text-[3rem] font-medium leading-tight tracking-[-0.01em] text-[var(--foreground)]">
            Contact
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-[var(--muted)]">
            Questions, corrections, partnership inquiries, or feedback about the data.
          </p>
        </header>

        <section className="space-y-6">
          <div className="ed-surface rounded-xl p-6 space-y-3">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">Email</p>
            <a
              href="mailto:contact@triptimi.com"
              className="font-serif text-2xl font-medium text-[var(--accent)] underline underline-offset-4 hover:text-[var(--accent-strong)]"
            >
              contact@triptimi.com
            </a>
            <p className="text-sm text-[var(--muted)]">
              Typically replied within 2 business days.
            </p>
          </div>

          <div className="space-y-2 text-sm text-[var(--muted)]">
            <p className="font-medium text-[var(--foreground)]">What to include in your message:</p>
            <ul className="space-y-1.5 pl-4">
              {[
                "Data corrections — if you spot an error in climate or attraction data, include the city and month.",
                "Missing cities — if you'd like to see a city added, name the city and country.",
                "Partnership or affiliate inquiries — describe the context briefly.",
                "Press or media — include your publication and deadline.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--muted)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="border-t border-[var(--border)] pt-6 font-mono text-xs text-[var(--muted)]">
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-[var(--foreground)]">About</Link>
            <Link href="/methodology" className="hover:text-[var(--foreground)]">Methodology</Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
