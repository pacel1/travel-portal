import {
  getPagePayload,
  getPagesForCity,
  monthOrder,
} from "@/lib/catalog";
import {
  formatCountryName,
  formatMonthLabel,
  formatScoreLabel,
} from "@/lib/formatting";
import { defaultLocale, type LocaleCode } from "@/lib/i18n";
import {
  buildCityPagePath,
  buildCityMonthAnchorPath,
  getLocalizedDisplayCityName,
  resolveCityPageRoute,
} from "@/lib/page-routing";
import { getTiqetsCityId } from "@/lib/tiqets";
import { getCityEditorial } from "@/data/curated/city-editorial";
import type {
  CrowdLevel,
  PointOfInterest,
  PriceLevel,
} from "@/types/travel";

export type CityMonthEntry = {
  month: string;
  monthLabel: string;
  score: number;
  scoreLabel: string;
  href: string;
  climate: {
    avgTempDay: number;
    avgTempNight: number;
    rainfallMm: number;
    rainyDays: number;
    humidity: number;
    sunshineHours: number;
  };
  crowdLevel: CrowdLevel;
  priceLevel: PriceLevel;
  topAttraction: PointOfInterest | null;
};

export type CitySuperlative = {
  key:
    | "best"
    | "warmest"
    | "coolest"
    | "sunniest"
    | "driest"
    | "leastCrowded"
    | "cheapest";
  month: string;
  monthLabel: string;
  value: string;
  href: string;
};

export type SimilarCityLink = {
  cityId: string;
  cityName: string;
  href: string;
  score: number;
  countryLabel: string;
};

export type CityAggregate = {
  cityId: string;
  cityName: string;
  citySlug: string;
  country: string;
  countryLabel: string;
  canonicalPath: string;
  representativeSlug: string;
  editorial?: string;
  months: CityMonthEntry[];
  bestMonths: CityMonthEntry[];
  superlatives: CitySuperlative[];
  climateRange: {
    minTempDay: number;
    maxTempDay: number;
    maxSunshine: number;
    totalRainfall: number;
  };
  attractions: PointOfInterest[];
  similarCities: SimilarCityLink[];
  tiqetsCityId: string | null;
};

function roundToOne(value: number) {
  return Math.round(value * 10) / 10;
}

// Guards against blank or garbled POI names (e.g. "", "-") that would render
// as empty attraction cards. Requires at least two letters.
function isUsablePoiName(name: string | undefined): name is string {
  if (!name) {
    return false;
  }
  const letters = name.replace(/[^\p{L}]/gu, "");
  return letters.length >= 2;
}

export function getCityAggregate(
  citySlug: string,
  locale: LocaleCode = defaultLocale,
): CityAggregate | undefined {
  const pages = getPagesForCity(citySlug, locale);

  if (!pages.length) {
    return undefined;
  }

  const representative = pages[0];
  const cityName = getLocalizedDisplayCityName(representative, locale);
  const canonicalPath = buildCityPagePath(representative, locale);

  const months: CityMonthEntry[] = pages
    .map((page) => ({
      month: page.month,
      monthLabel: formatMonthLabel(page.month, locale),
      score: page.score,
      scoreLabel: formatScoreLabel(page.score, locale),
      href: buildCityMonthAnchorPath(page, locale),
      climate: page.climate,
      crowdLevel: page.travelSignals.crowdLevel,
      priceLevel: page.travelSignals.priceLevel,
      topAttraction:
        [...page.attractions.outdoor, ...page.attractions.indoor][0] ?? null,
    }))
    .sort(
      (left, right) =>
        monthOrder.indexOf(left.month as (typeof monthOrder)[number]) -
        monthOrder.indexOf(right.month as (typeof monthOrder)[number]),
    );

  const bestMonths = [...months]
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  const superlatives = buildSuperlatives(months, locale);
  const climateRange = {
    minTempDay: roundToOne(Math.min(...months.map((m) => m.climate.avgTempDay))),
    maxTempDay: roundToOne(Math.max(...months.map((m) => m.climate.avgTempDay))),
    maxSunshine: roundToOne(Math.max(...months.map((m) => m.climate.sunshineHours))),
    totalRainfall: Math.round(months.reduce((total, m) => total + m.climate.rainfallMm, 0)),
  };

  return {
    cityId: representative.cityId,
    cityName,
    citySlug: representative.citySlug,
    country: representative.country,
    countryLabel: formatCountryName(representative.country, locale),
    canonicalPath,
    representativeSlug: representative.slug,
    editorial: getCityEditorial(representative.citySlug, locale),
    months,
    bestMonths,
    superlatives,
    climateRange,
    attractions: buildCityAttractions(citySlug, locale),
    similarCities: buildSimilarCities(citySlug, locale, representative.cityId),
    tiqetsCityId: getTiqetsCityId(representative.cityId, representative.cityName),
  };
}

