import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Sun } from "lucide-react";

import { HomeSearch, type HomeSearchCity } from "@/components/home-search";
import { type HomeFeaturedRotatorItem } from "@/components/home-featured-rotator";
import {
  getPagePayload,
  monthOrder,
  pagePayloads,
} from "@/lib/catalog";
import { getScoreTicketToneClass } from "@/components/triptimi-score-ticket";
import {
  formatCountryName,
  formatMonthLabel,
  formatScoreLabel,
} from "@/lib/formatting";
import {
  buildDestinationsPath,
  buildHomePath,
  getLocalizedCanonicalUrl,
  getPublishedLanguageAlternates,
  type LocaleCode,
} from "@/lib/i18n";
import {
  addXDefaultLanguageAlternate,
  buildAbsoluteUrl,
  buildSocialMetadata,
  serializeJsonLd,
} from "@/lib/seo";
import {
  buildCityMonthAnchorPath,
  buildCityPagePath,
  getLocalizedDisplayCityName,
} from "@/lib/page-routing";
import { getCanonicalCitySlug } from "@/lib/slug-utils";

const homeCopy: Record<
  LocaleCode,
  {
    badge: string;
    title: string;
    description: string;
    searchTitle: string;
    searchDescription: string;
    country: string;
    city: string;
    month: string;
    submit: string;
    live: string;
    featuredEyebrow: string;
    featuredTitle: string;
    upcomingEyebrow: string;
    upcomingTitlePrefix: string;
    score: string;
    pages: string;
    cities: string;
    destinations: string;
    open: string;
  }
> = {
  en: {
    badge: "Best time to visit, city by city",
    title: "Find the Best Time to Visit Any European City",
    description:
      "Compare weather, crowds, and prices across all 12 months to choose the right time for your next European city break.",
    searchTitle: "Pick a destination",
    searchDescription: "Choose a city and open its full month-by-month guide.",
    country: "Country",
    city: "City",
    month: "Month",
    submit: "Open city guide",
    live: "Top pick",
    featuredEyebrow: "Top destinations",
    featuredTitle: "Highest-rated cities right now",
    upcomingEyebrow: "Where to go next",
    upcomingTitlePrefix: "Best places to visit in",
    score: "Score",
    pages: "guides",
    cities: "cities",
    destinations: "Destinations",
    open: "Open guide",
  },
  pl: {
    badge: "Najlepszy czas na wyjazd, miasto po mieście",
    title: "Znajdź najlepszy czas na wyjazd do miast w Europie",
    description:
      "Porównaj pogodę, tłumy i ceny dla wszystkich 12 miesięcy, aby wybrać najlepszy termin na kolejny city break w Europie.",
    searchTitle: "Wybierz kierunek",
    searchDescription: "Wybierz miasto i otwórz pełny przewodnik miesiąc po miesiącu.",
    country: "Państwo",
    city: "Miasto",
    month: "Miesiąc",
    submit: "Otwórz przewodnik",
    live: "Top wybór",
    featuredEyebrow: "Najlepsze kierunki",
    featuredTitle: "Najwyżej oceniane miasta",
    upcomingEyebrow: "Dokąd dalej",
    upcomingTitlePrefix: "Najlepsze miasta na",
    score: "Ocena",
    pages: "przewodników",
    cities: "miast",
    destinations: "Kierunki",
    open: "Otwórz przewodnik",
  },
  de: {
    badge: "Reisezeit nach Stadt und Monat",
    title: "Finde den passenden Monat fur deinen Stadttrip.",
    description:
      "Wahle Land, Stadt und Monat. TripTimi verbindet Wetter, Andrang, Preise und Sehenswurdigkeiten zu einem klaren Reisescore.",
    searchTitle: "Starte mit einem Reisefenster",
    searchDescription: "Wahle ein Ziel und offne direkt den passenden One-Page-Guide.",
    country: "Land",
    city: "Stadt",
    month: "Monat",
    submit: "Guide anzeigen",
    live: "Gerade im Fokus",
    featuredEyebrow: "Top-Ziele",
    featuredTitle: "Bestbewertete Stadte",
    upcomingEyebrow: "Wohin als Nachstes",
    upcomingTitlePrefix: "Beste Reiseziele im",
    score: "Score",
    pages: "Guides",
    cities: "Stadte",
    destinations: "Ziele",
    open: "Guide offnen",
  },
  es: {
    badge: "Timing de viaje por ciudad y mes",
    title: "Encuentra el mes adecuado para tu proxima escapada urbana.",
    description:
      "Elige pais, ciudad y mes. TripTimi combina clima, afluencia, precios y atracciones en una puntuacion clara.",
    searchTitle: "Empieza con una ventana de viaje",
    searchDescription: "Elige un destino y abre directamente la guia correspondiente.",
    country: "Pais",
    city: "Ciudad",
    month: "Mes",
    submit: "Ver guia",
    live: "Ahora en rotacion",
    featuredEyebrow: "Mejores destinos",
    featuredTitle: "Ciudades mejor valoradas",
    upcomingEyebrow: "A donde ir despues",
    upcomingTitlePrefix: "Mejores destinos en",
    score: "Score",
    pages: "guias",
    cities: "ciudades",
    destinations: "Destinos",
    open: "Abrir guia",
  },
  fr: {
    badge: "Timing de voyage par ville et mois",
    title: "Trouve le bon mois pour ton prochain city break.",
    description:
      "Choisis un pays, une ville et un mois. TripTimi combine meteo, affluence, prix et attractions dans un score clair.",
    searchTitle: "Commence par une fenetre de voyage",
    searchDescription: "Choisis une destination et ouvre directement le guide correspondant.",
    country: "Pays",
    city: "Ville",
    month: "Mois",
    submit: "Voir le guide",
    live: "En rotation",
    featuredEyebrow: "Meilleures destinations",
    featuredTitle: "Villes les mieux notees",
    upcomingEyebrow: "Ou aller ensuite",
    upcomingTitlePrefix: "Meilleures destinations en",
    score: "Score",
    pages: "guides",
    cities: "villes",
    destinations: "Destinations",
    open: "Ouvrir le guide",
  },
};

