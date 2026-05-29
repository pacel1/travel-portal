import type { MetadataRoute } from "next";

import { pagePayloads } from "@/lib/catalog";
import { buildDestinationsPath, defaultLocale, publishedLocales } from "@/lib/i18n";
import {
  buildLocalizedPagePath,
  getPublishedLanguageAlternatesForPage,
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
    ...pagePayloads.flatMap((page) =>
      publishedLocales.map((locale) => ({
        url: `${baseUrl}${buildLocalizedPagePath(page, locale)}`,
        priority: locale === "en" ? 0.8 : 0.7,
        alternates: {
          languages: addXDefaultLanguageAlternate(
            Object.fromEntries(
              Object.entries(getPublishedLanguageAlternatesForPage(page)).map(([language, path]) => [
                language,
                `${baseUrl}${path}`,
              ]),
            ),
            buildLocalizedPagePath(page, defaultLocale),
          ),
        },
      })),
    ),
  ];
}
