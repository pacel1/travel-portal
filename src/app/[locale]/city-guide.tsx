import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  CalendarRange,
  MapPin,
  Sparkles,
  ThermometerSun,
} from "lucide-react";

import { CityClimateChart } from "@/components/city-climate-chart";
import { EsimWidget } from "@/components/esim-widget";
import { FlightSearchWidget } from "@/components/flight-search-widget";
import { MonthComparisonTable } from "@/components/month-comparison-table";
import { ToursActivitiesWidget } from "@/components/tours-activities-widget";
import {
  getScoreTicketToneClass,
  TripTimiScoreTicket,
} from "@/components/triptimi-score-ticket";
import {
  getCityAggregate,
  resolveCityAggregate,
  type CityAggregate,
  type CityMonthEntry,
} from "@/lib/city-catalog";
import {
  formatCrowdLevel,
  formatDaysLabel,
  formatPoiCategory,
  formatPriceLevel,
  formatScoreLabel,
} from "@/lib/formatting";
import {
  buildDestinationsPath,
  buildHomePath,
  defaultLocale,
  type LocaleCode,
} from "@/lib/i18n";
import {
  buildCityMonthAnchorPath,
  getPublishedLanguageAlternatesForCity,
  getRepresentativeCityPages,
  resolveCityPageRoute,
  resolvePageRoute,
} from "@/lib/page-routing";
import {
  addXDefaultLanguageAlternate,
  buildAbsoluteUrl,
  buildSocialMetadata,
  serializeJsonLd,
} from "@/lib/seo";

type FaqItem = { question: string; answer: string };

// ── Metadata ────────────────────────────────────────────────────────────────

function trim(value: string, max = 158) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }
  const cut = normalized.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 90 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function buildTitle(city: CityAggregate, locale: LocaleCode) {
  return locale === "pl"
    ? `Najlepszy czas na wyjazd do ${city.cityName}: pogoda miesiąc po miesiącu`
    : `Best Time to Visit ${city.cityName}: Weather Month by Month`;
}

function buildDescription(city: CityAggregate, locale: LocaleCode) {
  const bestMonths = city.bestMonths.map((month) => month.monthLabel).join(", ");
  const { minTempDay, maxTempDay } = city.climateRange;

  return trim(
    locale === "pl"
      ? `Najlepszy czas na wyjazd do ${city.cityName} to ${bestMonths}. Porównaj pogodę, temperatury (${minTempDay}–${maxTempDay}°C), ruch i ceny dla wszystkich 12 miesięcy.`
      : `The best time to visit ${city.cityName} is ${bestMonths}. Compare weather, temperatures (${minTempDay}–${maxTempDay}°C), crowds, and prices across all 12 months.`,
  );
}

export function buildCityGuideMetadata(
  routeSlug: string,
  locale: LocaleCode = defaultLocale,
): Metadata {
  const city = resolveCityAggregate(routeSlug, locale);

  if (!city) {
    return { title: "Page not found" };
  }

  const title = buildTitle(city, locale);
  const description = buildDescription(city, locale);
  const representative = getRepresentativeCityPages().find(
    (page) => page.cityId === city.cityId,
  );
  const languages = representative
    ? Object.fromEntries(
        Object.entries(getPublishedLanguageAlternatesForCity(representative)).map(
          ([language, path]) => [language, buildAbsoluteUrl(path)],
        ),
      )
    : {};

  return {
    title,
    description,
    robots: "index, follow",
    ...buildSocialMetadata({ canonicalPath: city.canonicalPath, title, description }),
    alternates: {
      canonical: buildAbsoluteUrl(city.canonicalPath),
      languages: addXDefaultLanguageAlternate(
        languages,
        representative
          ? getPublishedLanguageAlternatesForCity(representative)[defaultLocale]
          : city.canonicalPath,
      ),
    },
  };
}

// ── Content helpers (data-driven, no AI prose) ──────────────────────────────

