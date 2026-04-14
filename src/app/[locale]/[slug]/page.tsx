import { notFound } from "next/navigation";

import {
  isPublishedLocale,
  publishedPrefixedLocales,
  type LocaleCode,
} from "@/lib/i18n";
import { getLocalizedStaticSlugs } from "@/lib/page-routing";
import {
  buildTravelMonthMetadata,
  renderTravelMonthPage,
} from "@/app/[locale]/page";

export function generateStaticParams() {
  return publishedPrefixedLocales.flatMap((locale) =>
    getLocalizedStaticSlugs(locale).map((slug) => ({
      locale,
      slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isPublishedLocale(locale) || !publishedPrefixedLocales.includes(locale)) {
    return {
      title: "Page not found",
    };
  }

  return buildTravelMonthMetadata(slug, locale as LocaleCode);
}

export default async function LocalizedTravelMonthPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isPublishedLocale(locale) || !publishedPrefixedLocales.includes(locale)) {
    notFound();
  }

  return renderTravelMonthPage(slug, locale);
}
