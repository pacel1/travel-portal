import type { CrowdLevel, PriceLevel } from "../types/travel";

type SupportedSeoLocale = "en" | "pl";

type CityMonthSeoInput = {
  avgTempDay: number;
  crowdLevel: CrowdLevel;
  locale: SupportedSeoLocale;
  pageLabel: string;
  priceLevel: PriceLevel;
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

function getWeatherPhrase({
  locale,
  rainyDays,
  sunshineHours,
}: Pick<CityMonthSeoInput, "locale" | "rainyDays" | "sunshineHours">) {
  if (locale === "pl") {
    if (rainyDays >= 10) {
      return "czeste opady";
    }

    if (sunshineHours >= 9) {
      return "duzo slonca";
    }

    return "zmienna pogoda";
  }

  if (rainyDays >= 10) {
    return "frequent rain";
  }

  if (sunshineHours >= 9) {
    return "plenty of sun";
  }

  return "changeable weather";
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
    ? `${pageLabel}: pogoda, ceny i czy warto`
    : `${pageLabel}: weather, crowds & tips`;
}

export function buildCityMonthSeoDescription(input: CityMonthSeoInput) {
  const temperature = formatSeoTemperature(input.avgTempDay);
  const crowdPhrase = getCrowdPhrase(input.locale, input.crowdLevel);
  const pricePhrase = getPricePhrase(input.locale, input.priceLevel);
  const weatherPhrase = getWeatherPhrase(input);

  const description =
    input.locale === "pl"
      ? `${input.pageLabel}: w dzien ok. ${temperature}, ${crowdPhrase}, ${pricePhrase} i ${weatherPhrase}. Sprawdz, czy to dobry termin na city break i spokojne zwiedzanie miasta.`
      : `${input.pageLabel}: around ${temperature} by day, ${crowdPhrase}, ${pricePhrase}, and ${weatherPhrase}. See if it's a good time to book this city break now.`;

  return trimSeoDescription(description);
}
