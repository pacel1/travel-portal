import cities from "@/data/raw/cities.json";
import monthlyScores from "@/data/generated/monthly-scores.json";
import pageCache from "@/data/generated/page-cache.json";
import pageCopy from "@/data/generated/page-copy.json";
import poiLocalizations from "@/data/generated/poi-localizations.json";
import type {
  CityRecord,
  MonthlyScoreRecord,
  PagePayload,
} from "@/types/travel";
import { defaultLocale, type LocaleCode } from "./i18n";

export const monthOrder = [
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

export const monthLabel = (month: string) =>
  month.charAt(0).toUpperCase() + month.slice(1);

export const cityRecords = cities as CityRecord[];
export const scoreRecords = monthlyScores as MonthlyScoreRecord[];
export const pagePayloads = pageCache as PagePayload[];
const pageCopyByLocale = pageCopy as Record<
  LocaleCode,
  Record<
    string,
    Pick<PagePayload, "summary" | "verdict" | "recommendations" | "tips" | "editorial" | "copyMeta">
  >
>;
const poiLocalizationsByLocale = poiLocalizations as Record<LocaleCode, Record<string, string>>;

const polishTokenReplacements: Record<string, string> = {
  solidny: "dobry",
  solidna: "dobra",
  solidne: "dobre",
  solidną: "dobrą",
  solidnej: "dobrej",
  solidnym: "dobrym",
  solidnymi: "dobrymi",
  solidnie: "całkiem dobrze",
};

export function getPagePayload(slug: string, locale: LocaleCode = defaultLocale) {
  const page = pagePayloads.find((entry) => entry.slug === slug);
  return page ? localizePagePayload(page, locale) : undefined;
}

export function getPagePayloadByCityMonth(
  citySlug: string,
  month: string,
  locale: LocaleCode = defaultLocale,
) {
  const page = pagePayloads.find((entry) => entry.citySlug === citySlug && entry.month === month);
  return page ? localizePagePayload(page, locale) : undefined;
}

export function getPagesForCity(citySlug: string, locale: LocaleCode = defaultLocale) {
  return pagePayloads
    .filter((page) => page.citySlug === citySlug)
    .sort(
      (left, right) =>
        monthOrder.indexOf(left.month as (typeof monthOrder)[number]) -
        monthOrder.indexOf(right.month as (typeof monthOrder)[number]),
    )
    .map((page) => localizePagePayload(page, locale));
}

export function getTopMonthsForCity(citySlug: string) {
  return scoreRecords
    .filter((record) => record.citySlug === citySlug)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

export function getFeaturedPages(locale: LocaleCode = defaultLocale) {
  return [...pagePayloads]
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((page) => localizePagePayload(page, locale));
}

function localizePagePayload(page: PagePayload, locale: LocaleCode) {
  const localizedPageCopy = pageCopyByLocale[locale]?.[page.slug];
  const localizedPoiNames = poiLocalizationsByLocale[locale] ?? {};
  const localizedPage = {
    ...page,
    attractions: {
      outdoor: page.attractions.outdoor.map((item) => ({
        ...item,
        name: localizedPoiNames[item.id] ?? item.name,
      })),
      indoor: page.attractions.indoor.map((item) => ({
        ...item,
        name: localizedPoiNames[item.id] ?? item.name,
      })),
    },
  };

  if (!localizedPageCopy) {
    return localizedPage;
  }

  const sanitizedPageCopy =
    locale === "pl" ? sanitizeLocalizedValue(localizedPageCopy, locale) : localizedPageCopy;

  return {
    ...localizedPage,
    summary: sanitizedPageCopy.summary ?? localizedPage.summary,
    verdict: sanitizedPageCopy.verdict
      ? {
          ...localizedPage.verdict,
          ...sanitizedPageCopy.verdict,
        }
      : localizedPage.verdict,
    recommendations: sanitizedPageCopy.recommendations ?? localizedPage.recommendations,
    tips: sanitizedPageCopy.tips ?? localizedPage.tips,
    editorial: sanitizedPageCopy.editorial
      ? {
          ...localizedPage.editorial,
          ...sanitizedPageCopy.editorial,
        }
      : localizedPage.editorial,
    copyMeta: sanitizedPageCopy.copyMeta ?? localizedPage.copyMeta,
  };
}

function sanitizeLocalizedValue<T>(value: T, locale: LocaleCode): T {
  if (typeof value === "string") {
    return sanitizeLocalizedString(value, locale) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLocalizedValue(item, locale)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sanitizeLocalizedValue(nestedValue, locale),
      ]),
    ) as T;
  }

  return value;
}

function sanitizeLocalizedString(value: string, locale: LocaleCode) {
  if (locale !== "pl") {
    return value;
  }

  let sanitized = value
    .replace(/wysokie tłumy/gi, "duży ruch")
    .replace(/tłumy są małe/gi, "ruch jest niewielki")
    .replace(/przy landmarkach/gi, "przy najważniejszych zabytkach")
    .replace(/landmarkach/gi, "najważniejszych zabytkach")
    .replace(/landmarkami/gi, "głównymi zabytkami")
    .replace(/landmarków/gi, "głównych zabytków")
    .replace(/landmarki/gi, "główne zabytki")
    .replace(/zabezpieczyć kluczowe noclegi/gi, "zarezerwować nocleg w dobrej lokalizacji")
    .replace(/zabezpieczyć noclegi/gi, "zarezerwować nocleg")
    .replace(/zabezpieczyć nocleg/gi, "zarezerwować nocleg")
    .replace(/zabezpieczyć wejścia/gi, "zarezerwować wejścia")
    .replace(/zabezpieczyć bilety/gi, "zarezerwować bilety")
    .replace(/zabezpieczyć najważniejsze punkty programu/gi, "zaplanować najważniejsze punkty programu")
    .replace(/zabezpieczyć kluczowe muzea/gi, "zarezerwować wejścia do kluczowych muzeów")
    .replace(/zabezpieczyć/gi, "zaplanować")
    .replace(/zablokować/gi, "zarezerwować");

  sanitized = sanitized.replace(/\bsolidn[\p{L}]*/giu, (match) => {
    const replacement = polishTokenReplacements[match.toLowerCase()];

    if (!replacement) {
      return match;
    }

    return match[0] === match[0].toUpperCase()
      ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
      : replacement;
  });

  return sanitized.replace(/\s{2,}/g, " ").trim();
}
