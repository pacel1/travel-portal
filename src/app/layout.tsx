import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { getLocaleFromPathname } from "@/lib/i18n";
import { buildSocialMetadata, getSiteUrl, serializeJsonLd } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "TripTimi",
  title: {
    default: "TripTimi",
    template: "%s | TripTimi",
  },
  description:
    "Weather, crowds, prices, and practical tips for choosing the best month for your next city trip.",
  icons: {
    icon: [
      {
        url: "/favicontriptimi.png",
        type: "image/png",
        sizes: "565x580",
      },
    ],
    shortcut: "/favicontriptimi.png",
    apple: [
      {
        url: "/favicontriptimi.png",
        type: "image/png",
        sizes: "565x580",
      },
    ],
  },
  ...buildSocialMetadata({
    canonicalPath: "/",
    title: "TripTimi",
    description:
      "Weather stats, travel scores, and practical tips for city + month travel planning.",
  }),
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TripTimi",
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/logotriptimi.png`,
  description:
    "Travel timing guides based on climate data, crowd signals, and price levels — helping you pick the best month for any city trip.",
  founder: {
    "@type": "Person",
    name: "Paweł Celeński",
    email: "contact@triptimi.com",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@triptimi.com",
    contactType: "customer support",
  },
  sameAs: [],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-triptimi-pathname") || "/";
  const locale = getLocaleFromPathname(pathname);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-W1MY7EMT8D"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-W1MY7EMT8D');
            `,
          }}
        />
        <Script
          id="umami-analytics"
          src="https://umami-analytics-kohl-eta.vercel.app/script.js"
          strategy="afterInteractive"
          data-website-id="8c9c4333-729a-412d-83b9-155717797109"
        />
        <Script
          id="affiliate-program"
          strategy="beforeInteractive"
          nonce={undefined}
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                  var script = document.createElement("script");
                  script.async = 1;
                  script.src = 'https://emrldtp.com/NTE4NDg4.js?t=518488';
                  document.head.appendChild(script);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto border-t border-[var(--border)] py-10">
          <div className="shell space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-sm">
                <p className="font-serif text-lg font-medium text-[var(--foreground)]">TripTimi</p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Free travel-timing guides for 71 European cities — the best month to visit,
                  from real historical climate data.
                </p>
              </div>
              <nav
                className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-[var(--muted)]"
                aria-label="Footer navigation"
              >
                <a href="/about" className="hover:text-[var(--foreground)] transition-colors">About</a>
                <a href="/methodology" className="hover:text-[var(--foreground)] transition-colors">Methodology</a>
                <a href="/destinations" className="hover:text-[var(--foreground)] transition-colors">Destinations</a>
                <a href="/contact" className="hover:text-[var(--foreground)] transition-colors">Contact</a>
                <a href="/privacy" className="hover:text-[var(--foreground)] transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-[var(--foreground)] transition-colors">Terms</a>
                <a href="/disclaimer" className="hover:text-[var(--foreground)] transition-colors">Disclaimer</a>
              </nav>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5 font-mono text-[11px] text-[var(--muted)]">
              <span>© {new Date().getFullYear()} TripTimi · Built by Paweł Celeński</span>
              <span>Data: Open-Meteo · OpenStreetMap · Wikimedia Commons</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
