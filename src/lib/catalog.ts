import cities from "@/data/raw/cities.json";
import monthlyScores from "@/data/generated/monthly-scores.json";
import pageCache from "@/data/generated/page-cache.json";
import type {
  CityRecord,
  MonthlyScoreRecord,
  PagePayload,
} from "@/types/travel";

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

export function getPagePayload(slug: string) {
  return pagePayloads.find((page) => page.slug === slug);
}

export function getPagesForCity(citySlug: string) {
  return pagePayloads
    .filter((page) => page.citySlug === citySlug)
    .sort(
      (left, right) =>
        monthOrder.indexOf(left.month as (typeof monthOrder)[number]) -
        monthOrder.indexOf(right.month as (typeof monthOrder)[number]),
    );
}

export function getTopMonthsForCity(citySlug: string) {
  return scoreRecords
    .filter((record) => record.citySlug === citySlug)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

export function getFeaturedPages() {
  return [...pagePayloads]
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}
