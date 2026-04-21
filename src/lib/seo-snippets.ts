import type { CrowdLevel, PriceLevel } from "../types/travel";

type SupportedSeoLocale = "en" | "pl";

type CityMonthSeoInput = {
  avgTempDay: number;
  crowdLevel: CrowdLevel;
  locale: SupportedSeoLocale;
  pageLabel: string;
  priceLevel: PriceLevel;
  rainfallMm: number;
  rainyDays: number;
  sunshineHours: number;
};

function formatSeoTemperature(temp: number) {
  const rounded = Number.isInteger(temp) ? temp.toFixed(0) : temp.toFixed(1);
  return `${rounded}\u00B0C`;
}

function trimSeoDescription(description: string, maxLength = 158) {
  const normalized = description.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(" ");

  return `${(lastSpace > 90 ? truncated.slice(0, lastSpace) : truncated).trim()}...`;
}

function formatSeoRainfall(rainfallMm: number) {
  const rounded = Number.isInteger(rainfallMm) ? rainfallMm.toFixed(0) : rainfallMm.toFixed(1);
  return `${rounded} mm`;
}

function getCrowdPhrase(locale: SupportedSeoLocale, crowdLevel: CrowdLevel) {
  if (locale === "pl") {
    if (crowdLevel === "low") {
      return "maly ruch";
    }

    if (crowdLevel === "high") {
      return "wiekszy ruch";
    }

    return "sredni ruch";
  }

  if (crowdLevel === "low") {
    return "low crowds";
  }

  if (crowdLevel === "high") {
    return "busy streets";
  }

  return "medium crowds";
}

function getPricePhrase(locale: SupportedSeoLocale, priceLevel: PriceLevel) {
  if (locale === "pl") {
    if (priceLevel === "low") {
      return "nizsze ceny";
    }

    if (priceLevel === "high") {
      return "wyzsze ceny";
    }

    return "srednie ceny";
  }

  if (priceLevel === "low") {
    return "lower prices";
  }

  if (priceLevel === "high") {
    return "higher prices";
  }

  return "mid-range prices";
}

export function buildCityMonthSeoTitle(
  pageLabel: string,
  locale: SupportedSeoLocale,
) {
  return locale === "pl"
    ? `${pageLabel}: pogoda, temperatura i opady`
    : `${pageLabel} weather: temperature & rainfall`;
}

export function buildCityMonthSeoDescription(input: CityMonthSeoInput) {
  const temperature = formatSeoTemperature(input.avgTempDay);
  const rainfall = formatSeoRainfall(input.rainfallMm);
  const crowdPhrase = getCrowdPhrase(input.locale, input.crowdLevel);
  const pricePhrase = getPricePhrase(input.locale, input.priceLevel);

  const description =
    input.locale === "pl"
      ? `${input.pageLabel}: pogoda, temperatura i opady. W dzien ok. ${temperature}, opady ok. ${rainfall}, ${crowdPhrase} i ${pricePhrase}. Sprawdz, czy warto jechac i czy to dobry termin.`
      : `${input.pageLabel} weather guide: temperature around ${temperature}, rainfall about ${rainfall}, ${crowdPhrase}, and ${pricePhrase}. See if it is the best time to visit.`;

  return trimSeoDescription(description);
}
