import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getPagePayload, monthOrder, pagePayloads } from "@/lib/catalog";
import {
  formatCityMonthLabel,
  formatCountryName,
  formatMonthLabel,
  formatScoreLabel,
} from "@/lib/formatting";
import {
  buildDestinationsPath,
  buildHomePath,
  publishedLocales,
  type LocaleCode,
} from "@/lib/i18n";
import {
  buildLocalizedPagePath,
  getLocalizedDisplayCityName,
} from "@/lib/page-routing";
import { getCanonicalCitySlug } from "@/lib/slug-utils";

type DestinationMonth = {
  href: string;
  label: string;
  month: string;
  score: number;
};

type DestinationCity = {
  bestMonth: DestinationMonth;
  cityName: string;
  citySlug: string;
  country: string;
  countryLabel: string;
  months: DestinationMonth[];
};

const destinationsCopy: Record<
  LocaleCode,
  {
    eyebrow: string;
    title: string;
    description: string;
    best: string;
    monthGuide: string;
    score: string;
  }
> = {
  en: {
    eyebrow: "Destinations",
    title: "City travel calendar",
    description:
      "Browse every TripTimi city and jump into the month-by-month guide for weather, crowds, prices, and trip timing.",
    best: "Best month",
    monthGuide: "Month guides",
    score: "Score",
  },
  pl: {
    eyebrow: "Kierunki",
    title: "Kalendarz city breakow",
    description:
      "Przegladaj miasta TripTimi i przechodz do przewodnikow miesiac po miesiacu: pogoda, ruch, ceny i timing wyjazdu.",
    best: "Najlepszy miesiac",
    monthGuide: "Przewodniki miesieczne",
    score: "Ocena",
  },
  de: {
    eyebrow: "Ziele",
    title: "Stadt-Reisekalender",
    description:
      "Durchsuche alle TripTimi-Stadte und offne die Monatsguides fur Wetter, Andrang, Preise und Timing.",
    best: "Bester Monat",
    monthGuide: "Monatsguides",
    score: "Score",
  },
  es: {
    eyebrow: "Destinos",
    title: "Calendario de viajes urbanos",
    description:
      "Explora las ciudades de TripTimi y abre las guias mensuales de clima, afluencia, precios y timing.",
    best: "Mejor mes",
    monthGuide: "Guias mensuales",
    score: "Score",
  },
  fr: {
    eyebrow: "Destinations",
    title: "Calendrier de city break",
    description:
      "Parcours les villes TripTimi et ouvre les guides par mois pour la meteo, l'affluence, les prix et le timing.",
    best: "Meilleur mois",
    monthGuide: "Guides mensuels",
    score: "Score",
  },
};

function buildAbsoluteUrl(pathname: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return pathname;
  }

  try {
    return new URL(pathname, siteUrl).toString();
  } catch {
    return pathname;
  }
}

function buildAbsoluteDestinationLanguageAlternates() {
  return Object.fromEntries(
    publishedLocales.map((locale) => [
      locale,
      buildAbsoluteUrl(buildDestinationsPath(locale)),
    ]),
  );
}

export function buildDestinationsMetadata(locale: LocaleCode): Metadata {
  const copy = destinationsCopy[locale];
  const canonicalPath = buildDestinationsPath(locale);

  return {
    title: copy.title,
    description: copy.description,
    robots: "index, follow",
    alternates: {
      canonical: buildAbsoluteUrl(canonicalPath),
      languages: buildAbsoluteDestinationLanguageAlternates(),
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: "website",
      url: buildAbsoluteUrl(canonicalPath),
    },
  };
}

