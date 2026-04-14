import localeConfig from "@/../config/locales.json";
import localePublicationConfig from "@/data/generated/locale-publication.json";

export type LocaleCode = "en" | "de" | "es" | "fr" | "pl";

export const defaultLocale = localeConfig.defaultLocale as LocaleCode;
export const allLocales = localeConfig.allLocales as LocaleCode[];
export const localeLabels = localeConfig.labels as Record<LocaleCode, string>;
export const localeTiers = localeConfig.tiers as Record<"tier1" | "tier2", LocaleCode[]>;
export const defaultPublishedLocales = (localeConfig.publishedLocales ?? [defaultLocale]) as LocaleCode[];
export const localePublicationState = localePublicationConfig as Record<
  LocaleCode,
  {
    label: string;
    tier: string;
    isDefault: boolean;
    published: boolean;
  }
>;
export const publishedLocales = allLocales.filter(
  (locale) => localePublicationState[locale]?.published ?? defaultPublishedLocales.includes(locale),
);
export const publishedPrefixedLocales = publishedLocales.filter(
  (locale) => locale !== defaultLocale,
);

export function isPublishedLocale(locale: string): locale is LocaleCode {
  return publishedLocales.includes(locale as LocaleCode);
}

export function isKnownLocale(locale: string): locale is LocaleCode {
  return allLocales.includes(locale as LocaleCode);
}

export function buildLocalizedPath(locale: LocaleCode, pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (locale === defaultLocale) {
    return normalized;
  }

  return `/${locale}${normalized === "/" ? "" : normalized}`;
}

export function buildPagePath(locale: LocaleCode, slug: string) {
  return buildLocalizedPath(locale, `/${slug}`);
}

export function buildHomePath(locale: LocaleCode) {
  return buildLocalizedPath(locale, "/");
}

export function getCanonicalUrl(pathname: string) {
  return buildLocalizedPath(defaultLocale, pathname);
}

export function getLocalizedCanonicalUrl(locale: LocaleCode, pathname: string) {
  return buildLocalizedPath(locale, pathname);
}

export function getPublishedLanguageAlternates(pathname: string) {
  return Object.fromEntries(
    publishedLocales.map((locale) => [locale, buildLocalizedPath(locale, pathname)]),
  );
}
