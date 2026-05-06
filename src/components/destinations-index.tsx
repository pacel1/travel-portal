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
  type LocaleCode,
} from "@/lib/i18n";
import {
  addXDefaultLanguageAlternate,
  buildAbsoluteUrl,
  buildSocialMetadata,
  serializeJsonLd,
} from "@/lib/seo";
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

export function buildDestinationsMetadata(locale: LocaleCode): Metadata {
  const copy = destinationsCopy[locale];
  const canonicalPath = buildDestinationsPath(locale);

  return {
    title: copy.title,
    description: copy.description,
    robots: "index, follow",
    alternates: {
      canonical: buildAbsoluteUrl(canonicalPath),
      languages: addXDefaultLanguageAlternate(
        {
          en: buildAbsoluteUrl(buildDestinationsPath("en")),
          pl: buildAbsoluteUrl(buildDestinationsPath("pl")),
        },
        buildDestinationsPath("en"),
      ),
    },
    ...buildSocialMetadata({
      canonicalPath,
      title: copy.title,
      description: copy.description,
    }),
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
          __html: serializeJsonLd(schemaData),
        }}
      />
      <div className="shell-tight space-y-6">
        <section className="home-hero">
          <nav className="home-nav">
            <Link href={buildHomePath(locale)} prefetch={false} aria-label="TripTimi">
              <Image
                src="/logotriptimi.png"
                alt="TripTimi travel planning homepage"
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
              <ul className="home-stat-row list-none">
                <li>
                  <strong>{cityCount}</strong> {locale === "pl" ? "miast" : "cities"}
                </li>
                <li>
                  <strong>{pagePayloads.length}</strong>{" "}
                  {locale === "pl" ? "przewodnikow" : "guides"}
                </li>
              </ul>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {locale === "pl"
                  ? "Zacznij od kraju, porownaj dostepne miasta, a potem wybierz miesiac z najlepszym balansem pogody, cen i liczby odwiedzajacych."
                  : "Start with a country, compare the available cities, then choose the month with the best balance of weather, prices, and visitor pressure."}
              </p>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-heading">
            <p className="eyebrow text-[var(--accent)]">
              {locale === "pl" ? "Timing wyjazdu" : "Trip timing notes"}
            </p>
            <h2>
              {locale === "pl"
                ? "Co sprawdzac przed wyborem miesiaca"
                : "What to compare before choosing a month"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {locale === "pl"
                ? "Katalog prowadzi od kraju do miasta i dalej do konkretnego miesiaca, zeby decyzja opierala sie na porownywalnych danych zamiast na jednej ogolnej rekomendacji."
                : "The catalogue moves from country to city and then into a specific month, so the decision is based on comparable signals instead of one generic recommendation."}
            </p>
          </div>
          <ul className="grid gap-3 md:grid-cols-3">
            {getCatalogGuideItems(locale).map((item) => (
              <li className="home-city-card" key={item.title}>
                <h3>{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>

        {countries.map((country) => (
          <section className="home-section" key={country.country}>
            <div className="home-section-heading">
              <p className="eyebrow text-[var(--accent)]">{country.countryLabel}</p>
              <h2>{country.countryLabel}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {getCountryCalendarDescription(country, locale)}
              </p>
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
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {getCityCalendarDescription(city, locale)}
                  </p>
                  <ul className="home-month-list list-none" aria-label={copy.monthGuide}>
                    {city.months.map((month) => (
                      <li key={month.month}>
                        <Link className="home-month-link" href={month.href} prefetch={false}>
                          <span className="home-month-copy">
                            <span className="home-month-label">{month.label}</span>
                          </span>
                          <span className="score-badge home-score-badge-inline">
                            <strong className="score-badge-value">{month.score}</strong>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function getCatalogGuideItems(locale: LocaleCode) {
  if (locale === "pl") {
    return [
      {
        title: "Pogoda i dlugosc dnia",
        description:
          "Sprawdzaj nie tylko srednia temperature, ale tez deszcz, slonce i to, czy plan zwiedzania bedzie wygodny rano, w poludnie oraz wieczorem.",
      },
      {
        title: "Ruch i ceny",
        description:
          "Miesiac z dobrym klimatem moze byc drozszy lub bardziej zatloczony, dlatego TripTimi zestawia pogode z ruchem turystycznym i poziomem cen.",
      },
      {
        title: "Najlepszy nastepny krok",
        description:
          "Po wyborze miasta przejdz do konkretnego miesiaca, zeby zobaczyc werdykt, atuty, kompromisy, praktyczne wskazowki i porownanie z innymi terminami.",
      },
    ];
  }

  return [
    {
      title: "Weather and daylight",
      description:
        "Look beyond average temperature: rain, sunshine, and the shape of the day can decide whether a city works best for outdoor walks, museums, or mixed plans.",
    },
    {
      title: "Crowds and prices",
      description:
        "A month with great weather can still be expensive or busy, so TripTimi weighs travel comfort together with crowd pressure and typical price level.",
    },
    {
      title: "Best next step",
      description:
        "After choosing a city, open a specific month guide to see the verdict, strengths, trade-offs, practical tips, and comparisons with nearby dates, then shortlist the dates that best match your pace.",
    },
  ];
}

function getCityCalendarDescription(city: DestinationCity, locale: LocaleCode) {
  const scores = city.months.map((month) => month.score);
  const scoreRange = `${Math.min(...scores)}-${Math.max(...scores)}`;

  if (locale === "pl") {
    return `Porownaj wszystkie miesiace dla ${city.cityName}: oceny TripTimi w tym kalendarzu ida od ${scoreRange}, wiec latwiej wybrac termin pod pogode, ruch i budzet.`;
  }

  return `Compare every month for ${city.cityName}: TripTimi scores in this calendar run from ${scoreRange}, making it easier to choose by weather, crowds, and budget.`;
}

function getCountryCalendarDescription(
  country: { countryLabel: string; cities: DestinationCity[] },
  locale: LocaleCode,
) {
  const cityNames = country.cities
    .slice(0, 3)
    .map((city) => city.cityName)
    .join(", ");

  if (locale === "pl") {
    return `${country.countryLabel}: porownaj ${country.cities.length} miast, w tym ${cityNames}, i wejdz w miesieczne przewodniki z pogoda, ruchem, cenami oraz ocena TripTimi. Ten katalog pomaga szybko odroznic miesiace mocne od terminow bardziej kompromisowych, zanim przejdziesz do konkretnego planu city breaku.`;
  }

  return `${country.countryLabel}: compare ${country.cities.length} cities, including ${cityNames}, then open monthly guides with weather, crowds, prices, and the TripTimi score. This catalogue helps separate strong months from more compromise-heavy dates before you move into a specific city-break plan, especially when you are choosing between nearby cities with very different seasonal patterns.`;
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
