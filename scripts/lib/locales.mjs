import localeConfig from "../../config/locales.json" with { type: "json" };

export const defaultLocale = localeConfig.defaultLocale;
export const allLocales = localeConfig.allLocales;
export const localeTiers = localeConfig.tiers;
export const localeLabels = localeConfig.labels;
export const defaultPublishedLocales = localeConfig.publishedLocales ?? [defaultLocale];

export function isKnownLocale(locale) {
  return allLocales.includes(locale);
}

export function getLocaleTier(locale) {
  if (locale === defaultLocale) {
    return "tier0";
  }

  for (const [tier, locales] of Object.entries(localeTiers)) {
    if (locales.includes(locale)) {
      return tier;
    }
  }

  return "tier0";
}

export function buildDefaultLocalePublicationState() {
  return Object.fromEntries(
    allLocales.map((locale) => [
      locale,
      {
        label: localeLabels[locale] ?? locale.toUpperCase(),
        tier: getLocaleTier(locale),
        isDefault: locale === defaultLocale,
        published: defaultPublishedLocales.includes(locale),
      },
    ]),
  );
}
