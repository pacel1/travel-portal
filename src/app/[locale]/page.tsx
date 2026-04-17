import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import {
  CalendarDays,
  CloudRain,
  CloudSun,
  Droplets,
  Moon,
  SunMedium,
  ThermometerSnowflake,
  ThermometerSun,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { buildHomeMetadata, LocalizedHomePage } from "@/components/localized-home-page";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getPagePayload,
  getPagesForCity,
} from "@/lib/catalog";
import {
  formatCityMonthLabel,
  formatCountryName,
  formatCrowdLevel,
  formatDaysLabel,
  formatMonthLabel,
  formatPoiCategory,
  getPolishMonthPreposition,
  formatPriceLevel,
  formatScoreLabel,
} from "@/lib/formatting";
import {
  buildHomePath,
  defaultLocale,
  isPublishedLocale,
  publishedPrefixedLocales,
  type LocaleCode,
} from "@/lib/i18n";
import {
  buildLocalizedPagePath,
  getLocalizedDisplayCityName,
  getLocalizedStaticSlugs,
  getPublishedLanguageAlternatesForPage,
  resolvePageRoute,
} from "@/lib/page-routing";
import {
  buildCityMonthSeoDescription,
  buildCityMonthSeoTitle,
} from "@/lib/seo-snippets";
import type { PagePayload, PointOfInterest } from "@/types/travel";
import {
  getScoreTicketToneClass,
  MiniTripTimiScoreTicket,
  TripTimiScoreTicket,
} from "@/components/triptimi-score-ticket";
import { FlightSearchWidget } from "@/components/flight-search-widget";
import { ToursActivitiesWidget } from "@/components/tours-activities-widget";

type TravelPagePayload = PagePayload;
type PageIntentTier = "strong" | "balanced" | "selective";
type PageIntentProfile = {
  tier: PageIntentTier;
  wetMonth: boolean;
  budgetMonth: boolean;
  quietMonth: boolean;
  priceyMonth: boolean;
  indoorMonth: boolean;
  outdoorMonth: boolean;
};

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

const monthSequence = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export function generateStaticParams() {
  const englishSlugs = getLocalizedStaticSlugs(defaultLocale).map((slug) => ({ locale: slug }));
  const publishedLocaleSlugs = publishedPrefixedLocales.map((locale) => ({ locale }));
  return [...englishSlugs, ...publishedLocaleSlugs];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: primarySegment } = await params;

  if (isPublishedLocale(primarySegment)) {
    return buildHomeMetadata(primarySegment);
  }

  return buildTravelMonthMetadata(primarySegment, defaultLocale);
}

export default async function TravelMonthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: primarySegment } = await params;

  if (isPublishedLocale(primarySegment)) {
    await connection();
    return <LocalizedHomePage locale={primarySegment} />;
  }

  return renderTravelMonthPage(primarySegment, defaultLocale);
}

export function buildTravelMonthMetadata(
  slug: string,
  locale: LocaleCode = defaultLocale,
): Metadata {
  const resolvedRoute = resolvePageRoute(slug, locale);

  if (!resolvedRoute) {
    return {
      title: "Page not found",
    };
  }

  const { page } = resolvedRoute;
  const localizedPage = applyClimateSanityGuard(getPagePayload(page.slug, locale) ?? page);
  const cityName = getLocalizedDisplayCityName(localizedPage, locale);
  const title = buildSeoTitle(localizedPage, cityName, locale);
  const description = buildSeoDescription(localizedPage, cityName, locale);
  const canonicalPath = buildLocalizedPagePath(localizedPage, locale);

  return {
    title,
    description,
    robots: "index, follow",
    openGraph: {
      title,
      description,
      type: "website",
      url: buildAbsoluteUrl(canonicalPath),
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
      title,
      description,
      card: "summary",
      images: ["/triptimiscore.png"],
    },
    alternates: {
      canonical: buildAbsoluteUrl(canonicalPath),
      languages: buildAbsoluteLanguageAlternates(localizedPage),
    },
  };
}

