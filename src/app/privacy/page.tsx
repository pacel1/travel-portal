import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy — TripTimi",
  description: "Privacy Policy for TripTimi.com — how we collect, use, and protect your data.",
  robots: "index, follow",
  alternates: { canonical: `${getSiteUrl()}/privacy` },
};

const LAST_UPDATED = "2026-05-29";

export default function PrivacyPage() {
  return (
    <main className="pb-20 pt-8">
      <div className="shell max-w-3xl space-y-10">
        <header className="border-b border-[var(--border)] pb-8">
          <Link href="/" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            ← TripTimi
          </Link>
          <h1 className="mt-4 font-serif text-[3rem] font-medium leading-tight tracking-[-0.01em] text-[var(--foreground)]">
            Privacy Policy
          </h1>
          <p className="mt-2 font-mono text-xs text-[var(--muted)]">Last updated: {LAST_UPDATED}</p>
          <p className="mt-3 text-lg leading-relaxed text-[var(--muted)]">
            This policy explains what data TripTimi collects, why, and your rights under GDPR.
          </p>
        </header>

        <div className="space-y-8 text-[var(--muted)]">
          {[
            {
              title: "1. Who we are",
              content: (
                <>
                  <p>TripTimi (<strong className="text-[var(--foreground)]">triptimi.com</strong>) is operated by Paweł Celeński.
                  For privacy-related questions, contact us at{" "}
                  <a href="mailto:contact@triptimi.com" className="text-[var(--accent)] underline underline-offset-2">
                    contact@triptimi.com
                  </a>.</p>
                </>
              ),
            },
            {
              title: "2. What data we collect",
              content: (
                <ul className="space-y-2">
                  {[
                    ["Analytics data", "We use Google Analytics 4 to collect anonymised usage data: pages visited, session duration, country of origin, device type. No personally identifiable information is collected through analytics."],
                    ["Cookies", "Google Analytics sets first-party cookies to distinguish sessions. These cookies do not contain personal information. You can disable them in your browser settings."],
                    ["No account data", "TripTimi does not require registration. We do not collect names, email addresses, or payment information through the site."],
                    ["Contact emails", "If you email us at contact@triptimi.com, we receive and store that correspondence to reply to your inquiry."],
                  ].map(([label, desc]) => (
                    <li key={label} className="flex gap-3">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--border-strong)]" />
                      <span><strong className="text-[var(--foreground)]">{label}</strong> — {desc}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              title: "3. How we use your data",
              content: (
                <ul className="space-y-1.5 pl-5 list-disc">
                  <li>To understand how users interact with the site and improve the experience.</li>
                  <li>To respond to contact emails.</li>
                  <li>We do not sell, rent, or share personal data with third parties for marketing purposes.</li>
                </ul>
              ),
            },
            {
              title: "4. Third-party services",
              content: (
                <ul className="space-y-2">
                  {[
                    ["Google Analytics", "Usage analytics. Data is processed by Google LLC. See Google's privacy policy at policies.google.com."],
                    ["Booking.com affiliate links", "TripTimi includes affiliate links to Booking.com. Clicking these links takes you to Booking.com, which has its own privacy policy. TripTimi may earn a commission on bookings made through these links."],
                    ["Tiqets widget", "Activity listings on some pages are powered by Tiqets. Their data practices are governed by Tiqets' privacy policy."],
                    ["eSIM widget", "Some pages include an eSIM affiliate widget. Usage data is governed by the provider's policy."],
                  ].map(([label, desc]) => (
                    <li key={label} className="flex gap-3">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--border-strong)]" />
                      <span><strong className="text-[var(--foreground)]">{label}</strong> — {desc}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              title: "5. Your rights (GDPR)",
              content: (
                <>
                  <p className="mb-3">If you are in the European Economic Area, you have the right to:</p>
                  <ul className="space-y-1.5 pl-5 list-disc">
                    <li>Access the personal data we hold about you.</li>
                    <li>Request correction of inaccurate data.</li>
                    <li>Request deletion of your data (right to be forgotten).</li>
                    <li>Object to processing or request restriction.</li>
                    <li>Lodge a complaint with your national data protection authority.</li>
                  </ul>
                  <p className="mt-3">
                    To exercise any of these rights, email{" "}
                    <a href="mailto:contact@triptimi.com" className="text-[var(--accent)] underline underline-offset-2">
                      contact@triptimi.com
                    </a>.
                  </p>
                </>
              ),
            },
            {
              title: "6. Data retention",
              content: <p>Google Analytics data is retained for 14 months, per our account settings. Contact emails are retained for as long as necessary to resolve the inquiry.</p>,
            },
            {
              title: "7. Changes to this policy",
              content: <p>We may update this policy from time to time. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of TripTimi after changes constitutes acceptance of the updated policy.</p>,
            },
          ].map(({ title, content }) => (
            <section key={title} className="space-y-3">
              <h2 className="font-serif text-xl font-medium text-[var(--foreground)]">{title}</h2>
              <div className="leading-relaxed">{content}</div>
            </section>
          ))}
        </div>

        <footer className="border-t border-[var(--border)] pt-6 font-mono text-xs text-[var(--muted)]">
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-[var(--foreground)]">About</Link>
            <Link href="/methodology" className="hover:text-[var(--foreground)]">Methodology</Link>
            <Link href="/contact" className="hover:text-[var(--foreground)]">Contact</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
