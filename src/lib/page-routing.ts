import citySlugOverrides from "@/data/generated/city-localizations.json";
import type { PagePayload } from "@/types/travel";

import { pagePayloads } from "./catalog";
import {
  allLocales,
  buildLocalizedPath,
  defaultLocale,
  publishedLocales,
  type LocaleCode,
} from "./i18n";
import {
  buildCitySlugAliases,
  getCanonicalCitySlug,
  normalizeTextForComparison,
  normalizeTravelSlug,
} from "./slug-utils";

type CitySlugOverride = Partial<
  Record<
    LocaleCode,
    {
      name?: string;
      canonical?: string;
      aliases?: string[];
    }
  >
>;

type ResolvedPageRoute = {
  page: PagePayload;
  canonicalSlug: string;
};

const cityOverrideMap = citySlugOverrides as Record<string, CitySlugOverride>;

const monthSlugConfig: Record<
  LocaleCode,
  {
    separator: string;
    months: Record<string, string>;
  }
> = {
  en: {
    separator: "in",
    months: {
      january: "january",
      february: "february",
      march: "march",
      april: "april",
      may: "may",
      june: "june",
      july: "july",
      august: "august",
      september: "september",
      october: "october",
      november: "november",
      december: "december",
    },
  },
  de: {
    separator: "im",
    months: {
      january: "januar",
      february: "februar",
      march: "maerz",
      april: "april",
      may: "mai",
      june: "juni",
      july: "juli",
      august: "august",
      september: "september",
      october: "oktober",
      november: "november",
      december: "dezember",
    },
  },
  es: {
    separator: "en",
    months: {
      january: "enero",
      february: "febrero",
      march: "marzo",
      april: "abril",
      may: "mayo",
      june: "junio",
      july: "julio",
      august: "agosto",
      september: "septiembre",
      october: "octubre",
      november: "noviembre",
      december: "diciembre",
    },
  },
  fr: {
    separator: "en",
    months: {
      january: "janvier",
      february: "fevrier",
      march: "mars",
      april: "avril",
      may: "mai",
      june: "juin",
      july: "juillet",
      august: "aout",
      september: "septembre",
      october: "octobre",
      november: "novembre",
      december: "decembre",
    },
  },
  pl: {
    separator: "w",
    months: {
      january: "styczniu",
      february: "lutym",
      march: "marcu",
      april: "kwietniu",
      may: "maju",
      june: "czerwcu",
      july: "lipcu",
      august: "sierpniu",
      september: "wrzesniu",
      october: "pazdzierniku",
      november: "listopadzie",
      december: "grudniu",
    },
  },
};

const routeIndexByLocale = Object.fromEntries(
  allLocales.map((locale) => [locale, buildLocaleRouteIndex(locale)]),
) as Record<LocaleCode, Map<string, ResolvedPageRoute>>;

function buildLocaleRouteIndex(locale: LocaleCode) {
  const routeIndex = new Map<string, ResolvedPageRoute>();

  for (const page of pagePayloads) {
    const canonicalSlug = getCanonicalPageSlug(page, locale);
    routeIndex.set(canonicalSlug, { page, canonicalSlug });

    for (const alias of getAliasPageSlugs(page, locale)) {
      if (!routeIndex.has(alias)) {
        routeIndex.set(alias, { page, canonicalSlug });
      }
    }
  }

  return routeIndex;
}

export function getCanonicalPageSlug(
  page: PagePayload,
  locale: LocaleCode = defaultLocale,
) {
  const citySlug = getLocalizedCitySlug(page, locale);
  const monthSlug = getLocalizedMonthSlug(page.month, locale);
  const separator = monthSlugConfig[locale].separator;

  return `${citySlug}-${separator}-${monthSlug}`;
}

export function buildLocalizedPagePath(
  pageOrSlug: PagePayload | string,
  locale: LocaleCode = defaultLocale,
) {
  const page = typeof pageOrSlug === "string" ? getUnderlyingPageBySlug(pageOrSlug) : pageOrSlug;

  if (!page) {
    return buildLocalizedPath(locale, typeof pageOrSlug === "string" ? `/${pageOrSlug}` : "/");
  }

  return buildLocalizedPath(locale, `/${getCanonicalPageSlug(page, locale)}`);
}

export function resolvePageRoute(
  routeSlug: string,
  locale: LocaleCode = defaultLocale,
): ResolvedPageRoute | null {
  return routeIndexByLocale[locale].get(normalizeSlug(routeSlug)) ?? null;
}

export function getLocalizedDisplayCityName(
  page: PagePayload,
  locale: LocaleCode = defaultLocale,
) {
  const overrideName = cityOverrideMap[page.cityId]?.[locale]?.name;

  if (
    locale === "pl" &&
    overrideName &&
    normalizeDisplayNameForComparison(overrideName) ===
      normalizeDisplayNameForComparison(page.cityName)
  ) {
    return page.cityName;
  }

  return overrideName ?? page.cityName;
}

export function getPublishedLanguageAlternatesForPage(page: PagePayload) {
  return Object.fromEntries(
    publishedLocales.map((locale) => [locale, buildLocalizedPagePath(page, locale)]),
  );
}

export function getLocalizedStaticSlugs(locale: LocaleCode = defaultLocale) {
  return pagePayloads.map((page) => getCanonicalPageSlug(page, locale));
}

// ── City guide pages (consolidated, one URL per city) ────────────────────────

const cityPagePrefixByLocale: Record<LocaleCode, string> = {
  en: "best-time-to-visit",
  pl: "najlepszy-czas-na-wyjazd",
  de: "beste-reisezeit",
  es: "mejor-epoca-para-viajar",
  fr: "meilleure-periode-pour-visiter",
};