export function renderTravelMonthPage(
  slug: string,
  locale: LocaleCode = defaultLocale,
) {
  const resolvedRoute = resolvePageRoute(slug, locale);
  const dictionary = getDictionary(locale);
  const copy = dictionary.page;

  if (!resolvedRoute) {
    notFound();
  }

  const { page: basePage, canonicalSlug } = resolvedRoute;
  const page = applyClimateSanityGuard(getPagePayload(basePage.slug, locale) ?? basePage);

  if (slug !== canonicalSlug) {
    permanentRedirect(buildLocalizedPagePath(page, locale));
  }

  const cityName = getLocalizedDisplayCityName(page, locale);
  const allMonthsForCity = getPagesForCity(page.citySlug, locale);
  const similarCityLinks = page.internalLinks.similarCities
    .map((link) => {
      const targetPage = getPagePayload(link.slug, locale);

      if (!targetPage) {
        return null;
      }

      return {
        ...link,
        href: buildLocalizedPagePath(targetPage, locale),
        label: buildLocalizedPageLabel(targetPage, locale),
      };
    })
    .filter(isPresent);
  const travelerFit = page.editorial?.bestFor?.length
    ? page.editorial.bestFor
    : getTravelerFit(page, locale);
  const reasonsToGo = page.verdict.pros?.length
    ? page.verdict.pros
    : getReasonsToGo(page, locale);
  const reasonsToConsider = page.verdict.cons?.length
    ? page.verdict.cons
    : getReasonsToConsider(page, locale);
  const practicalTips = getPracticalTips(page, locale);
  const monthRead = page.editorial?.monthRead || getMonthRead(page, locale);
  const bookingRead = page.editorial?.bookingRead || getBookingRead(page, locale);
  const heroHighlights = [
    {
      label: copy.crowds,
      value: formatCrowdLevel(page.travelSignals.crowdLevel, locale),
      tone: signalTone[page.travelSignals.crowdLevel],
      icon: UsersRound,
    },
    {
      label: copy.priceLevel,
      value: formatPriceLevel(page.travelSignals.priceLevel, locale),
      tone: priceTone[page.travelSignals.priceLevel],
      icon: WalletCards,
    },
    {
      label: copy.weatherTable.sunshine,
      value: `${page.climate.sunshineHours}h`,
      tone: "bg-white text-[var(--foreground)]",
      icon: SunMedium,
    },
  ];
  const heroFeaturedAttraction = [
    ...page.attractions.outdoor.slice(0, 2),
    ...page.attractions.indoor.slice(0, 1),
  ][0] ?? null;
  const monthIndex = monthSequence.indexOf(page.month as (typeof monthSequence)[number]);
  const previousMonth = monthIndex >= 0 ? monthSequence[(monthIndex + 11) % 12] : null;
  const nextMonth = monthIndex >= 0 ? monthSequence[(monthIndex + 1) % 12] : null;
  const previousMonthPage = previousMonth
    ? allMonthsForCity.find((monthPage) => monthPage.month === previousMonth)
    : null;
  const nextMonthPage = nextMonth
    ? allMonthsForCity.find((monthPage) => monthPage.month === nextMonth)
    : null;
  const faqItems = buildMiniFaqItems(page, cityName, locale);
  const similarCitiesDescription = getSimilarCitiesDescription(page, locale);
  const bestForTitle = getBestForSectionTitle(page, locale);
  const decisionSectionTitle = getDecisionSectionTitle(page, locale);
  const strengthsTitle = getStrengthsBlockTitle(page, locale);
  const tradeoffsTitle = getTradeoffsBlockTitle(page, locale);
  const monthComparisonTitle = getMonthComparisonTitle(page, cityName, locale);
  const similarCitiesTitle = getSimilarCitiesTitle(page, locale);
  const structuredData = buildTravelMonthStructuredData(
    page,
    cityName,
    locale,
    dictionary.site.name,
    faqItems,
  );

  return (
    <main className="pb-20 pt-4 sm:pb-28 sm:pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="shell space-y-7 sm:space-y-8">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] sm:text-sm sm:normal-case sm:tracking-normal">
          <Link href={buildHomePath(locale)} className="hover:text-[var(--foreground)]">
            <Image
              src="/logotriptimi.png"
              alt={dictionary.site.name}
              width={957}
              height={356}
              className="h-6 w-auto"
              sizes="100px"
            />
          </Link>
          <span>/</span>
          <span>
            {formatCityMonthLabel(cityName, page.month, locale)}
          </span>
        </nav>

        <section className="showcase-hero rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7 lg:min-h-[calc(100vh-8.5rem)] lg:px-8 lg:py-6">
          <div className="mx-auto max-w-[76rem] lg:grid lg:h-full lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:gap-6 lg:items-center">
            <div className="lg:flex lg:h-full lg:flex-col lg:justify-center">
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                <span className="showcase-pill rounded-full px-3.5 py-2 text-sm font-semibold">
                  {formatCountryName(page.country, locale)}
                </span>
                <span className="showcase-pill rounded-full px-3.5 py-2 text-sm font-semibold">
                  {copy.travelScore} {page.score}
                </span>
                <span className="showcase-pill rounded-full px-3.5 py-2 text-sm font-semibold">
                  {formatScoreLabel(page.score, locale)}
                </span>
              </div>

              <div className="mt-5 text-center lg:mt-6 lg:text-left">
                <p className="eyebrow text-[var(--accent)]">{copy.eyebrow}</p>
                <h1 className="mx-auto mt-3 max-w-4xl text-[2.15rem] font-semibold tracking-[-0.045em] text-[var(--foreground)] sm:text-[3.4rem] sm:leading-[0.96] lg:mx-0 lg:max-w-3xl lg:text-[4.1rem]">
                  {cityName}
                  <span className="mt-1 block text-[var(--accent-deep)]">
                    {getMonthLeadIn(locale)} {formatMonthLabel(page.month, locale, locale === "pl" ? "afterPreposition" : "standalone")}
                  </span>
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-[0.96rem] leading-6 text-[var(--muted)] sm:text-[1.02rem] sm:leading-7 lg:mx-0 lg:max-w-xl">
                  {page.summary}
                </p>
              </div>

              <div className="hero-action-row mt-5 justify-center lg:justify-start">
                <a
                  href="#plan"
                  className="hero-action hero-action-primary"
                  aria-label={copy.buildTripCta}
                >
                  <span className="hero-action-label !text-white/72">{getActionChipLabel("start", locale)}</span>
                  <span className="hero-action-value !text-white">{copy.buildTripCta}</span>
                </a>
                {previousMonthPage ? (
                  <Link
                    href={buildLocalizedPagePath(previousMonthPage, locale)}
                    className="hero-action hero-action-secondary"
                    aria-label={`${copy.earlierMonthCta} ${formatMonthLabel(previousMonthPage.month, locale)}`}
                  >
                    <span className="hero-action-label">{getActionChipLabel("earlier", locale)}</span>
                    <span className="hero-action-value">
                      {formatMonthLabel(previousMonthPage.month, locale)}
                    </span>
                  </Link>
                ) : null}
                {nextMonthPage ? (
                  <Link
                    href={buildLocalizedPagePath(nextMonthPage, locale)}
                    className="hero-action hero-action-secondary"
                    aria-label={`${copy.laterMonthCta} ${formatMonthLabel(nextMonthPage.month, locale)}`}
                  >
                    <span className="hero-action-label">{getActionChipLabel("later", locale)}</span>
                    <span className="hero-action-value">
                      {formatMonthLabel(nextMonthPage.month, locale)}
                    </span>
                  </Link>
                ) : null}
              </div>

              <div className="hero-highlight-row mt-5">
                {heroHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="showcase-stat rounded-[1.3rem] px-4 py-3 text-center lg:text-left"
                  >
                    <div className="metric-title-row justify-center lg:justify-start">
                      <MetricIcon icon={item.icon} />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {item.label}
                      </p>
                    </div>
                    <div className="mt-2 flex justify-center lg:justify-start">
                      <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${item.tone}`}>
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            <div className="mt-5 grid gap-3 lg:mt-0 lg:grid-rows-[auto_auto] lg:self-center">
              <div className="showcase-score score-spotlight rounded-[1.5rem] p-4 sm:p-5">
                <div className="score-spotlight-grid">
                  <div className="score-spotlight-ticket">
                    <TripTimiScoreTicket
                      label={formatScoreLabel(page.score, locale)}
                      locale={locale}
                      score={page.score}
                    />
                  </div>

                  <div className="score-verdict-panel">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                      {locale === "pl" ? "Werdykt" : "Month read"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {getVerdictIntro(page, locale, cityName)}
                    </p>
                  </div>
                </div>
              </div>

              {heroFeaturedAttraction ? (
                <div className="showcase-attraction rounded-[1.35rem] px-4 py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {heroFeaturedAttraction.indoor
                      ? copy.attractionPanels.indoorTitle
                      : copy.attractionPanels.outdoorTitle}
                  </p>
                  <div
                    className={`mt-3 grid gap-3 ${
                      heroFeaturedAttraction.image
                        ? "sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center"
                        : ""
                    }`}
                  >
                    {heroFeaturedAttraction.image ? (
                      <div className="overflow-hidden rounded-[0.95rem] border border-[var(--border)] bg-[var(--surface)]">
                        <Image
                          src={
                            heroFeaturedAttraction.image.thumbUrl ||
                            heroFeaturedAttraction.image.imageUrl
                          }
                          alt={heroFeaturedAttraction.name}
                          width={heroFeaturedAttraction.image.width || 640}
                          height={heroFeaturedAttraction.image.height || 480}
                          className="h-20 w-full object-cover"
                          sizes="(min-width: 640px) 112px, 100vw"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] sm:text-[1rem]">
                        {heroFeaturedAttraction.name}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {formatPoiCategory(heroFeaturedAttraction.category, locale)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <FlightSearchWidget destination={cityName} locale={locale} />

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
          <div className="grid gap-5">
            <article className="apple-panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
              <div className="min-h-[4.8rem]">
                <p className="eyebrow text-[var(--accent)]">{copy.bestForEyebrow}</p>
                <h2 className="mt-3 max-w-[18rem] text-[1.8rem] font-semibold tracking-tight sm:text-[2.15rem]">
                  {bestForTitle}
                </h2>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {travelerFit.map((item) => (
                  <div
                    key={item}
                    className="apple-soft-card rounded-[1.45rem] px-4 py-4"
                  >
                    <p className="text-sm leading-6 text-[var(--muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="apple-panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
              <div className="min-h-[4.8rem]">
                <p className="eyebrow text-[var(--accent)]">{copy.travelPulse}</p>
                <h2 className="mt-3 max-w-[18rem] text-[1.8rem] font-semibold tracking-tight sm:text-[2.15rem]">
                  {decisionSectionTitle}
                </h2>
              </div>
              <div className="mt-6 grid gap-3">
                <SignalRow
                  label={copy.crowds}
                  value={formatCrowdLevel(page.travelSignals.crowdLevel, locale)}
                  className={signalTone[page.travelSignals.crowdLevel]}
                  icon={UsersRound}
                />
                <SignalRow
                  label={copy.priceLevel}
                  value={formatPriceLevel(page.travelSignals.priceLevel, locale)}
                  className={priceTone[page.travelSignals.priceLevel]}
                  icon={WalletCards}
                />
                <SignalRow
                  label={copy.nightTemp}
                  value={`${page.climate.avgTempNight}C`}
                  className="bg-slate-100 text-slate-800"
                  icon={Moon}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <VerdictBlock title={strengthsTitle} tone="good" items={reasonsToGo} />
                <VerdictBlock
                  title={tradeoffsTitle}
                  tone="mixed"
                  items={reasonsToConsider}
                />
              </div>
            </article>
          </div>

          <article className="apple-panel h-full rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
            <div className="min-h-[4.8rem]">
              <p className="eyebrow text-[var(--accent)]">{copy.snapshotEyebrow}</p>
              <h2 className="mt-3 max-w-[18rem] text-[1.8rem] font-semibold tracking-tight sm:text-[2.15rem]">
                {copy.snapshotTitle}
              </h2>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white">
              <table className="compact-table w-full text-left text-sm">
                <tbody>
                  <WeatherRow
                    label={copy.weatherTable.avgDay}
                    value={`${page.climate.avgTempDay}C`}
                    icon={ThermometerSun}
                  />
                  <WeatherRow
                    label={copy.weatherTable.avgNight}
                    value={`${page.climate.avgTempNight}C`}
                    icon={ThermometerSnowflake}
                  />
                  <WeatherRow
                    label={copy.weatherTable.rainfall}
                    value={`${page.climate.rainfallMm} mm`}
                    icon={CloudRain}
                  />
                  <WeatherRow
                    label={copy.weatherTable.rainyDays}
                    value={`${page.climate.rainyDays} ${formatDaysLabel(page.climate.rainyDays, locale)}`}
                    icon={CalendarDays}
                  />
                  <WeatherRow
                    label={copy.weatherTable.humidity}
                    value={`${page.climate.humidity}%`}
                    icon={Droplets}
                  />
                  <WeatherRow
                    label={copy.weatherTable.sunshine}
                    value={`${page.climate.sunshineHours} h`}
                    icon={CloudSun}
                  />
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3">
              <InfoMiniCard title={copy.monthFeelsTitle} description={monthRead} />
              <InfoMiniCard title={copy.bookingReadTitle} description={bookingRead} />
            </div>
          </article>
        </section>

        <section>
          <article className="apple-panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7" id="plan">
            <p className="eyebrow text-[var(--accent)]">{copy.whatToDoEyebrow}</p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">
              {copy.whatToDoTitle}
            </h2>

            <div className="mt-6">
              <ToursActivitiesWidget locale={locale} />
            </div>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <article className="apple-panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
            <p className="eyebrow text-[var(--accent)]">{copy.howToDoEyebrow}</p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">
              {copy.howToDoTitle}
            </h2>

            <div className="mt-6 grid gap-3">
              {page.recommendations.map((item, index) => (
                <div
                  key={item}
                  className="apple-soft-card rounded-[1.45rem] px-4 py-4"
                >
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] font-mono text-sm font-semibold text-white">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{copy.planCue}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="soft-divider mt-6 pt-6">
              <p className="text-sm font-semibold">{copy.practicalTipsTitle}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {practicalTips.map((tip) => (
                  <div
                    key={tip}
                    className="apple-soft-card rounded-[1.35rem] px-4 py-4 text-sm leading-6 text-[var(--muted)]"
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="apple-panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-[var(--accent)]">{copy.keepExploringEyebrow}</p>
                <h2 className="mt-3 text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">
                  {monthComparisonTitle}
                </h2>
              </div>
              <Link
                href={`/api/page-cache/${page.slug}`}
                className="text-sm font-semibold text-[var(--accent)]"
              >
                {copy.viewJsonPayload}
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {allMonthsForCity.map((monthPage) => (
                <Link
                  key={monthPage.slug}
                  href={buildLocalizedPagePath(monthPage, locale)}
                  className={`month-pick-card lift ${getScoreTicketToneClass(monthPage.score)} ${
                    monthPage.slug === page.slug
                      ? "month-pick-card-active"
                      : ""
                  }`}
                >
                  <span className="month-pick-title">
                    {formatMonthLabel(monthPage.month, locale)}
                  </span>
                  <span className="score-ticket-label month-pick-label">
                    {formatScoreLabel(monthPage.score, locale)}
                  </span>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="apple-panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
          <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="eyebrow text-[var(--accent)]">{copy.broadenSessionEyebrow}</p>
              <h2 className="mt-3 text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">
                {similarCitiesTitle}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
                {similarCitiesDescription}
              </p>
            </div>

            <div className="grid gap-3">
              {similarCityLinks.map((link) => (
                <Link
                  key={link.slug}
                  href={link.href}
                  className="apple-soft-card lift rounded-[1.45rem] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base font-semibold">{link.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {getSimilarCityCardDescription(page, link.score, locale)}
                      </p>
                    </div>
                    <MiniTripTimiScoreTicket
                      label={formatScoreLabel(link.score, locale)}
                      locale={locale}
                      score={link.score}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="apple-panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
          <p className="eyebrow text-[var(--accent)]">{getFaqEyebrow(locale)}</p>
          <h2 className="mt-3 text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">
            {getFaqTitle(cityName, locale)}
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="apple-soft-card rounded-[1.45rem] px-4 py-4"
              >
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function applyClimateSanityGuard(page: TravelPagePayload): TravelPagePayload {
  if (page.climate.rainyDays >= 12 && page.climate.rainfallMm < 5) {
    return {
      ...page,
      climate: {
        ...page.climate,
        rainfallMm: Math.round(page.climate.rainyDays * 12) / 10,
      },
    };
  }

  return page;
}

function getPageIntentProfile(page: TravelPagePayload): PageIntentProfile {
  const wetMonth = page.climate.rainfallMm >= 70 || page.climate.rainyDays >= 10;
  const budgetMonth = page.travelSignals.priceLevel === "low";
  const quietMonth = page.travelSignals.crowdLevel === "low";
  const priceyMonth = page.travelSignals.priceLevel === "high";
  const indoorMonth =
    page.attractions.indoor.length >= page.attractions.outdoor.length ||
    wetMonth ||
    page.climate.avgTempDay <= 10;
  const outdoorMonth =
    page.attractions.outdoor.length > page.attractions.indoor.length &&
    page.climate.avgTempDay >= 18 &&
    page.climate.rainyDays <= 7;

  return {
    tier: page.score >= 80 ? "strong" : page.score >= 65 ? "balanced" : "selective",
    wetMonth,
    budgetMonth,
    quietMonth,
    priceyMonth,
    indoorMonth,
    outdoorMonth,
  };
}

function getBestForSectionTitle(page: TravelPagePayload, locale: LocaleCode) {
  const profile = getPageIntentProfile(page);

  if (locale === "pl") {
    if (profile.tier === "strong") {
      return "Komu ten miesiąc sprzyja najbardziej";
    }

    if (profile.tier === "balanced") {
      return "Komu ten miesiąc może dobrze zadziałać";
    }

    return "Komu ten miesiąc nadal może pasować";
  }

  if (profile.tier === "strong") {
    return "Who this month suits best";
  }

  if (profile.tier === "balanced") {
    return "Who this month can work well for";
  }

  return "Who this month can still work for";
}

function getDecisionSectionTitle(page: TravelPagePayload, locale: LocaleCode) {
  const profile = getPageIntentProfile(page);

  if (locale === "pl") {
    if (profile.tier === "strong") {
      return "Dlaczego ten miesiąc łatwo obronić";
    }

    if (profile.tier === "balanced") {
      return "Czy warto brać go pod uwagę?";
    }

    return "Kiedy ten miesiąc nadal ma sens";
  }

  if (profile.tier === "strong") {
    return "Why this month is easy to say yes to";
  }

  if (profile.tier === "balanced") {
    return "Should you shortlist it?";
  }

  return "When this month can still make sense";
}

function getStrengthsBlockTitle(page: TravelPagePayload, locale: LocaleCode) {
  return getPageIntentProfile(page).tier === "selective"
    ? locale === "pl"
      ? "Co nadal działa"
      : "What Still Works"
    : locale === "pl"
      ? "Co przemawia za"
      : "What Works Well";
}

function getTradeoffsBlockTitle(page: TravelPagePayload, locale: LocaleCode) {
  return getPageIntentProfile(page).tier === "selective"
    ? locale === "pl"
      ? "Co najczęściej przeszkadza"
      : "What Usually Gets in the Way"
    : locale === "pl"
      ? "Co wymaga planu"
      : "What Needs Planning";
}

function getMonthComparisonTitle(
  page: TravelPagePayload,
  cityName: string,
  locale: LocaleCode,
) {
  if (getPageIntentProfile(page).tier === "selective") {
    return locale === "pl"
      ? `Lepsze miesiące w ${cityName}`
      : `Better months in ${cityName}`;
  }

  return locale === "pl"
    ? `Porównaj inne miesiące w ${cityName}`
    : `Compare other months in ${cityName}`;
}

function getSimilarCitiesTitle(page: TravelPagePayload, locale: LocaleCode) {
  const monthLabel = formatMonthLabel(page.month, locale);
  const profile = getPageIntentProfile(page);

  if (profile.tier === "selective") {
    return locale === "pl"
      ? `Lepsze miasta na ${monthLabel}`
      : `Better cities for ${monthLabel}`;
  }

  return locale === "pl"
    ? `Podobne miasta warte sprawdzenia na ${monthLabel}`
    : `Similar cities worth checking for ${monthLabel}`;
}

function buildSeoTitle(
  page: TravelPagePayload,
  cityName: string,
  locale: LocaleCode,
) {
  const pageLabel =
    locale === "en"
      ? `${cityName} in ${formatMonthLabel(page.month, locale)}`
      : formatCityMonthLabel(cityName, page.month, locale);

  return buildCityMonthSeoTitle(pageLabel, locale === "pl" ? "pl" : "en");
}

function buildSeoDescription(
  page: TravelPagePayload,
  cityName: string,
  locale: LocaleCode,
) {
  const pageLabel =
    locale === "en"
      ? `${cityName} in ${formatMonthLabel(page.month, locale)}`
      : formatCityMonthLabel(cityName, page.month, locale);
  return buildCityMonthSeoDescription({
    avgTempDay: page.climate.avgTempDay,
    crowdLevel: page.travelSignals.crowdLevel,
    locale: locale === "pl" ? "pl" : "en",
    pageLabel,
    priceLevel: page.travelSignals.priceLevel,
    rainyDays: page.climate.rainyDays,
    sunshineHours: page.climate.sunshineHours,
  });
}

/* eslint-disable @typescript-eslint/no-unused-vars */
function getSeoTitleAngle(page: TravelPagePayload, locale: LocaleCode) {
  const profile = getPageIntentProfile(page);

  if (locale === "pl") {
    if (profile.tier === "strong") {
      return "Czy to dobry moment? Pogoda i wskaz\u00f3wki";
    }

    if (profile.tier === "balanced") {
      if (profile.quietMonth) {
        return "Czy warto jecha\u0107? Pogoda i spokojniejsze zwiedzanie";
      }

      if (profile.budgetMonth) {
        return "Czy warto jecha\u0107? Pogoda i koszty";
      }

      return "Czy warto jecha\u0107? Pogoda i wskaz\u00f3wki";
    }

    if (profile.budgetMonth) {
      return "Na ta\u0144szy city break? Pogoda i minusy";
    }

    if (profile.quietMonth) {
      return "Na spokojniejszy wyjazd? Pogoda i minusy";
    }

    if (profile.indoorMonth) {
      return "Na muzea i plan pod dach? Pogoda i minusy";
    }

    return "Czy warto mimo minus\u00f3w? Pogoda i wskaz\u00f3wki";
  }

  if (profile.tier === "strong") {
    return "Best Time to Visit? Weather & Tips";
  }

  if (profile.tier === "balanced") {
    if (profile.quietMonth) {
      return "Worth Visiting for Lower Crowds? Weather & Tips";
    }

    if (profile.budgetMonth) {
      return "Worth Visiting for Better Value? Weather & Tips";
    }

    return "Is It Worth Visiting? Weather & Tips";
  }

  if (profile.budgetMonth) {
    return "Good for a Cheaper Trip? Weather & Tradeoffs";
  }

  if (profile.quietMonth) {
    return "Better for Lower Crowds? Weather & Tradeoffs";
  }

  if (profile.indoorMonth) {
    return "Good for Museums? Weather & Tradeoffs";
  }

  return "Worth It Anyway? Weather & Tradeoffs";
}

function getSeoCrowdPhrase(page: TravelPagePayload, locale: LocaleCode) {
  if (locale === "pl") {
    return page.travelSignals.crowdLevel === "low"
      ? "ma\u0142y ruch"
      : page.travelSignals.crowdLevel === "high"
        ? "du\u017cy ruch"
        : "umiarkowany ruch";
  }

  return page.travelSignals.crowdLevel === "low"
    ? "lower crowds"
    : page.travelSignals.crowdLevel === "high"
      ? "high crowds"
      : "medium crowds";
}

function getSeoAttractionPhrase(page: TravelPagePayload, locale: LocaleCode) {
  const outdoorCount = page.attractions.outdoor.length;
  const indoorCount = page.attractions.indoor.length;

  if (locale === "pl") {
    if (indoorCount > outdoorCount) {
      return "mocniejszy plan pod dach";
    }

    if (outdoorCount > indoorCount) {
      return "du\u017co dobrych punkt\u00f3w na zewn\u0105trz";
    }

    return "dobry miks atrakcji na zewn\u0105trz i w \u015brodku";
  }

  if (indoorCount > outdoorCount) {
    return "a stronger indoor sightseeing mix";
  }

  if (outdoorCount > indoorCount) {
    return "plenty of worthwhile outdoor stops";
  }

  return "a strong mix of indoor and outdoor sights";
}

function getSeoDecisionHint(page: TravelPagePayload, locale: LocaleCode) {
  const profile = getPageIntentProfile(page);

  if (locale === "pl") {
    if (profile.tier === "strong") {
      return "Sprawd\u017a, dlaczego to jeden z mocniejszych miesi\u0119cy na wyjazd.";
    }

    if (profile.tier === "selective" && profile.budgetMonth) {
      return "To mo\u017ce by\u0107 lepszy wyb\u00f3r dla bud\u017cetu ni\u017c dla idealnej pogody.";
    }

    if (profile.tier === "selective" && profile.quietMonth) {
      return "Mocniej broni si\u0119 spokojniejszym rytmem ni\u017c poczt\u00f3wkowymi warunkami.";
    }

    if (profile.tier === "selective" && profile.indoorMonth) {
      return "Najlepiej wypada przy planie muzealnym i elastycznych oknach na spacery.";
    }

    if (profile.wetMonth) {
      return "Najlepiej wypada przy elastycznym planie i mocnych punktach pod dachem.";
    }

    if (page.travelSignals.crowdLevel === "low") {
      return "Dobry wyb\u00f3r, je\u015bli chcesz spokojniejszego zwiedzania i mniej kolejek.";
    }

    if (page.travelSignals.priceLevel === "high") {
      return "Zobacz plusy i minusy, zanim zarezerwujesz dro\u017cszy termin.";
    }

    if (page.travelSignals.priceLevel === "low") {
      return "Mo\u017ce szczeg\u00f3lnie dobrze zadzia\u0142a\u0107 przy wyje\u017adzie z my\u015bl\u0105 o bud\u017cecie.";
    }

    return "Sprawd\u017a g\u0142\u00f3wne plusy, ograniczenia i najlepsze pomys\u0142y na plan.";
  }

  if (profile.tier === "strong") {
    return "See why this is one of the stronger months to go.";
  }

  if (profile.tier === "selective" && profile.budgetMonth) {
    return "Could still work well if better value matters more than ideal weather.";
  }

  if (profile.tier === "selective" && profile.quietMonth) {
    return "This one sells calmer sightseeing more than broad peak-season appeal.";
  }

  if (profile.tier === "selective" && profile.indoorMonth) {
    return "Best for museum-led days with flexible walking gaps.";
  }

  if (profile.wetMonth) {
    return "Best with a flexible plan and some indoor backup.";
  }

  if (page.travelSignals.crowdLevel === "low") {
    return "A strong pick if you want quieter sightseeing.";
  }

  if (page.travelSignals.priceLevel === "high") {
    return "Check the tradeoffs before you book a pricier stretch.";
  }

  if (page.travelSignals.priceLevel === "low") {
    return "Could be a better fit than peak months if budget matters.";
  }

  return "See the main upsides, tradeoffs, and best things to do.";
}

function trimSeoDescription(description: string, maxLength = 158) {
  const normalized = description.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(" ");

  return `${(lastSpace > 90 ? truncated.slice(0, lastSpace) : truncated).trim()}…`;
}

/* eslint-enable @typescript-eslint/no-unused-vars */
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

function buildAbsoluteLanguageAlternates(page: TravelPagePayload) {
  return Object.fromEntries(
    Object.entries(getPublishedLanguageAlternatesForPage(page)).map(([locale, href]) => [
      locale,
      buildAbsoluteUrl(href),
    ]),
  );
}

function buildTravelMonthStructuredData(
  page: TravelPagePayload,
  cityName: string,
  locale: LocaleCode,
  siteName: string,
  faqItems: Array<{ question: string; answer: string }>,
) {
  const canonicalPath = buildLocalizedPagePath(page, locale);
  const canonicalUrl = buildAbsoluteUrl(canonicalPath);
  const pageLabel = formatCityMonthLabel(cityName, page.month, locale);
  const description = buildSeoDescription(page, cityName, locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: buildSeoTitle(page, cityName, locale),
        description,
        isPartOf: {
          "@type": "WebSite",
          name: siteName,
          url: buildAbsoluteUrl(buildHomePath(locale)),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteName,
            item: buildAbsoluteUrl(buildHomePath(locale)),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: cityName,
            item: buildAbsoluteUrl(`${buildHomePath(locale)}#${page.citySlug}`),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: pageLabel,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "Dataset",
        name: `${pageLabel} travel dataset`,
        description,
        variableMeasured: [
          {
            "@type": "PropertyValue",
            name: "temperature",
            value: page.climate.avgTempDay,
            unitText: "C",
          },
          {
            "@type": "PropertyValue",
            name: "rainfall",
            value: page.climate.rainfallMm,
            unitText: "mm",
          },
          {
            "@type": "PropertyValue",
            name: "crowd_level",
            value: page.travelSignals.crowdLevel,
          },
          {
            "@type": "PropertyValue",
            name: "price_level",
            value: page.travelSignals.priceLevel,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}

function buildMiniFaqItems(
  page: TravelPagePayload,
  cityName: string,
  locale: LocaleCode,
) {
  const cityMonth = formatCityMonthLabel(cityName, page.month, locale);
  const weatherSummary = getWeatherSummary(page, locale);
  const packAdvice = getPackingAdvice(page, locale);
  const monthLabel = formatMonthLabel(page.month, locale, "afterPreposition");
  const profile = getPageIntentProfile(page);
  const scenarioFaq = getScenarioFaqItem(page, cityName, locale);

  if (locale === "pl") {
    return [
      {
        question: `Czy ${cityMonth} to dobry czas na wyjazd?`,
        answer:
          profile.tier === "strong"
            ? "Tak, to jeden z mocniejszych miesi\u0119cy, zw\u0142aszcza je\u015bli chcesz zwiedza\u0107 bez zbyt wielu kompromis\u00f3w."
            : profile.tier === "balanced"
              ? "To dobry kandydat na city break, ale najlepiej wypada wtedy, gdy styl wyjazdu pasuje do pogody, t\u0142um\u00f3w i cen."
              : "To bardziej wyb\u00f3r sytuacyjny ni\u017c oczywisty faworyt, wi\u0119c warto patrze\u0107 na kompromisy i to, komu ten miesi\u0105c realnie pasuje.",
      },
      {
        question: `Jaka jest pogoda w ${cityName} ${getPolishMonthPreposition(monthLabel)} ${monthLabel}?`,
        answer: weatherSummary,
      },
      {
        question: "Co spakowa\u0107?",
        answer: packAdvice,
      },
      scenarioFaq,
    ];
  }

  return [
    {
      question: `Is ${cityName} in ${formatMonthLabel(page.month, locale)} a good time to visit?`,
      answer:
        profile.tier === "strong"
          ? "Yes. This is one of the easier months to say yes to if you want a broadly comfortable city break."
          : profile.tier === "balanced"
            ? "Usually yes, as long as the weather, pace, and trip style line up with what you want from the visit."
            : "Sometimes, but it is more of a selective pick than an all-purpose recommendation.",
    },
    {
      question: `What is the weather like in ${cityName} in ${formatMonthLabel(page.month, locale)}?`,
      answer: weatherSummary,
    },
    {
      question: "What should I pack?",
      answer: packAdvice,
    },
    scenarioFaq,
  ];
}

function getWeatherSummary(page: TravelPagePayload, locale: LocaleCode) {
  if (locale === "pl") {
    return `W dzie\u0144 jest zwykle oko\u0142o ${formatTemperature(page.climate.avgTempDay)}, noc\u0105 oko\u0142o ${formatTemperature(page.climate.avgTempNight)}, z opadami na poziomie ${page.climate.rainfallMm} mm i oko\u0142o ${page.climate.rainyDays} deszczowymi dniami.`;
  }

  return `Expect around ${formatTemperature(page.climate.avgTempDay)} by day and ${formatTemperature(page.climate.avgTempNight)} at night, with ${page.climate.rainfallMm} mm of rain across roughly ${page.climate.rainyDays} rainy days.`;
}

function getPackingAdvice(page: TravelPagePayload, locale: LocaleCode) {
  const wetMonth = page.climate.rainfallMm >= 70 || page.climate.rainyDays >= 10;

  if (locale === "pl") {
    if (page.climate.avgTempDay <= 10) {
      return wetMonth
        ? "We\u017a warstwy, lekk\u0105 kurtk\u0119 przeciwdeszczow\u0105 i buty, kt\u00f3re dobrze znosz\u0105 mokre chodniki."
        : "We\u017a cieplejsze warstwy, wygodne buty i co\u015b na ch\u0142odniejsze poranki oraz wieczory.";
    }

    if (page.climate.avgTempDay >= 24) {
      return wetMonth
        ? "Spakuj lekkie ubrania, co\u015b od deszczu i wygodne buty na wilgotne, ciep\u0142e dni."
        : "Spakuj lekkie ubrania, okulary przeciws\u0142oneczne i wygodne buty na d\u0142u\u017csze spacery.";
    }

    return wetMonth
      ? "Najlepiej sprawdz\u0105 si\u0119 warstwy, lekka ochrona przed deszczem i wygodne buty."
      : "Wystarcz\u0105 warstwy, wygodne buty i jedna cieplejsza rzecz na wiecz\u00f3r.";
  }

  if (page.climate.avgTempDay <= 10) {
    return wetMonth
      ? "Pack warm layers, a light rain jacket, and shoes that handle wet pavements well."
      : "Pack warmer layers, comfortable shoes, and something for colder mornings and evenings.";
  }

  if (page.climate.avgTempDay >= 24) {
    return wetMonth
      ? "Pack light clothing, rain protection, and comfortable shoes for warm but damp days."
      : "Pack light clothing, sunglasses, and comfortable shoes for longer walking days.";
  }

  return wetMonth
    ? "Layers, light rain protection, and comfortable shoes are the safest combination."
    : "Bring layers, comfortable shoes, and one warmer piece for evenings.";
}

function getFaqEyebrow(locale: LocaleCode) {
  return locale === "pl" ? "Szybkie odpowiedzi" : "Quick answers";
}

function getFaqTitle(cityName: string, locale: LocaleCode) {
  return locale === "pl" ? `FAQ przed wyjazdem do ${cityName}` : `${cityName} travel FAQ`;
}

function getScenarioFaqItem(
  page: TravelPagePayload,
  cityName: string,
  locale: LocaleCode,
) {
  const cityMonth = formatCityMonthLabel(cityName, page.month, locale);
  const monthLabel = formatMonthLabel(page.month, locale, "afterPreposition");
  const profile = getPageIntentProfile(page);

  if (locale === "pl") {
    if (profile.budgetMonth) {
      return {
        question: `Czy ${cityMonth} ma sens przy wyjeździe z myślą o budżecie?`,
        answer:
          profile.tier === "selective"
            ? "Tak, to często lepszy wybór kosztowo niż pogodowo. Jeśli najważniejsze są niższe ceny i mniejsza presja rezerwacyjna, ten miesiąc może nadal zadziałać."
            : "Często tak, zwłaszcza jeśli chcesz utrzymać koszty noclegów i lotów w ryzach bez schodzenia do martwego sezonu.",
      };
    }

    if (profile.quietMonth) {
      return {
        question: `Czy w ${cityName} ${getPolishMonthPreposition(monthLabel)} ${monthLabel} jest spokojniej?`,
        answer:
          "Zwykle tak. Mniejszy ruch oznacza krótsze kolejki, łatwiejsze tempo dnia i mniej presji, choć nadal warto sprawdzić pogodę i główne kompromisy tego miesiąca.",
      };
    }

    if (profile.indoorMonth || profile.wetMonth) {
      return {
        question: `Czy ${cityMonth} ma sens przy planie pod dach?`,
        answer:
          "Tak, zwłaszcza jeśli budujesz dzień wokół muzeów, kościołów, pałaców albo innych mocnych przystanków w środku i traktujesz spacery bardziej elastycznie.",
      };
    }

    return {
      question: `Czy ${cityMonth} wymaga większej elastyczności?`,
      answer:
        "Najczęściej tak wtedy, gdy pogoda, ceny albo tłumy nie układają się idealnie. Najlepiej zostawić sobie plan A i plan B zamiast opierać cały dzień na jednym scenariuszu.",
    };
  }

  if (profile.budgetMonth) {
    return {
      question: `Is ${cityMonth} good if I care about budget?`,
      answer:
        profile.tier === "selective"
          ? "Often yes. This kind of month can make more sense on value than on perfect conditions, especially if cheaper stays and flights matter more than peak-season polish."
          : "Usually yes, especially if you want lower pressure on stays and flights without dropping into the absolute off-season.",
    };
  }

  if (profile.quietMonth) {
    return {
      question: `Is ${cityName} quieter in ${formatMonthLabel(page.month, locale)}?`,
      answer:
        "Usually yes. Lower crowd pressure often means easier pacing, shorter queues, and less booking stress, even if the month is not the obvious headline favorite.",
    };
  }

  if (profile.indoorMonth || profile.wetMonth) {
    return {
      question: `Does ${cityMonth} work for an indoor-heavy trip?`,
      answer:
        "It can. The month usually works best when museums, churches, galleries, or other covered landmarks carry the core of the day and outdoor time stays flexible.",
    };
  }

  return {
    question: `Does ${cityMonth} need a more flexible plan?`,
    answer:
      "Usually yes when weather, price pressure, or crowd dynamics are less predictable. It works better with one anchor booking and room to adjust the rest of the day.",
  };
}

function getSimilarCitiesDescription(page: TravelPagePayload, locale: LocaleCode) {
  const profile = getPageIntentProfile(page);

  if (locale === "pl") {
    if (profile.tier === "selective") {
      if (profile.budgetMonth) {
        return "Je\u015bli ten miesi\u0105c kusi bardziej kosztem ni\u017c warunkami, por\u00f3wnaj miasta, w kt\u00f3rych w tym samym czasie dostajesz \u0142atwiejszy plan dnia albo lepszy klimat wyjazdu.";
      }

      if (profile.quietMonth) {
        return "Je\u015bli zale\u017cy Ci na spokojniejszym rytmie, sprawd\u017a miasta, kt\u00f3re w tym samym czasie daj\u0105 podobnie ma\u0142y ruch, ale mniej kompromis\u00f3w pogodowych.";
      }

      return "Je\u015bli ten miesi\u0105c w tym mie\u015bcie wygl\u0105da zbyt kompromisowo, por\u00f3wnaj kierunki, kt\u00f3re w tym samym czasie \u0142atwiej broni\u0105 si\u0119 pogod\u0105, rytmem dnia albo kosztem.";
    }

    if (profile.wetMonth) {
      return "Je\u015bli ten miesi\u0105c wygl\u0105da zbyt mokro, por\u00f3wnaj miasta, w kt\u00f3rych \u0142atwiej u\u0142o\u017cy\u0107 dzie\u0144 wok\u00f3\u0142 atrakcji pod dachem.";
    }

    if (profile.quietMonth) {
      return "To dobry punkt odniesienia, je\u015bli szukasz podobnego klimatu, ale nadal chcesz zachowa\u0107 przewag\u0119 mniejszych t\u0142um\u00f3w.";
    }

    if (profile.priceyMonth) {
      return "Sprawd\u017a alternatywy, je\u015bli termin jest dobry, ale ceny nocleg\u00f3w zaczynaj\u0105 wypycha\u0107 bud\u017cet.";
    }

    return "Por\u00f3wnaj podobne kierunki, gdy chcesz utrzyma\u0107 ten sam miesi\u0105c, ale dobra\u0107 lepszy miks pogody, ceny i t\u0142um\u00f3w.";
  }

  if (profile.tier === "selective") {
    if (profile.budgetMonth) {
      return "If this month sells more on price than on ideal conditions, compare cities that give you an easier day plan or a better overall trip feel at the same time.";
    }

    if (profile.quietMonth) {
      return "If calmer sightseeing is the main draw here, compare cities that keep the lighter crowd pressure but ask for fewer weather tradeoffs.";
    }

    return "If this month feels too compromise-heavy in this city, compare places that carry the same time of year with stronger weather, smoother pacing, or better value.";
  }

  if (profile.wetMonth) {
    return "If this month looks too wet, compare cities where indoor anchors and flexible walking windows may work harder for you.";
  }

  if (profile.quietMonth) {
    return "Use these as a benchmark if you want a similar trip feel while keeping the advantage of calmer sightseeing.";
  }

  if (profile.priceyMonth) {
    return "Check alternatives if the timing works but accommodation prices are starting to push the budget.";
  }

  return "Compare nearby options when you want the same month but a slightly better mix of weather, price, and crowd pressure.";
}

function getSimilarCityCardDescription(
  page: TravelPagePayload,
  targetScore: number,
  locale: LocaleCode,
) {
  const scoreDelta = targetScore - page.score;

  if (locale === "pl") {
    if (scoreDelta >= 5) {
      return "Wy\u017cszy wynik sugeruje, \u017ce warto sprawdzi\u0107 ten kierunek przed ostateczn\u0105 decyzj\u0105.";
    }

    if (page.travelSignals.priceLevel === "high") {
      return "Dobra alternatywa, je\u015bli chcesz por\u00f3wna\u0107 ceny i dost\u0119pno\u015b\u0107 bez zmiany miesi\u0105ca.";
    }

    if (page.climate.rainfallMm >= 70 || page.climate.rainyDays >= 10) {
      return "Przydatne por\u00f3wnanie, gdy pogoda wymaga bardziej elastycznego planu.";
    }

    return "Warto zerkn\u0105\u0107, je\u015bli klimat wyjazdu pasuje, ale chcesz mie\u0107 jeszcze jeden punkt odniesienia.";
  }

  if (scoreDelta >= 5) {
    return "A higher score makes this worth checking before you lock the final shortlist.";
  }

  if (page.travelSignals.priceLevel === "high") {
    return "Useful if you want to compare costs and availability without changing the month.";
  }

  if (page.climate.rainfallMm >= 70 || page.climate.rainyDays >= 10) {
    return "A helpful comparison when the weather calls for a more flexible plan.";
  }

  return "Worth a look if the trip style fits but you want one more benchmark.";
}

function formatTemperature(value: number) {
  return `${value}\u00b0C`;
}

function MetricIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="metric-icon" aria-hidden="true">
      <Icon size={16} strokeWidth={2.2} />
    </span>
  );
}

function SignalRow({
  label,
  value,
  className,
  icon,
}: {
  label: string;
  value: string;
  className: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3.5">
      <span className="metric-title-row text-sm text-[var(--muted)]">
        <MetricIcon icon={icon} />
        {label}
      </span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
        {value}
      </span>
    </div>
  );
}

function VerdictBlock({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "good" | "mixed";
  items: string[];
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-[linear-gradient(180deg,#effcf5,#ffffff)] text-emerald-950"
      : "border-rose-200 bg-[linear-gradient(180deg,#fff4f4,#ffffff)] text-rose-950";

  return (
    <div className={`rounded-[1.45rem] border p-4 ${toneClass}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-2.5">
        {items.map((item) => (
          <div key={item} className="rounded-[0.95rem] bg-white/55 px-4 py-3 text-sm leading-6">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoMiniCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="apple-soft-card rounded-[1.4rem] px-4 py-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </div>
  );
}

function AttractionPanel({
  title,
  intro,
  items,
  photoCopy,
  locale,
}: {
  title: string;
  intro: string;
  items: PointOfInterest[];
  photoCopy: ReturnType<typeof getDictionary>["page"];
  locale: LocaleCode;
}) {
  return (
    <div className="apple-soft-card rounded-[1.55rem] px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--muted)]">{intro}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.15rem] border border-[var(--border)] bg-white px-4 py-4"
          >
            <div className="grid gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-start">
              {item.image ? (
                <div className="overflow-hidden rounded-[0.95rem] border border-[var(--border)] bg-[var(--surface)]">
                  <Image
                    src={item.image.thumbUrl || item.image.imageUrl}
                    alt={item.name}
                    width={item.image.width || 640}
                    height={item.image.height || 480}
                    className="h-28 w-full object-cover sm:h-24"
                    sizes="(min-width: 640px) 120px, 100vw"
                  />
                </div>
              ) : null}

              <div className="min-w-0">
                <p className="text-sm font-semibold sm:text-base">{item.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {formatPoiCategory(item.category, locale)}
                </p>
                {item.image ? (
                  <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">
                    {photoCopy.photoCreditPrefix}:{" "}
                    <a
                      href={item.image.sourcePageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[var(--foreground)] underline decoration-[rgba(21,35,45,0.22)] underline-offset-2"
                    >
                      {item.image.author || photoCopy.photoSourceName}
                    </a>
                    {item.image.licenseName ? (
                      <>
                        {" "}
                        · {photoCopy.photoLicenseLabel}{" "}
                        {item.image.licenseUrl ? (
                          <a
                            href={item.image.licenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-[var(--foreground)] underline decoration-[rgba(21,35,45,0.22)] underline-offset-2"
                          >
                            {item.image.licenseName}
                          </a>
                        ) : (
                          item.image.licenseName
                        )}
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherRow({
  icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <th className="px-4 py-4 text-sm font-medium text-[var(--muted)]">
        <span className="metric-title-row">
          <MetricIcon icon={icon} />
          {label}
        </span>
      </th>
      <td className="px-4 py-4 text-right font-mono text-sm font-semibold">{value}</td>
    </tr>
  );
}

function buildLocalizedPageLabel(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  locale: LocaleCode,
) {
  return formatCityMonthLabel(getLocalizedDisplayCityName(page, locale), page.month, locale);
}

function buildBookingPlaceholderHref(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  intent: "hotels" | "flights" | "car-rental",
) {
  const params = new URLSearchParams({
    city: page.citySlug,
    month: page.month,
    intent,
  });

  return `/go/booking?${params.toString()}`;
}

function getBookingAffiliateLinks(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  cityName: string,
  locale: LocaleCode,
  copy: ReturnType<typeof getDictionary>["page"],
) {
  const titles =
    locale === "pl"
      ? {
          hotels: `Sprawdź ceny noclegów: ${cityName}`,
          flights: `Zobacz loty do: ${cityName}`,
          cars: `Porównaj wynajem auta: ${cityName}`,
        }
      : {
          hotels: `${copy.bookingAffiliatePrimaryLabel} ${cityName}`,
          flights: `${copy.bookingAffiliateSecondaryLabel} ${cityName}`,
          cars: `${copy.bookingAffiliateTertiaryLabel} ${cityName}`,
        };

  return [
    {
      href: buildBookingPlaceholderHref(page, "hotels"),
      title: titles.hotels,
      note: copy.bookingAffiliatePrimaryNote,
    },
    {
      href: buildBookingPlaceholderHref(page, "flights"),
      title: titles.flights,
      note: copy.bookingAffiliateSecondaryNote,
    },
    {
      href: buildBookingPlaceholderHref(page, "car-rental"),
      title: titles.cars,
      note:
        page.travelSignals.crowdLevel === "high"
          ? getRentalCarPriorityNote(locale)
          : copy.bookingAffiliateTertiaryNote,
    },
  ];
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

function getTravelerFit(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  locale: LocaleCode,
) {
  const fit = [];

  if (locale === "pl") {
    if (page.score >= 78) {
      fit.push("szukasz miesiąca, który łatwo uznać za mocnego kandydata bez większych kompromisów");
    } else if (page.score >= 65) {
      fit.push("chcesz mocnego city breaku i akceptujesz, że jedna lub dwie rzeczy wymagają planu");
    } else {
      fit.push("wybierasz ostrożnie i nie przeszkadza Ci dopasowanie planu do warunków");
    }

    if (page.climate.avgTempDay >= 20 && page.climate.rainyDays <= 7) {
      fit.push("wolisz długie spacery, punkty widokowe i dzielnice, które najlepiej poznaje się pieszo");
    } else if (page.climate.avgTempDay <= 9 || page.climate.rainyDays >= 9) {
      fit.push("lubisz spokojniejsze dni z muzeami, kawiarniami i mocnymi przystankami pod dachem");
    } else {
      fit.push("szukasz miksu klasycznych atrakcji, wnętrz i elastycznego tempa dnia");
    }

    if (page.travelSignals.priceLevel === "low") {
      fit.push("pilnujesz budżetu i nie chcesz, żeby loty oraz noclegi przejęły cały koszt wyjazdu");
    } else if (page.travelSignals.priceLevel === "high") {
      fit.push("bardziej liczy się dla Ciebie termin i atmosfera niż najniższa możliwa cena");
    } else {
      fit.push("chcesz sensownej relacji jakości do ceny bez czekania wyłącznie na martwy sezon");
    }

    return fit;
  }

  if (page.score >= 78) {
    fit.push("you want a month that is easy to say yes to without too many trade-offs");
  } else if (page.score >= 65) {
    fit.push("you are happy with a strong city break even if one or two factors need planning");
  } else {
    fit.push("you are choosing carefully and do not mind shaping the trip around the conditions");
  }

  if (page.climate.avgTempDay >= 20 && page.climate.rainyDays <= 7) {
    fit.push("you prefer long walking days, outdoor viewpoints, and neighborhoods best seen on foot");
  } else if (page.climate.avgTempDay <= 9 || page.climate.rainyDays >= 9) {
    fit.push("you enjoy slower days with museums, cafes, and indoor anchors between short walks");
  } else {
    fit.push("you like a balanced mix of headline sights, indoor stops, and flexible pacing");
  }

  if (page.travelSignals.priceLevel === "low") {
    fit.push("you are trying to keep flights and hotels from taking over the budget");
  } else if (page.travelSignals.priceLevel === "high") {
    fit.push("you care more about timing and atmosphere than chasing the cheapest month");
  } else {
    fit.push("you are looking for decent value without waiting only for the absolute low season");
  }

  return fit;
}

function getVerdictIntro(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  locale: LocaleCode,
  cityName: string,
) {
  if (page.copyMeta?.source === "openai" && page.verdict.heading) {
    return page.verdict.heading;
  }

  if (locale === "pl") {
    if (page.score >= 78) {
      return `${formatCityMonthLabel(cityName, page.month, locale)} to naturalnie łatwy wybór. Pogoda, tempo i ogólny poziom tarcia układają się tak, że możesz skupić się bardziej na samym dniu niż na ratowaniu planu.`;
    }

    if (page.score >= 65) {
      return `${formatCityMonthLabel(cityName, page.month, locale)} może dać bardzo dobry wyjazd, jeśli styl zwiedzania pasuje do warunków. Mniej chodzi tu o perfekcyjny timing, a bardziej o wykorzystanie tego, co ten miesiąc robi dobrze.`;
    }

    return `${formatCityMonthLabel(cityName, page.month, locale)} to bardziej wybór sytuacyjny niż uniwersalna rekomendacja. Nadal może się sprawdzić, ale głównie wtedy, gdy tempo, pogoda i kompromisy pasują do Twojego stylu podróży.`;
  }

  if (page.score >= 78) {
    return `${formatCityMonthLabel(cityName, page.month, locale)} feels like a naturally easy choice. The weather, pace, and overall friction line up well enough that you can focus more on what to do than on how to rescue the plan.`;
  }

  if (page.score >= 65) {
    return `${formatCityMonthLabel(cityName, page.month, locale)} can be a very good trip when the style of visit matches the conditions. It is less about perfect timing and more about leaning into what the month does well.`;
  }

  return `${formatCityMonthLabel(cityName, page.month, locale)} is more of a selective pick than a universal recommendation. It can still work well, but only if the pace, weather, and trade-offs suit the kind of trip you want.`;
}

function getReasonsToGo(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  locale: LocaleCode,
) {
  const reasons = [];

  if (page.climate.avgTempDay >= 18 && page.climate.avgTempDay <= 26) {
    reasons.push(
      locale === "pl"
        ? "W dzień jest na tyle komfortowo, że można długo chodzić bez ciągłego zarządzania pogodą."
        : "Daytime conditions are comfortable enough for long walks without constant weather management.",
    );
  }

  if (page.climate.rainfallMm <= 60) {
    reasons.push(
      locale === "pl"
        ? "Masz sporą szansę ułożyć główne atrakcje bez ciągłego rozbijania dnia przez deszcz."
        : "You have a good chance of fitting major sights into the day without rain constantly breaking the rhythm.",
    );
  }

  if (page.climate.sunshineHours >= 7) {
    reasons.push(
      locale === "pl"
        ? "Dłuższe jasne godziny pozwalają rozłożyć dzień spokojniej zamiast upychać wszystko w krótkim oknie."
        : "Longer bright hours make it easier to spread the day out instead of cramming everything into a narrow window.",
    );
  }

  if (page.travelSignals.crowdLevel === "low") {
    reasons.push(
      locale === "pl"
        ? "Miasto zwiedza się łatwiej, kiedy kolejki, zatłoczone punkty widokowe i pośpiech rezerwacyjny są mniejszym problemem."
        : "The city is easier to enjoy when queues, packed viewpoints, and rushed bookings are less of a problem.",
    );
  }

  if (page.travelSignals.priceLevel === "low") {
    reasons.push(
      locale === "pl"
        ? "Ten miesiąc zwykle jest łagodniejszy dla budżetu niż terminy, o które wszyscy walczą najbardziej."
        : "This month is usually kinder on the budget than the periods people fight over most.",
    );
  }

  return reasons.slice(0, 3);
}

function getReasonsToConsider(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  locale: LocaleCode,
) {
  const reasons = [];

  if (page.climate.avgTempDay < 10) {
    reasons.push(
      locale === "pl"
        ? "Chłodniejsze dni mogą obniżać przyjemność z długich tras pieszych, jeśli nie podzielisz dobrze dnia."
        : "Cold stretches can make long outdoor routes feel less rewarding unless you break the day up well.",
    );
  }

  if (page.climate.avgTempDay > 29) {
    reasons.push(
      locale === "pl"
        ? "Środek dnia może być męczący, więc trasa potrzebuje więcej cienia, przerw i wolniejszego tempa."
        : "The middle of the day can feel draining, so the route needs more shade, breaks, and slower pacing.",
    );
  }

  if (page.climate.rainfallMm >= 80 || page.climate.rainyDays >= 10) {
    reasons.push(
      locale === "pl"
        ? "To nie jest miesiąc na kruchy plan oparty wyłącznie na plenerze, bo pogoda szybko może wymusić zmiany."
        : "This is not the month to rely on a fragile outdoor-only plan, because the weather can force changes quickly.",
    );
  }

  if (page.travelSignals.crowdLevel === "high") {
    reasons.push(
      locale === "pl"
        ? "Najpopularniejsze atrakcje wymagają większej dyscypliny: wcześniejszych startów i przynajmniej jednej lub dwóch rezerwacji z wyprzedzeniem."
        : "Popular sights need more discipline, with early starts and at least one or two things booked ahead.",
    );
  }

  if (page.travelSignals.priceLevel === "high") {
    reasons.push(
      locale === "pl"
        ? "To może być wciąż dobry wyjazd, ale loty i noclegi w centrum są mniej wybaczające niż w spokojniejszych miesiącach."
        : "The experience may be worth it, but flights and central stays are less forgiving than in calmer months.",
    );
  }

  return reasons.slice(0, 3);
}

function getMonthRead(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  locale: LocaleCode,
) {
  if (locale === "pl") {
    if (page.climate.avgTempDay >= 22 && page.climate.rainyDays <= 6) {
      return "To ten rodzaj miesiąca, w którym miasto potrafi unieść cały dzień na zewnątrz i daje dość komfortu, żeby chodzić bez przesadnego kalkulowania każdej godziny.";
    }

    if (page.climate.avgTempDay <= 9 || page.climate.rainyDays >= 9) {
      return "Ten miesiąc działa najlepiej, gdy potraktujesz miasto jako miks krótszych momentów na zewnątrz i mocnych punktów pod dachem, a nie jeden ciągły spacer.";
    }

    return "Ogólny odbiór jest bardziej elastyczny niż skrajny, więc to dobry miesiąc dla osób, które lubią mieszać główne atrakcje, spokojniejsze posiłki i jeden lub dwa plany awaryjne.";
  }

  if (page.climate.avgTempDay >= 22 && page.climate.rainyDays <= 6) {
    return "This is the kind of month where the city can carry a full day outdoors, with enough comfort to wander without overthinking every hour.";
  }

  if (page.climate.avgTempDay <= 9 || page.climate.rainyDays >= 9) {
    return "The month works best when you treat the city as a mix of short outdoor moments and strong indoor stops, rather than one continuous walk.";
  }

  return "The overall feel is flexible rather than extreme, which makes this month good for travelers who like mixing landmarks, slower meals, and one or two backup options.";
}

function getBookingRead(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  locale: LocaleCode,
) {
  if (locale === "pl") {
    if (page.travelSignals.crowdLevel === "high" && page.travelSignals.priceLevel === "high") {
      return "Warto wcześniej zarezerwować nocleg i najważniejszą atrakcję, bo w takim miesiącu zwlekanie zwykle kończy się gorszą ceną i słabszym wyborem godzin.";
    }

    if (page.travelSignals.crowdLevel === "high") {
      return "Największą różnicę robi tu timing: zarezerwuj jedną lub dwie rzeczy, na których zależy Ci najbardziej, a resztę dnia zostaw bardziej elastyczną.";
    }

    if (page.travelSignals.priceLevel === "high") {
      return "Nocleg ma tu większe znaczenie niż zwykle, więc opłaca się wcześniej porównać dzielnice i zarezerwować najlepszy stosunek ceny do lokalizacji.";
    }

    return "Masz więcej przestrzeni na elastyczność niż w szczycie sezonu, więc zwykle wystarczy zarezerwować tylko najważniejsze punkty i resztę dopasować do pogody.";
  }

  if (page.travelSignals.crowdLevel === "high" && page.travelSignals.priceLevel === "high") {
    return "Book the headline attraction and your stay early, because this is the sort of month where waiting too long usually means worse prices and worse time slots.";
  }

  if (page.travelSignals.crowdLevel === "high") {
    return "The biggest difference-maker here is timing: lock in the one or two places you care about most, then leave the rest of the day loose.";
  }

  if (page.travelSignals.priceLevel === "high") {
    return "Accommodation matters more than usual this month, so it is worth comparing neighborhoods and booking before the best-value options disappear.";
  }

  return "You have more room to stay flexible than in peak periods, so you can usually reserve only the highlights and improvise the rest around the weather.";
}

function getPracticalTips(
  page: NonNullable<ReturnType<typeof getPagePayload>>,
  locale: LocaleCode,
) {
  const tips = [];

  if (page.climate.avgTempDay >= 24) {
    tips.push(
      locale === "pl"
        ? "Najdłuższe odcinki spacerowe planuj rano albo późnym popołudniem, a środek dnia zostaw lżejszy."
        : "Plan the heaviest walking for the morning or late afternoon and keep the middle of the day lighter.",
    );
  } else if (page.climate.avgTempDay <= 8) {
    tips.push(
      locale === "pl"
        ? "Buduj dzień wokół ciepłych przystanków pod dachem, bo wtedy miasto zwiedza się dużo przyjemniej między spacerami."
        : "Build the day around warm indoor stops, because the city is much more enjoyable when you can reset between walks.",
    );
  } else {
    tips.push(
      locale === "pl"
        ? "Ubierz się warstwowo, bo rano i po zachodzie miasto zwykle odczuwa się inaczej niż w środku dnia."
        : "Dress in layers you can take on and off easily, because the city will usually feel different in the morning and after sunset.",
    );
  }

  if (page.climate.rainfallMm >= 70 || page.climate.rainyDays >= 9) {
    tips.push(
      locale === "pl"
        ? "Codziennie zostaw sobie w rezerwie jedno muzeum albo zadaszony punkt, żeby nagła zmiana pogody nie rozsypała planu."
        : "Keep one museum or covered landmark in reserve each day so a sudden weather shift does not ruin the plan.",
    );
  } else {
    tips.push(
      locale === "pl"
        ? "Wygodne buty będą ważniejsze niż dodatkowy sprzęt, bo najlepszą część dnia większość osób spędzi tutaj na nogach."
        : "Comfortable shoes will matter more than extra gear, because most visitors will spend the best parts of the day on foot.",
    );
  }

  if (page.travelSignals.crowdLevel === "high") {
    tips.push(
      locale === "pl"
        ? "Zacznij od najpopularniejszej atrakcji, a resztę trasy zostaw luźniejszą, kiedy dzień się już otworzy."
        : "Start with the most popular sight first, then let the rest of the route get more relaxed as the day opens up.",
    );
  } else if (page.travelSignals.priceLevel === "high") {
    tips.push(
      locale === "pl"
        ? "Jeśli chcesz spać centralnie, porównuj opcje wcześniej, bo najlepsze relacje ceny do lokalizacji znikają szybciej niż drogie miejsca."
        : "If you want to stay central, compare options early, because the nicest-value places disappear before the expensive ones do.",
    );
  } else {
    tips.push(
      locale === "pl"
        ? "Zostaw trochę oddechu w planie, bo to dobry miesiąc, żeby podążać za rytmem miasta zamiast wszystko poganiać."
        : "Leave some breathing room in the itinerary, because this is a good month to follow the mood of the city rather than rushing it.",
    );
  }

  return tips;
}

function getActionChipLabel(action: "start" | "earlier" | "later", locale: LocaleCode) {
  if (locale === "pl") {
    if (action === "start") {
      return "Start";
    }

    return action === "earlier" ? "Poprzedni" : "Następny";
  }

  if (action === "start") {
    return "Start";
  }

  return action === "earlier" ? "Earlier" : "Later";
}

function getMonthLeadIn(locale: LocaleCode) {
  switch (locale) {
    case "de":
      return "im";
    case "es":
    case "fr":
      return "en";
    case "pl":
      return "w";
    case "en":
    default:
      return "in";
  }
}

function getRentalCarPriorityNote(locale: LocaleCode) {
  if (locale === "pl") {
    return "Przydatne, jeśli chcesz łagodniejszego przylotu, łatwiejszych day tripów i mniej tarcia w ruchliwym miesiącu.";
  }

  return "Useful if you want a smoother arrival, easier day trips, or less friction moving around a busy month.";
}