function buildIntro(city: CityAggregate, locale: LocaleCode) {
  const bestMonths = city.bestMonths.map((month) => month.monthLabel).join(", ");
  const { minTempDay, maxTempDay } = city.climateRange;

  return locale === "pl"
    ? `Najlepszy czas na wyjazd do ${city.cityName} to ${bestMonths}, gdy ocena TripTimi jest najwyższa. W ciągu roku temperatura w dzień waha się od ${minTempDay}°C do ${maxTempDay}°C. Skorzystaj z porównania miesiąc po miesiącu poniżej, aby zestawić pogodę, ruch turystyczny i ceny.`
    : `The best time to visit ${city.cityName} is ${bestMonths}, when the TripTimi score peaks. Across the year, daytime temperatures range from ${minTempDay}°C to ${maxTempDay}°C. Use the month-by-month comparison below to weigh weather, crowds, and prices.`;
}

function buildFaqItems(city: CityAggregate, locale: LocaleCode): FaqItem[] {
  const bestMonths = city.bestMonths.map((m) => m.monthLabel).join(", ");
  const warmest = city.superlatives.find((s) => s.key === "warmest");
  const driest = city.superlatives.find((s) => s.key === "driest");
  const cheapest = city.superlatives.find((s) => s.key === "cheapest");
  const leastCrowded = city.superlatives.find((s) => s.key === "leastCrowded");
  const warmestMonth = city.months.find((m) => m.month === warmest?.month);

  if (locale === "pl") {
    return [
      {
        question: `Kiedy najlepiej jechać do ${city.cityName}?`,
        answer: `Najwyżej oceniane miesiące to ${bestMonths}, gdy pogoda, ruch i ceny są najlepiej zbalansowane według oceny TripTimi.`,
      },
      {
        question: `Który miesiąc jest najcieplejszy w ${city.cityName}?`,
        answer: warmestMonth
          ? `Najcieplej jest w ${warmest?.monthLabel}, z temperaturą w dzień około ${warmestMonth.climate.avgTempDay}°C.`
          : `Najcieplejszy miesiąc to ${warmest?.monthLabel}.`,
      },
      {
        question: `Kiedy ${city.cityName} jest najtańsze?`,
        answer: `Najniższe ceny zwykle wypadają w ${cheapest?.monthLabel}.`,
      },
      {
        question: `Kiedy w ${city.cityName} jest najmniej turystów?`,
        answer: `Najmniejszy ruch turystyczny notujemy w ${leastCrowded?.monthLabel}.`,
      },
      {
        question: `Który miesiąc ma najmniej deszczu w ${city.cityName}?`,
        answer: `Najsuchszy miesiąc to ${driest?.monthLabel}.`,
      },
    ];
  }

  return [
    {
      question: `When is the best time to visit ${city.cityName}?`,
      answer: `The top-rated months are ${bestMonths}, when weather, crowds, and prices are best balanced by the TripTimi score.`,
    },
    {
      question: `What is the warmest month in ${city.cityName}?`,
      answer: warmestMonth
        ? `${warmest?.monthLabel} is the warmest month, with daytime temperatures around ${warmestMonth.climate.avgTempDay}°C.`
        : `${warmest?.monthLabel} is the warmest month.`,
    },
    {
      question: `When is the cheapest time to visit ${city.cityName}?`,
      answer: `Prices are typically lowest in ${cheapest?.monthLabel}.`,
    },
    {
      question: `When is ${city.cityName} least crowded?`,
      answer: `${leastCrowded?.monthLabel} usually sees the fewest visitors.`,
    },
    {
      question: `What is the driest month in ${city.cityName}?`,
      answer: `${driest?.monthLabel} is the driest month of the year.`,
    },
  ];
}