function buildSuperlatives(
  months: CityMonthEntry[],
  locale: LocaleCode,
): CitySuperlative[] {
  const best = [...months].sort((a, b) => b.score - a.score)[0];
  const warmest = [...months].sort((a, b) => b.climate.avgTempDay - a.climate.avgTempDay)[0];
  const sunniest = [...months].sort((a, b) => b.climate.sunshineHours - a.climate.sunshineHours)[0];
  const driest = [...months].sort((a, b) => a.climate.rainfallMm - b.climate.rainfallMm)[0];

  const crowdRank: Record<CrowdLevel, number> = { low: 0, medium: 1, high: 2 };
  const priceRank: Record<PriceLevel, number> = { low: 0, medium: 1, high: 2 };
  const leastCrowded = [...months].sort(
    (a, b) => crowdRank[a.crowdLevel] - crowdRank[b.crowdLevel] || b.score - a.score,
  )[0];
  const cheapest = [...months].sort(
    (a, b) => priceRank[a.priceLevel] - priceRank[b.priceLevel] || b.score - a.score,
  )[0];

  const labels =
    locale === "pl"
      ? {
          best: "Najlepszy ogólnie",
          warmest: "Najcieplej",
          sunniest: "Najwięcej słońca",
          driest: "Najmniej deszczu",
          leastCrowded: "Najmniej tłumów",
          cheapest: "Najtaniej",
        }
      : {
          best: "Best overall",
          warmest: "Warmest",
          sunniest: "Most sunshine",
          driest: "Driest",
          leastCrowded: "Fewest crowds",
          cheapest: "Cheapest",
        };

  return [
    superlative("best", best, labels.best, `${best.score} TripTimi`),
    superlative("warmest", warmest, labels.warmest, `${roundToOne(warmest.climate.avgTempDay)}°C`),
    superlative("sunniest", sunniest, labels.sunniest, `${roundToOne(sunniest.climate.sunshineHours)}h`),
    superlative("driest", driest, labels.driest, `${Math.round(driest.climate.rainfallMm)} mm`),
    superlative("leastCrowded", leastCrowded, labels.leastCrowded, leastCrowded.monthLabel),
    superlative("cheapest", cheapest, labels.cheapest, cheapest.monthLabel),
  ];
}

function superlative(
  key: CitySuperlative["key"],
  entry: CityMonthEntry,
  label: string,
  value: string,
): CitySuperlative {
  return {
    key,
    month: entry.month,
    monthLabel: entry.monthLabel,
    value: `${label}: ${value}`,
    href: entry.href,
  };
}

function buildCityAttractions(
  citySlug: string,
  locale: LocaleCode,
): PointOfInterest[] {
  const pages = getPagesForCity(citySlug, locale);
  const byId = new Map<string, PointOfInterest>();

  for (const page of pages) {
    for (const poi of [...page.attractions.outdoor, ...page.attractions.indoor]) {
      if (!byId.has(poi.id) && isUsablePoiName(poi.name)) {
        byId.set(poi.id, poi);
      }
    }
  }

  return Array.from(byId.values())
    .sort((left, right) => {
      const imageDelta = Number(Boolean(right.image)) - Number(Boolean(left.image));
      if (imageDelta !== 0) {
        return imageDelta;
      }
      return right.popularityScore - left.popularityScore;
    })
    .slice(0, 8);
}

function buildSimilarCities(
  citySlug: string,
  locale: LocaleCode,
  selfCityId: string,
): SimilarCityLink[] {
  const pages = getPagesForCity(citySlug, locale);
  const byCity = new Map<string, SimilarCityLink>();

  for (const page of pages) {
    for (const link of page.internalLinks.similarCities) {
      const target = getPagePayload(link.slug, locale);

      if (!target || target.cityId === selfCityId) {
        continue;
      }

      const existing = byCity.get(target.cityId);

      if (!existing || link.score > existing.score) {
        byCity.set(target.cityId, {
          cityId: target.cityId,
          cityName: getLocalizedDisplayCityName(target, locale),
          href: buildCityPagePath(target, locale),
          score: link.score,
          countryLabel: formatCountryName(target.country, locale),
        });
      }
    }
  }

  return Array.from(byCity.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

export function resolveCityAggregate(
  routeSlug: string,
  locale: LocaleCode = defaultLocale,
): CityAggregate | undefined {
  const representative = resolveCityPageRoute(routeSlug, locale);

  if (!representative) {
    return undefined;
  }

  return getCityAggregate(representative.citySlug, locale);
}
