import type { MetadataRoute } from "next";

import { pagePayloads } from "@/lib/catalog";
import { publishedLocales } from "@/lib/i18n";
import {
  buildLocalizedPagePath,
  getPublishedLanguageAlternatesForPage,
} from "@/lib/page-routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://triptimi.com";

  return [
    {
      url: baseUrl,
      priority: 1,
    },
    ...pagePayloads.flatMap((page) =>
      publishedLocales.map((locale) => ({
        url: `${baseUrl}${buildLocalizedPagePath(page, locale)}`,
        priority: locale === "en" ? 0.8 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(getPublishedLanguageAlternatesForPage(page)).map(([language, path]) => [
              language,
              `${baseUrl}${path}`,
            ]),
          ),
        },
      })),
    ),
  ];
}