export function DestinationsIndex({ locale }: { locale: LocaleCode }) {
  const copy = destinationsCopy[locale];
  const countries = buildDestinationCountries(locale);
  const cityCount = countries.reduce((total, country) => total + country.cities.length, 0);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.title,
    description: copy.description,
    url: buildAbsoluteUrl(buildDestinationsPath(locale)),
    inLanguage: locale,
    numberOfItems: cityCount,
  };

  return (
    <main className="home-page pb-16 pt-3 sm:pb-24 sm:pt-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData).replace(/</g, "\\u003c"),
        }}
      />
      <div className="shell-tight space-y-6">
        <section className="home-hero">
          <nav className="home-nav">
            <Link href={buildHomePath(locale)} prefetch={false} aria-label="TripTimi">
              <Image
                src="/logotriptimi.png"
                alt="TripTimi"
                width={957}
                height={356}
                priority
                className="h-8 w-auto"
                sizes="132px"
              />
            </Link>
            <div className="home-locale-links" aria-label="Languages">
              <Link href="/destinations" prefetch={false} className={locale === "en" ? "is-active" : ""}>
                EN
              </Link>
              <Link href="/pl/kierunki" prefetch={false} className={locale === "pl" ? "is-active" : ""}>
                PL
              </Link>
            </div>
          </nav>

          <div className="home-hero-grid">
            <div>
              <p className="eyebrow text-[var(--accent)]">{copy.eyebrow}</p>
              <h1 className="home-title">{copy.title}</h1>
              <p className="home-lede">{copy.description}</p>
              <div className="home-stat-row">
                <span>
                  <strong>{cityCount}</strong> {locale === "pl" ? "miast" : "cities"}
                </span>
                <span>
                  <strong>{pagePayloads.length}</strong>{" "}
                  {locale === "pl" ? "przewodnikow" : "guides"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {countries.map((country) => (
          <section className="home-section" key={country.country}>
            <div className="home-section-heading">
              <p className="eyebrow text-[var(--accent)]">{country.countryLabel}</p>
              <h2>{country.countryLabel}</h2>
            </div>
            <div className="home-city-grid">
              {country.cities.map((city) => (
                <article className="home-city-card" key={city.citySlug}>
                  <div className="home-city-card-head">
                    <div>
                      <p>{country.countryLabel}</p>
                      <h3>{city.cityName}</h3>
                    </div>
                    <span>
                      {copy.score} {city.bestMonth.score}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {copy.best}:{" "}
                    <Link className="font-bold text-[var(--foreground)]" href={city.bestMonth.href} prefetch={false}>
                      {formatCityMonthLabel(city.cityName, city.bestMonth.month, locale)}
                    </Link>{" "}
                    ({formatScoreLabel(city.bestMonth.score, locale)}).
                  </p>
                  <div className="home-month-list" aria-label={copy.monthGuide}>
                    {city.months.map((month) => (
                      <Link className="home-month-link" href={month.href} key={month.month} prefetch={false}>
                        <span className="home-month-copy">
                          <span className="home-month-label">{month.label}</span>
                        </span>
                        <span className="score-badge home-score-badge-inline">
                          <span className="score-badge-value">{month.score}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function buildDestinationCountries(locale: LocaleCode) {
  const countries = new Map<string, DestinationCity[]>();

  for (const city of buildDestinationCities(locale)) {
    const countryCities = countries.get(city.country) ?? [];
    countryCities.push(city);
    countries.set(city.country, countryCities);
  }

  return Array.from(countries.entries())
    .map(([country, cities]) => ({
      cities,
      country,
      countryLabel: cities[0]?.countryLabel ?? country,
    }))
    .sort((left, right) => left.countryLabel.localeCompare(right.countryLabel, locale));
}

function buildDestinationCities(locale: LocaleCode): DestinationCity[] {
  const citiesById = new Map<string, NonNullable<ReturnType<typeof getPagePayload>>[]>();

  for (const page of pagePayloads) {
    const localizedPage = getPagePayload(page.slug, locale);

    if (!localizedPage) {
      continue;
    }

    const cityPages = citiesById.get(localizedPage.cityId) ?? [];
    cityPages.push(localizedPage);
    citiesById.set(localizedPage.cityId, cityPages);
  }

  return Array.from(citiesById.values())
    .map((pages) => {
      const sortedPages = [...pages].sort(
        (left, right) =>
          monthOrder.indexOf(left.month as (typeof monthOrder)[number]) -
          monthOrder.indexOf(right.month as (typeof monthOrder)[number]),
      );
      const samplePage = sortedPages[0];
      const months = sortedPages.map((page) => ({
        href: buildLocalizedPagePath(page, locale),
        label: formatMonthLabel(page.month, locale),
        month: page.month,
        score: page.score,
      }));
      const bestMonth = [...months].sort((left, right) => right.score - left.score)[0];

      return {
        bestMonth,
        cityName: getLocalizedDisplayCityName(samplePage, locale),
        citySlug: getCanonicalCitySlug(samplePage.citySlug, samplePage.cityName),
        country: samplePage.country,
        countryLabel: formatCountryName(samplePage.country, locale),
        months,
      };
    })
    .sort((left, right) =>
      `${left.countryLabel} ${left.cityName}`.localeCompare(
        `${right.countryLabel} ${right.cityName}`,
        locale,
      ),
    );
}
