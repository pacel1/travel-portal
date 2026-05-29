import type { Metadata } from "next";

import { defaultLocale, type LocaleCode } from "./i18n";

const fallbackSiteUrl = "https://triptimi.com";
const fallbackSocialImage = "/triptimiscore.png";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl).replace(/\/+$/, "");
}

export function buildAbsoluteUrl(pathname: string) {
  try {
    return new URL(pathname).toString();
  } catch {
    return new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, getSiteUrl()).toString();
  }
}

export function addXDefaultLanguageAlternate(
  languages: Record<string, string>,
  defaultPathname: string,
) {
  return {
    ...languages,
    "x-default": buildAbsoluteUrl(defaultPathname),
  };
}

export function buildSocialMetadata({
  canonicalPath,
  description,
  imageAlt = "TripTimi travel score preview",
  title,
}: {
  canonicalPath: string;
  description: string;
  imageAlt?: string;
  title: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = buildAbsoluteUrl(fallbackSocialImage);

  return {
    openGraph: {
      title,
      description,
      type: "website",
      url: buildAbsoluteUrl(canonicalPath),
      images: [
        {
          url: image,
          width: 633,
          height: 593,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function getDefaultLanguagePath(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return defaultLocale === "en" ? normalized : `/${defaultLocale}${normalized}`;
}

export function getHtmlLocaleFromPathname(pathname: string, publishedLocales: LocaleCode[]) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (firstSegment && publishedLocales.includes(firstSegment as LocaleCode)) {
    return firstSegment as LocaleCode;
  }

  return defaultLocale;
}
