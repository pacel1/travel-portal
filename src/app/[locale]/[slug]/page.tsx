import { notFound } from "next/navigation";

import {
  isPublishedLocale,
  publishedPrefixedLocales,
  type LocaleCode,
} from "@/lib/i18n";
import { getCityPageStaticSlugs } from "@/lib/page-routing";
import {
  buildCitySegmentMetadata,
  renderCitySegment,
} from "@/app/[locale]/city-guide";

export function generateStaticParams() {
  return publishedPrefixedLocales.flatMap((locale) =>
    getCityPageStaticSlugs(locale).map((slug) => ({
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

  return buildCitySegmentMetadata(slug, locale as LocaleCode);
}

export default async function LocalizedCityPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isPublishedLocale(locale) || !publishedPrefixedLocales.includes(locale)) {
    notFound();
  }

  return renderCitySegment(slug, locale as LocaleCode);
}