function buildAbsoluteLanguageAlternates(pathname: string) {
  const languages = Object.fromEntries(
    Object.entries(getPublishedLanguageAlternates(pathname)).map(([locale, href]) => [
      locale,
      buildAbsoluteUrl(href),
    ]),
  );

  return addXDefaultLanguageAlternate(languages, pathname);
}

export function buildHomeMetadata(locale: LocaleCode): Metadata {
  const copy = homeCopy[locale];
  const canonicalUrl = buildAbsoluteUrl(getLocalizedCanonicalUrl(locale, "/"));

  return {
    title: copy.title,
    description: copy.description,
    robots: "index, follow",
    alternates: {
      canonical: canonicalUrl,
      languages: buildAbsoluteLanguageAlternates("/"),
    },
    ...buildSocialMetadata({
      canonicalPath: getLocalizedCanonicalUrl(locale, "/"),
      title: copy.title,
      description: copy.description,
    }),
  };
}

export function LocalizedHomePage({ locale }: { locale: LocaleCode }) {
  const copy = homeCopy[locale];
  const featuredCards = buildFeaturedCityCards(locale);
  const searchCities = buildHomeSearchCities(locale);
  const upcomingMonth = getUpcomingMonth();
  const upcomingMonthLabel = formatMonthLabel(upcomingMonth, locale);
  const upcomingCards = buildUpcomingRotatorItems(searchCities, upcomingMonth, locale).slice(0, 8);
  const countryCount = new Set(searchCities.map((c) => c.country)).size;

  const canonicalUrl = buildAbsoluteUrl(getLocalizedCanonicalUrl(locale, "/"));
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TripTimi",
    url: canonicalUrl,
    description: copy.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${canonicalUrl}?destination={destination}&month={month}`,
      },
      "query-input": "required name=destination,name=month",
    },
    inLanguage: locale,
  };

  return (
    <main className="home-page pb-16 pt-3 sm:pb-24 sm:pt-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemaData) }}
      />
      <div className="shell-tight space-y-5">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="home-hero home-hero-summer">
          <nav className="home-nav">
            <Link href={buildHomePath(locale)} prefetch={false} aria-label="TripTimi"
              className="inline-flex items-baseline gap-1.5 font-serif text-xl font-medium text-[var(--foreground)]">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--accent)] -translate-y-px" />
              TripTimi
            </Link>
            <div className="home-locale-links" aria-label="Languages">
              <Link href={buildDestinationsPath(locale)} prefetch={false}>
                {copy.destinations}
              </Link>
              <Link href="/" prefetch={false} className={locale === "en" ? "is-active" : ""}>
                EN
              </Link>
              <Link href="/pl" prefetch={false} className={locale === "pl" ? "is-active" : ""}>
                PL
              </Link>
            </div>
          </nav>

          <div className="home-hero-grid">
            <div>
              <p className="home-sun-badge mb-3">
                <Sun size={14} strokeWidth={2.4} aria-hidden="true" />
                <span>{copy.badge}</span>
              </p>
              <h1 className="home-title">{copy.title}</h1>
              <p className="home-lede">{copy.description}</p>
              <ul className="home-stat-row list-none p-0 m-0">
                <li>
                  <strong>{searchCities.length}</strong>
                  <span>{copy.cities}</span>
                </li>
                <li>
                  <strong>12</strong>
                  <span>{locale === "pl" ? "miesięcy" : locale === "de" ? "Monate" : locale === "es" ? "meses" : locale === "fr" ? "mois" : "months"}</span>
                </li>
                <li>
                  <strong>{countryCount}</strong>
                  <span>{locale === "pl" ? "krajów" : locale === "de" ? "Länder" : locale === "es" ? "países" : locale === "fr" ? "pays" : "countries"}</span>
                </li>
              </ul>
            </div>

            <div className="home-search-panel">
              <p className="eyebrow text-[var(--accent)] mb-2">{copy.searchTitle}</p>
              <p className="text-sm leading-relaxed text-[var(--muted)] mb-1">
                {copy.searchDescription}
              </p>
              <HomeSearch
                cities={searchCities}
                labels={{
                  country: copy.country,
                  city: copy.city,
                  submit: copy.submit,
                }}
              />
            </div>
          </div>
        </section>

        {/* ── FEATURED PICKS ───────────────────────────────────── */}
        <section className="home-section">
          <div className="home-section-heading">
            <p className="eyebrow text-[var(--accent)]">{copy.featuredEyebrow}</p>
            <h2>{copy.featuredTitle}</h2>
          </div>
          <div className="city-chip-grid">
            {featuredCards.map((card) => (
              <CityChip key={card.href} card={card} />
            ))}
          </div>
        </section>

        {/* ── UPCOMING MONTH ───────────────────────────────────── */}
        <section className="home-section">
          <div className="home-section-heading">
            <p className="eyebrow text-[var(--accent-warm)]">{copy.upcomingEyebrow}</p>
            <h2>{copy.upcomingTitlePrefix} {upcomingMonthLabel}</h2>
          </div>
          <div className="city-chip-grid">
            {upcomingCards.map((card) => (
              <CityChip key={card.href} card={card} />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

function CityChip({ card }: { card: HomeFeaturedRotatorItem }) {
  return (
    <Link href={card.href} prefetch={false} className="city-chip lift no-underline">
      <span className="min-w-0">
        <span className="city-chip-name">{card.title}</span>
        <span className="city-chip-country">{card.countryLabel}</span>
      </span>
      <span
        className={`score-badge ${getScoreTicketToneClass(card.score)} inline-flex shrink-0 items-baseline rounded-full px-2.5 py-1 text-sm font-serif font-medium`}
      >
        {card.score}
      </span>
    </Link>
  );
}

function buildHomeSearchCities(locale: LocaleCode): HomeSearchCity[] {
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
        href: buildCityMonthAnchorPath(page, locale),
        label: formatMonthLabel(page.month, locale),
        month: page.month,
        score: page.score,
      }));

      return {
        bestScore: Math.max(...months.map((month) => month.score)),
        cityName: getLocalizedDisplayCityName(samplePage, locale),
        citySlug: getCanonicalCitySlug(samplePage.citySlug, samplePage.cityName),
        cityHref: buildCityPagePath(samplePage, locale),
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

function buildUpcomingRotatorItems(
  cities: HomeSearchCity[],
  upcomingMonth: string,
  locale: LocaleCode,
) {
  return cities
    .map((city) => {
      const month = city.months.find((entry) => entry.month === upcomingMonth);

      if (!month) {
        return null;
      }

      return {
        href: month.href,
        countryLabel: `${city.countryLabel} · ${month.label}`,
        title: city.cityName,
        score: month.score,
        scoreLabel: formatScoreLabel(month.score, locale),
      };
    })
    .filter(isPresent)
    .sort((left, right) => right.score - left.score);
}

function buildFeaturedCityCards(locale: LocaleCode): HomeFeaturedRotatorItem[] {
  const bestByCity = new Map<
    string,
    NonNullable<ReturnType<typeof getPagePayload>>
  >();

  for (const page of pagePayloads) {
    const localizedPage = getPagePayload(page.slug, locale);

    if (!localizedPage) {
      continue;
    }

    const existing = bestByCity.get(localizedPage.cityId);

    if (!existing || localizedPage.score > existing.score) {
      bestByCity.set(localizedPage.cityId, localizedPage);
    }
  }

  return Array.from(bestByCity.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map((page) => ({
      href: buildCityPagePath(page, locale),
      countryLabel: formatCountryName(page.country, locale),
      title: getLocalizedDisplayCityName(page, locale),
      score: page.score,
      scoreLabel: formatScoreLabel(page.score, locale),
    }));
}

function buildFeaturedRotatorGroups(items: HomeFeaturedRotatorItem[], groupCount: number) {
  const groups = Array.from({ length: groupCount }, () => [] as HomeFeaturedRotatorItem[]);

  items.forEach((item, index) => {
    groups[index % groupCount].push(item);
  });

  return groups.filter((group) => group.length > 0);
}

function getUpcomingMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    timeZone: "Europe/Warsaw",
  }).formatToParts(new Date());
  const monthPart = parts.find((part) => part.type === "month")?.value;
  const currentMonthIndex = Number(monthPart) - 1;

  return monthOrder[(currentMonthIndex + 1) % monthOrder.length];
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}
