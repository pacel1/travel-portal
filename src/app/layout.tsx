import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://triptimi.com"
  ),
  applicationName: "TripTimi",
  title: {
    default: "TripTimi",
    template: "%s | TripTimi",
  },
  description:
    "Data-first travel pages for every city and month, built for scalable programmatic SEO without thin content.",
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
  openGraph: {
    title: "TripTimi",
    description:
      "Weather stats, travel scores, and practical tips for city + month travel planning.",
    type: "website",
    images: [
      {
        url: "/triptimiscore.png",
        width: 633,
        height: 593,
        alt: "TripTimi travel score",
      },
    ],
  },
  twitter: {
    card: "summary",
    images: ["/triptimiscore.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
