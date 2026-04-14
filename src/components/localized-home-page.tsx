import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HomeSearch, type HomeSearchCity } from "@/components/home-search";
import {
  HomeFeaturedRotator,
  type HomeFeaturedRotatorItem,
} from "@/components/home-featured-rotator";
import {
  getFeaturedPages,
  getPagePayload,
  monthOrder,
  pagePayloads,
} from "@/lib/catalog";
import {
  formatCityMonthLabel,
  formatCountryName,
  formatMonthLabel,
  formatScoreLabel,
} from "@/lib/formatting";
import {
  buildHomePath,
  getLocalizedCanonicalUrl,
  getPublishedLanguageAlternates,
  type LocaleCode,
} from "@/lib/i18n";
import {
  buildLocalizedPagePath,
  getLocalizedDisplayCityName,
} from "@/lib/page-routing";

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
    open: string;
  }
> = {
  en: {
    badge: "Trip timing by city and month",
    title: "Find the right month for your next city trip.",
    description:
      "Choose a country, city, and month. TripTimi turns weather, crowds, prices, and attractions into a clear travel score.",
    searchTitle: "Start with a trip window",
    searchDescription: "Pick a destination and jump straight into the matching one-page guide.",
    country: "Country",
    city: "City",
    month: "Month",
    submit: "Show guide",
    live: "Now rotating",
    featuredEyebrow: "Good starting points",
    featuredTitle: "Strong city-month ideas",
    upcomingEyebrow: "Upcoming month",
    upcomingTitlePrefix: "Best city scores for",
    score: "Score",
    pages: "guides",
    cities: "cities",
    open: "Open guide",
  },
  pl: {
    badge: "Timing wyjazdu wedlug miasta i miesiaca",
    title: "Znajdz dobry miesiac na kolejny city break.",
    description:
      "Wybierz panstwo, miasto i miesiac. TripTimi laczy pogode, ruch, ceny i atrakcje w jedna czytelna ocene wyjazdu.",
    searchTitle: "Zacznij od okna wyjazdu",
    searchDescription: "Wybierz kierunek i przejdz od razu do pasujacego onepagera.",
    country: "Panstwo",
    city: "Miasto",
    month: "Miesiac",
    submit: "Pokaz przewodnik",
    live: "Teraz na tapecie",
    featuredEyebrow: "Dobre punkty startu",
    featuredTitle: "Mocne pomysly city + month",
    upcomingEyebrow: "Nadchodzacy miesiac",
    upcomingTitlePrefix: "Najlepsze oceny na",
    score: "Ocena",
    pages: "przewodnikow",
    cities: "miast",
    open: "Otworz przewodnik",
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
    featuredEyebrow: "Gute Startpunkte",
    featuredTitle: "Starke Stadt-Monat-Ideen",
    upcomingEyebrow: "Nachster Monat",
    upcomingTitlePrefix: "Beste Stadt-Scores fur",
    score: "Score",
    pages: "Guides",
    cities: "Stadte",
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
    featuredEyebrow: "Buenos puntos de partida",
    featuredTitle: "Ideas fuertes ciudad + mes",
    upcomingEyebrow: "Proximo mes",
    upcomingTitlePrefix: "Mejores puntuaciones para",
    score: "Score",
    pages: "guias",
    cities: "ciudades",
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
    featuredEyebrow: "Bons points de depart",
    featuredTitle: "Idees fortes ville + mois",
    upcomingEyebrow: "Mois a venir",
    upcomingTitlePrefix: "Meilleurs scores pour",
    score: "Score",
    pages: "guides",
    cities: "villes",
    open: "Ouvrir le guide",
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

function buildAbsoluteLanguageAlternates(pathname: string) {
  return Object.fromEntries(
    Object.entries(getPublishedLanguageAlternates(pathname)).map(([locale, href]) => [
      locale,
      buildAbsoluteUrl(href),
    ]),
  );
}

export function buildHomeMetadata(locale: LocaleCode): Metadata {
  const copy = homeCopy[locale];
  const pathname = buildHomePath(locale);
  const canonicalUrl = buildAbsoluteUrl(getLocalizedCanonicalUrl(locale, "/"));

  return {
    title: copy.title,
    description: copy.description,
    robots: "index, follow",
    alternates: {
      canonical: canonicalUrl,
      languages: buildAbsoluteLanguageAlternates("/"),
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export function LocalizedHomePage({ locale }: { locale: LocaleCode }) {
  const copy = homeCopy[locale];
  const featuredPages = getFeaturedPages(locale).slice(0, 6);
  const rotatorGroups = buildFeaturedRotatorGroups(
    buildFeaturedRotatorItems(featuredPages, locale),
    3,
  );
  const searchCities = buildHomeSearchCities(locale);
  const upcomingMonth = getUpcomingMonth();
  const upcomingMonthLabel = formatMonthLabel(upcomingMonth, locale);
  const upcomingRotatorGroups = buildFeaturedRotatorGroups(
    buildUpcomingRotatorItems(searchCities, upcomingMonth, locale).slice(0, 8),
    3,
  );

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <div className="shell-tight space-y-6">
        <section className="home-hero">
          <nav className="home-nav">
            <Link href={buildHomePath(locale)} aria-label="TripTimi">
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
              <Link href="/" className={locale === "en" ? "is-active" : ""}>
                EN
              </Link>
              <Link href="/pl" className={locale === "pl" ? "is-active" : ""}>
                PL
              </Link>
            </div>
          </nav>

          <div className="home-hero-grid">
            <div>
              <p className="eyebrow text-[var(--accent)]">{copy.badge}</p>
              <h1 className="home-title">{copy.title}</h1>
              <p className="home-lede">{copy.description}</p>
              <div className="home-stat-row">
                <span>
                  <strong>{pagePayloads.length}</strong> {copy.pages}
                </span>
                <span>
                  <strong>{searchCities.length}</strong> {copy.cities}
                </span>
              </div>
            </div>

            <div className="home-search-panel">
              <p className="eyebrow text-[var(--accent)]">{copy.searchTitle}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {copy.searchDescription}
              </p>
              <HomeSearch
                cities={searchCities}
                labels={{
                  country: copy.country,
                  city: copy.city,
                  month: copy.month,
                  submit: copy.submit,
                }}
              />
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-heading">
            <p className="eyebrow text-[var(--accent)]">{copy.featuredEyebrow}</p>
            <h2>{copy.featuredTitle}</h2>
          </div>
          <div className="home-featured-rotator-grid">
            {rotatorGroups.map((items, index) => (
              <HomeFeaturedRotator
                key={`featured-rotator-${index}`}
                items={items}
                compact
                labels={{
                  live: copy.live,
                  open: copy.open,
                }}
              />
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-heading">
            <p className="eyebrow text-[var(--accent)]">{copy.upcomingEyebrow}</p>
            <h2>
              {copy.upcomingTitlePrefix} {upcomingMonthLabel}
            </h2>
          </div>
          <div className="home-featured-rotator-grid">
            {upcomingRotatorGroups.map((items, index) => (
              <HomeFeaturedRotator
                key={`upcoming-rotator-${index}`}
                items={items}
                compact
                labels={{
                  live: copy.live,
                  open: copy.open,
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
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
        href: buildLocalizedPagePath(page, locale),
        label: formatMonthLabel(page.month, locale),
        month: page.month,
        score: page.score,
      }));

      return {
        bestScore: Math.max(...months.map((month) => month.score)),
        cityName: getLocalizedDisplayCityName(samplePage, locale),
        citySlug: samplePage.citySlug,
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
        title: formatCityMonthLabel(city.cityName, month.month, locale),
        score: month.score,
        scoreLabel: formatScoreLabel(month.score, locale),
      };
    })
    .filter(isPresent)
    .sort((left, right) => right.score - left.score);
}

function buildFeaturedRotatorItems(
  pages: ReturnType<typeof getFeaturedPages>,
  locale: LocaleCode,
): HomeFeaturedRotatorItem[] {
  return pages.map((page) => ({
    href: buildLocalizedPagePath(page, locale),
    countryLabel: formatCountryName(page.country, locale),
    title: formatCityMonthLabel(getLocalizedDisplayCityName(page, locale), page.month, locale),
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