const representativeCityPages = (() => {
  const byCity = new Map<string, PagePayload>();

  for (const page of pagePayloads) {
    if (!byCity.has(page.cityId)) {
      byCity.set(page.cityId, page);
    }
  }

  return Array.from(byCity.values());
})();

export function getCanonicalCityPageSlug(
  page: PagePayload,
  locale: LocaleCode = defaultLocale,
) {
  return `${cityPagePrefixByLocale[locale]}-${getLocalizedCitySlug(page, locale)}`;
}

export function buildCityPagePath(
  page: PagePayload,
  locale: LocaleCode = defaultLocale,
) {
  return buildLocalizedPath(locale, `/${getCanonicalCityPageSlug(page, locale)}`);
}

export function buildCityMonthAnchorPath(
  page: PagePayload,
  locale: LocaleCode = defaultLocale,
) {
  return `${buildCityPagePath(page, locale)}#${page.month}`;
}

const cityRouteIndexByLocale = Object.fromEntries(
  allLocales.map((locale) => [locale, buildCityRouteIndex(locale)]),
) as Record<LocaleCode, Map<string, PagePayload>>;

function buildCityRouteIndex(locale: LocaleCode) {
  const index = new Map<string, PagePayload>();

  for (const page of representativeCityPages) {
    index.set(normalizeSlug(getCanonicalCityPageSlug(page, locale)), page);

    // Accept the default-locale (English) prefix as an alias so links that fall
    // back to the canonical English slug still resolve under localized routes.
    if (locale !== defaultLocale) {
      index.set(
        normalizeSlug(
          `${cityPagePrefixByLocale[defaultLocale]}-${getLocalizedCitySlug(page, locale)}`,
        ),
        page,
      );
    }
  }

  return index;
}

export function resolveCityPageRoute(
  routeSlug: string,
  locale: LocaleCode = defaultLocale,
): PagePayload | null {
  return cityRouteIndexByLocale[locale].get(normalizeSlug(routeSlug)) ?? null;
}

export function getCityPageStaticSlugs(locale: LocaleCode = defaultLocale) {
  return representativeCityPages.map((page) => getCanonicalCityPageSlug(page, locale));
}

export function getRepresentativeCityPages() {
  return representativeCityPages;
}

export function getPublishedLanguageAlternatesForCity(page: PagePayload) {
  return Object.fromEntries(
    publishedLocales.map((locale) => [locale, buildCityPagePath(page, locale)]),
  );
}

function getUnderlyingPageBySlug(baseSlug: string) {
  return pagePayloads.find((page) => page.slug === baseSlug) ?? null;
}

function normalizeDisplayNameForComparison(value: string) {
  return normalizeTextForComparison(value);
}

function getLocalizedCitySlug(page: PagePayload, locale: LocaleCode) {
  const override = cityOverrideMap[page.cityId]?.[locale];

  if (override?.canonical) {
    return normalizeTravelSlug(override.canonical);
  }

  if (locale === "de") {
    return normalizeTravelSlug(germanizeSlug(page.cityName));
  }

  return getCanonicalCitySlug(page.citySlug, page.cityName);
}

function getAliasPageSlugs(page: PagePayload, locale: LocaleCode) {
  const cityAliases = getLocalizedCitySlugAliases(page, locale);
  const monthAliases = getLocalizedMonthSlugAliases(page.month, locale);
  const separatorAliases = getSeparatorAliases(locale);
  const aliases = new Set<string>();

  for (const citySlug of cityAliases) {
    for (const separator of separatorAliases) {
      for (const monthSlug of monthAliases) {
        const candidate = normalizeSlug(`${citySlug}-${separator}-${monthSlug}`);

        if (candidate !== getCanonicalPageSlug(page, locale)) {
          aliases.add(candidate);
        }
      }
    }
  }

  return aliases;
}

function getLocalizedCitySlugAliases(page: PagePayload, locale: LocaleCode) {
  const override = cityOverrideMap[page.cityId]?.[locale];
  const aliases = buildCitySlugAliases(page.citySlug, page.cityName, [
    germanizeSlug(page.cityName),
    getLocalizedCitySlug(page, locale),
  ]);

  for (const alias of override?.aliases ?? []) {
    aliases.add(normalizeSlug(alias));
  }

  for (const localeOverride of Object.values(cityOverrideMap[page.cityId] ?? {})) {
    for (const alias of localeOverride?.aliases ?? []) {
      aliases.add(normalizeSlug(alias));
    }

    if (localeOverride?.canonical) {
      aliases.add(normalizeSlug(localeOverride.canonical));
    }
  }

  return aliases;
}

function getLocalizedMonthSlug(month: string, locale: LocaleCode) {
  return (
    monthSlugConfig[locale].months[month] ??
    monthSlugConfig[defaultLocale].months[month] ??
    month
  );
}

function getLocalizedMonthSlugAliases(month: string, locale: LocaleCode) {
  return new Set([
    getLocalizedMonthSlug(month, locale),
    monthSlugConfig[defaultLocale].months[month] ?? month,
  ]);
}

function getSeparatorAliases(locale: LocaleCode) {
  return new Set([monthSlugConfig[locale].separator, monthSlugConfig[defaultLocale].separator]);
}

function normalizeSlug(value: string) {
  return normalizeTravelSlug(value);
}

function germanizeSlug(value: string) {
  return value
    .replace(/\u00C4/g, "Ae")
    .replace(/\u00D6/g, "Oe")
    .replace(/\u00DC/g, "Ue")
    .replace(/\u00E4/g, "ae")
    .replace(/\u00F6/g, "oe")
    .replace(/\u00FC/g, "ue")
    .replace(/\u00DF/g, "ss");
}
