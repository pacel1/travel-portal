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
        <footer className="mt-auto border-t border-[var(--border)] py-8">
          <div className="shell flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[var(--muted)]">
            <span>© {new Date().getFullYear()} TripTimi · Paweł Celeński</span>
            <nav className="flex flex-wrap gap-5" aria-label="Footer navigation">
              <a href="/about" className="hover:text-[var(--foreground)] transition-colors">About</a>
              <a href="/methodology" className="hover:text-[var(--foreground)] transition-colors">Methodology</a>
              <a href="/contact" className="hover:text-[var(--foreground)] transition-colors">Contact</a>
              <a href="/privacy" className="hover:text-[var(--foreground)] transition-colors">Privacy</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