function buildStructuredData(
  city: CityAggregate,
  locale: LocaleCode,
  faqItems: FaqItem[],
) {
  const canonicalUrl = buildAbsoluteUrl(city.canonicalPath);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristDestination",
        "@id": `${canonicalUrl}#destination`,
        name: city.cityName,
        description: buildDescription(city, locale),
        url: canonicalUrl,
        address: {
          "@type": "PostalAddress",
          addressCountry: city.country,
          addressLocality: city.cityName,
        },
        includesAttraction: city.attractions.slice(0, 6).map((poi) => ({
          "@type": "TouristAttraction",
          name: poi.name,
        })),
        isPartOf: {
          "@type": "WebSite",
          name: "TripTimi",
          url: buildAbsoluteUrl(buildHomePath(locale)),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "TripTimi",
            item: buildAbsoluteUrl(buildHomePath(locale)),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: locale === "pl" ? "Kierunki" : "Destinations",
            item: buildAbsoluteUrl(buildDestinationsPath(locale)),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: city.cityName,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}

// ── Section copy ────────────────────────────────────────────────────────────

type SectionCopy = {
  eyebrowBest: string;
  yearGlance: string;
  yearGlanceSub: string;
  bestFor: string;
  compare: string;
  compareSub: string;
  monthByMonth: string;
  attractions: string;
  faq: string;
  planTrip: string;
  crowds: string;
  prices: string;
  sources: string;
  methodology: string;
  findHotels: (city: string) => string;
  accommodation: string;
  search: string;
  similar: string;
};

const sectionCopy: Record<"en" | "pl", SectionCopy> = {
  en: {
    eyebrowBest: "Best time to visit",
    yearGlance: "The year at a glance",
    yearGlanceSub: "Daytime and night temperatures with monthly rainfall, from real Open-Meteo climate averages.",
    bestFor: "Best month for…",
    compare: "Compare every month",
    compareSub: "Tap a month to jump to its full breakdown.",
    monthByMonth: "Month by month",
    attractions: "Top things to do",
    faq: "Frequently asked questions",
    planTrip: "Plan your trip",
    crowds: "Crowds",
    prices: "Prices",
    sources: "Climate: 5-year Open-Meteo averages · Attractions: OpenStreetMap · Photos: Wikimedia Commons.",
    methodology: "How we score",
    findHotels: (city: string) => `Find hotels in ${city}`,
    accommodation: "Accommodation",
    search: "Search",
    similar: "Similar destinations",
  },
  pl: {
    eyebrowBest: "Najlepszy czas na wyjazd",
    yearGlance: "Cały rok na jednym wykresie",
    yearGlanceSub: "Temperatura w dzień i w nocy oraz miesięczne opady — z rzeczywistych średnich klimatycznych Open-Meteo.",
    bestFor: "Najlepszy miesiąc na…",
    compare: "Porównaj wszystkie miesiące",
    compareSub: "Kliknij miesiąc, aby przejść do pełnej analizy.",
    monthByMonth: "Miesiąc po miesiącu",
    attractions: "Co warto zobaczyć",
    faq: "Najczęstsze pytania",
    planTrip: "Zaplanuj wyjazd",
    crowds: "Ruch",
    prices: "Ceny",
    sources: "Klimat: 5-letnie średnie Open-Meteo · Atrakcje: OpenStreetMap · Zdjęcia: Wikimedia Commons.",
    methodology: "Jak liczymy ocenę",
    findHotels: (city: string) => `Znajdź hotele w ${city}`,
    accommodation: "Noclegi",
    search: "Sprawdź",
    similar: "Podobne kierunki",
  },
} as const;

const signalTone = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
} as const;

const priceTone = {
  low: "bg-sky-100 text-sky-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-fuchsia-100 text-fuchsia-800",
} as const;

function MonthSection({
  month,
  city,
  locale,
  copy,
}: {
  month: CityMonthEntry;
  city: CityAggregate;
  locale: LocaleCode;
  copy: SectionCopy;
}) {
  return (
    <article
      id={month.month}
      className="ed-surface scroll-mt-20 rounded-[1.5rem] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-medium text-[var(--foreground)]">
            {city.cityName} · {month.monthLabel}
          </h3>
          <p className="mt-1 font-mono text-xs text-[var(--muted)]">
            {formatScoreLabel(month.score, locale)}
          </p>
        </div>
        <span
          className={`score-badge ${getScoreTicketToneClass(month.score)} inline-flex shrink-0 items-baseline rounded-full px-3 py-1 font-serif text-sm font-medium`}
        >
          {month.score}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            {locale === "pl" ? "Dzień / Noc" : "Day / Night"}
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {month.climate.avgTempDay}° / {month.climate.avgTempNight}°
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            {locale === "pl" ? "Opady" : "Rainfall"}
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {month.climate.rainfallMm} mm · {month.climate.rainyDays}{" "}
            {formatDaysLabel(month.climate.rainyDays, locale)}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            {copy.crowds}
          </dt>
          <dd className="mt-1">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${signalTone[month.crowdLevel]}`}>
              {formatCrowdLevel(month.crowdLevel, locale)}
            </span>
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            {copy.prices}
          </dt>
          <dd className="mt-1">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priceTone[month.priceLevel]}`}>
              {formatPriceLevel(month.priceLevel, locale)}
            </span>
          </dd>
        </div>
      </dl>

      {month.topAttraction ? (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-[var(--muted)]">
          <MapPin size={14} className="shrink-0" />
          <span>
            {month.topAttraction.name}
            <span className="ml-1 font-mono text-xs">
              · {formatPoiCategory(month.topAttraction.category, locale)}
            </span>
          </span>
        </p>
      ) : null}
    </article>
  );
}

