import type { MetadataRoute } from "next";

import { buildDestinationsPath, defaultLocale, publishedLocales } from "@/lib/i18n";
import {
  buildCityPagePath,
  getPublishedLanguageAlternatesForCity,
  getRepresentativeCityPages,
} from "@/lib/page-routing";
import { addXDefaultLanguageAlternate, getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return [
    ...publishedLocales.map((locale) => ({
      url: `${baseUrl}${locale === defaultLocale ? "" : `/${locale}`}`,
      priority: 1,
      alternates: {
        languages: addXDefaultLanguageAlternate(
          Object.fromEntries(
            publishedLocales.map((locale) => [
              locale,
              `${baseUrl}${locale === defaultLocale ? "/" : `/${locale}`}`,
            ]),
          ),
          "/",
        ),
      },
    })),
    ...publishedLocales.map((locale) => ({
      url: `${baseUrl}${buildDestinationsPath(locale)}`,
      priority: 0.9,
      alternates: {
        languages: addXDefaultLanguageAlternate(
          {
            en: `${baseUrl}${buildDestinationsPath("en")}`,
            pl: `${baseUrl}${buildDestinationsPath("pl")}`,
          },
          buildDestinationsPath(defaultLocale),
        ),
      },
    })),
    ...["/about", "/methodology", "/disclaimer", "/terms", "/privacy", "/contact"].map(
      (path) => ({
        url: `${baseUrl}${path}`,
        priority: 0.4,
      }),
    ),
    ...getRepresentativeCityPages().flatMap((page) =>
      publishedLocales.map((locale) => ({
        url: `${baseUrl}${buildCityPagePath(page, locale)}`,
        priority: locale === defaultLocale ? 0.9 : 0.8,
        alternates: {
          languages: addXDefaultLanguageAlternate(
            Object.fromEntries(
              Object.entries(getPublishedLanguageAlternatesForCity(page)).map(
                ([language, path]) => [language, `${baseUrl}${path}`],
              ),
            ),
            buildCityPagePath(page, defaultLocale),
          ),
        },
      })),
    ),
  ];
}