// ── Page render ─────────────────────────────────────────────────────────────

export function renderCityGuide(
  routeSlug: string,
  locale: LocaleCode = defaultLocale,
) {
  const city = resolveCityAggregate(routeSlug, locale);

  if (!city) {
    notFound();
  }

  const copy = locale === "pl" ? sectionCopy.pl : sectionCopy.en;
  const intro = buildIntro(city, locale);
  const faqItems = buildFaqItems(city, locale);
  const structuredData = buildStructuredData(city, locale, faqItems);
  const headlineMonth = city.bestMonths[0];

  return (
    <main className="pb-20 pt-4 sm:pb-28 sm:pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />

      <div className="shell space-y-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          <Link href={buildHomePath(locale)} prefetch={false} className="hover:text-[var(--foreground)]">
            TripTimi
          </Link>
          <span>/</span>
          <Link href={buildDestinationsPath(locale)} prefetch={false} className="hover:text-[var(--foreground)]">
            {locale === "pl" ? "Kierunki" : "Destinations"}
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{city.cityName}</span>
        </nav>

        {/* Hero */}
        <header className="border-b border-[var(--border)] pb-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs text-[var(--muted)]">
                <MapPin size={13} />
                {city.countryLabel}
              </p>
              <p className="eyebrow text-[var(--accent)]">{copy.eyebrowBest}</p>
              <h1 className="mt-2 font-serif text-[2.75rem] font-medium leading-[1.04] tracking-[-0.01em] text-[var(--foreground)] sm:text-[3.75rem]">
                {city.cityName}
              </h1>
              <p className="mt-4 max-w-2xl text-[0.98rem] leading-[1.75] text-[var(--muted)]">
                {intro}
              </p>
              {city.editorial ? (
                <p className="mt-4 max-w-2xl border-l-2 border-[var(--accent)] pl-4 text-[0.98rem] leading-[1.75] text-[var(--foreground)]">
                  {city.editorial}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {city.bestMonths.map((month) => (
                  <a
                    key={month.month}
                    href={`#${month.month}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-[var(--foreground)] no-underline transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <Sparkles size={13} />
                    {month.monthLabel}
                  </a>
                ))}
              </div>
            </div>

            {headlineMonth ? (
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <TripTimiScoreTicket
                  label={formatScoreLabel(headlineMonth.score, locale)}
                  locale={locale}
                  score={headlineMonth.score}
                />
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
                  {locale === "pl" ? `szczyt w ${headlineMonth.monthLabel}` : `peaks in ${headlineMonth.monthLabel}`}
                </p>
              </div>
            ) : null}
          </div>
        </header>

        {/* Year at a glance — chart */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <ThermometerSun size={18} className="text-[var(--accent)]" />
            <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] sm:text-[2rem]">
              {copy.yearGlance}
            </h2>
          </div>
          <p className="mb-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">{copy.yearGlanceSub}</p>
          <CityClimateChart months={city.months} locale={locale} />
        </section>

        {/* Best month for… */}
        <section>
          <h2 className="mb-4 font-serif text-[1.7rem] font-medium tracking-[-0.01em] sm:text-[2rem]">
            {copy.bestFor}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {city.superlatives.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="ed-surface lift flex items-center justify-between gap-3 rounded-[1.25rem] p-4 no-underline"
              >
                <span className="text-sm text-[var(--foreground)]">{item.value}</span>
                <span className="shrink-0 font-mono text-xs text-[var(--accent)]">→</span>
              </a>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <CalendarRange size={18} className="text-[var(--accent)]" />
            <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] sm:text-[2rem]">
              {copy.compare}
            </h2>
          </div>
          <p className="mb-4 text-sm leading-6 text-[var(--muted)]">{copy.compareSub}</p>
          <MonthComparisonTable
            months={city.months}
            bestMonths={city.bestMonths}
            locale={locale}
          />
        </section>

        {/* Month by month sections */}
        <section>
          <h2 className="mb-4 font-serif text-[1.7rem] font-medium tracking-[-0.01em] sm:text-[2rem]">
            {copy.monthByMonth}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {city.months.map((month) => (
              <MonthSection
                key={month.month}
                month={month}
                city={city}
                locale={locale}
                copy={copy}
              />
            ))}
          </div>
        </section>

        {/* Attractions */}
        {city.attractions.length ? (
          <section>
            <h2 className="mb-4 font-serif text-[1.7rem] font-medium tracking-[-0.01em] sm:text-[2rem]">
              {copy.attractions}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {city.attractions.map((poi) => (
                <div key={poi.id} className="ed-surface overflow-hidden rounded-[1.25rem]">
                  {poi.image ? (
                    <div className="relative h-32 w-full overflow-hidden border-b border-[var(--border)]">
                      <Image
                        src={poi.image.thumbUrl || poi.image.imageUrl}
                        alt={`${poi.name}, ${city.cityName}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 280px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="p-4">
                    <p className="text-sm font-medium text-[var(--foreground)]">{poi.name}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
                      {formatPoiCategory(poi.category, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Similar destinations */}
        {city.similarCities.length ? (
          <section>
            <h2 className="mb-4 font-serif text-[1.7rem] font-medium tracking-[-0.01em] sm:text-[2rem]">
              {copy.similar}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {city.similarCities.map((similar) => (
                <Link
                  key={similar.cityId}
                  href={similar.href}
                  prefetch={false}
                  className="ed-surface lift flex items-center justify-between gap-3 rounded-[1.25rem] p-4 no-underline"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{similar.cityName}</p>
                    <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">{similar.countryLabel}</p>
                  </div>
                  <span className={`score-badge ${getScoreTicketToneClass(similar.score)} inline-flex shrink-0 items-baseline rounded-full px-2.5 py-1 font-serif text-sm font-medium`}>
                    {similar.score}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* FAQ */}
        <section>
          <h2 className="mb-4 font-serif text-[1.7rem] font-medium tracking-[-0.01em] sm:text-[2rem]">
            {copy.faq}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="ed-surface rounded-[1.25rem] p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Plan your trip — affiliate, below the editorial content */}
        <section className="space-y-4 border-t border-[var(--border)] pt-8">
          <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] sm:text-[2rem]">
            {copy.planTrip}
          </h2>

          <FlightSearchWidget destination={city.cityName} locale={locale} />

          <a
            href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city.cityName)}&lang=${locale === "pl" ? "pl" : "en-gb"}`}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="affiliate-card flex items-center justify-between gap-4 rounded-[1.8rem] px-5 py-4 sm:px-7 sm:py-5"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {copy.accommodation}
              </p>
              <p className="mt-1 text-base font-semibold text-[var(--foreground)]">
                {copy.findHotels(city.cityName)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white">
              {copy.search}
            </span>
          </a>

          {city.tiqetsCityId ? (
            <ToursActivitiesWidget tiqetsCityId={city.tiqetsCityId} />
          ) : null}

          <EsimWidget country={city.country} locale={locale} />
        </section>

        {/* Sources / E-E-A-T */}
        <p className="mx-auto max-w-2xl text-center text-xs leading-6 text-[var(--muted)]">
          {copy.sources}{" "}
          <Link href="/methodology" prefetch={false} className="underline">
            {copy.methodology}
          </Link>
        </p>
      </div>
    </main>
  );
}

// ── Segment dispatch: city guide, or 308 redirect from legacy month slugs ────

export function renderCitySegment(
  routeSlug: string,
  locale: LocaleCode = defaultLocale,
) {
  if (resolveCityPageRoute(routeSlug, locale)) {
    return renderCityGuide(routeSlug, locale);
  }

  const legacyMonthRoute = resolvePageRoute(routeSlug, locale);

  if (legacyMonthRoute) {
    permanentRedirect(buildCityMonthAnchorPath(legacyMonthRoute.page, locale));
  }

  notFound();
}

export function buildCitySegmentMetadata(
  routeSlug: string,
  locale: LocaleCode = defaultLocale,
): Metadata {
  if (resolveCityPageRoute(routeSlug, locale)) {
    return buildCityGuideMetadata(routeSlug, locale);
  }

  return { title: "Redirecting…", robots: "noindex, follow" };
}

// Reference to keep aggregate builder reachable for non-route callers.
export { getCityAggregate };
