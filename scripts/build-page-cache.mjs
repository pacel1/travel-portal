import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { Pool } from "@neondatabase/serverless";

import { isTruthyEnv, loadLocalEnv } from "./lib/load-env.mjs";
import {
  buildTravelCache,
  getLocalSeedData,
  monthNameByNumber,
} from "./lib/travel-engine.mjs";
import { buildCanonicalPageSlug, getCanonicalCitySlug } from "./lib/slug-utils.mjs";
import {
  allLocales,
  buildDefaultLocalePublicationState,
  defaultLocale,
} from "./lib/locales.mjs";

loadLocalEnv();

const disableLocalData = isTruthyEnv(process.env.DISABLE_LOCAL_DATA);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, "../src/data/generated");

function canonicalizeLinkEntries(entries = []) {
  return entries.map((entry) => {
    const slugMatch = entry.slug?.match(/^(.*)-in-([a-z]+)$/u);

    if (!slugMatch) {
      return entry;
    }

    return {
      ...entry,
      slug: buildCanonicalPageSlug(slugMatch[1], slugMatch[2]),
    };
  });
}

function canonicalizePagePayload(page) {
  const canonicalCitySlug = getCanonicalCitySlug(page.citySlug, page.cityName);

  return {
    ...page,
    slug: buildCanonicalPageSlug(page.citySlug, page.month, page.cityName),
    citySlug: canonicalCitySlug,
    internalLinks: page.internalLinks
      ? {
          sameCity: canonicalizeLinkEntries(page.internalLinks.sameCity),
          similarCities: canonicalizeLinkEntries(page.internalLinks.similarCities),
        }
      : page.internalLinks,
  };
}

async function writeGeneratedFiles(
  monthlyScores,
  pages,
  cityLocalizations,
  localePublication,
  pageCopyByLocale,
  poiLocalizationsByLocale,
) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "monthly-scores.json"),
    `${JSON.stringify(monthlyScores, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputDir, "page-cache.json"),
    `${JSON.stringify(pages, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputDir, "city-localizations.json"),
    `${JSON.stringify(cityLocalizations, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputDir, "locale-publication.json"),
    `${JSON.stringify(localePublication, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputDir, "page-copy.json"),
    `${JSON.stringify(pageCopyByLocale, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputDir, "poi-localizations.json"),
    `${JSON.stringify(poiLocalizationsByLocale, null, 2)}\n`,
  );
}

async function readGeneratedFromNeon() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const [
      scoreResult,
      pageResult,
      copyTableResult,
      poiLocalizationTableResult,
      poiImageTableResult,
      cityLocalizationTableResult,
      localePublicationTableResult,
    ] = await Promise.all([
      pool.query(`
        SELECT
          ms.city_id,
          c.name AS city_name,
          c.country,
          c.slug AS city_slug,
          ms.month,
          ms.score,
          ms.crowd_level,
          ms.price_level
        FROM monthly_scores ms
        JOIN cities c ON c.id = ms.city_id
        ORDER BY c.slug, ms.month
      `),
      pool.query(`
        SELECT payload_json, generated_at
        FROM page_cache
        ORDER BY city_id, month
      `),
      pool.query(`SELECT to_regclass('public.page_copy') AS page_copy_regclass`),
      pool.query(`SELECT to_regclass('public.poi_localizations') AS poi_localizations_regclass`),
      pool.query(`SELECT to_regclass('public.poi_images') AS poi_images_regclass`),
      pool.query(`SELECT to_regclass('public.city_localizations') AS city_localizations_regclass`),
      pool.query(`SELECT to_regclass('public.locale_publication') AS locale_publication_regclass`),
    ]);

    if (!scoreResult.rows.length || !pageResult.rows.length) {
      return null;
    }

    const hasPageCopyTable = Boolean(copyTableResult.rows[0]?.page_copy_regclass);
    const hasPoiLocalizationTable = Boolean(
      poiLocalizationTableResult.rows[0]?.poi_localizations_regclass,
    );
    const hasPoiImageTable = Boolean(poiImageTableResult.rows[0]?.poi_images_regclass);
    const hasCityLocalizationTable = Boolean(
      cityLocalizationTableResult.rows[0]?.city_localizations_regclass,
    );
    const hasLocalePublicationTable = Boolean(
      localePublicationTableResult.rows[0]?.locale_publication_regclass,
    );
    const copyResult = hasPageCopyTable
      ? await pool.query(
          `
            SELECT city_id, month, locale, copy_json, generated_at
            FROM page_copy
            ORDER BY city_id, month, locale
          `,
        )
      : { rows: [] };
    const poiLocalizationResult = hasPoiLocalizationTable
      ? await pool.query(
          `
            SELECT poi_id, locale, name
            FROM poi_localizations
          `,
        )
      : { rows: [] };
    const cityLocalizationResult = hasCityLocalizationTable
      ? await pool.query(`
          SELECT city_id, locale, name, canonical_slug, aliases_json
          FROM city_localizations
          ORDER BY city_id, locale
        `)
      : { rows: [] };
    const poiImageResult = hasPoiImageTable
      ? await pool.query(`
          SELECT
            poi_id,
            source,
            source_page_url,
            file_title,
            image_url,
            thumb_url,
            width,
            height,
            author,
            license_name,
            license_url,
            attribution_text
          FROM poi_images
        `)
      : { rows: [] };
    const localePublicationResult = hasLocalePublicationTable
      ? await pool.query(`
          SELECT locale, label, tier, is_default, published
          FROM locale_publication
          ORDER BY locale
        `)
      : { rows: [] };
    const poiImages = new Map(
      poiImageResult.rows.map((row) => [
        row.poi_id,
        {
          source: row.source,
          sourcePageUrl: row.source_page_url,
          fileTitle: row.file_title,
          imageUrl: row.image_url,
          thumbUrl: row.thumb_url,
          width: row.width,
          height: row.height,
          author: row.author,
          licenseName: row.license_name,
          licenseUrl: row.license_url,
          attributionText: row.attribution_text,
        },
      ]),
    );
    const cityLocalizations = buildCityLocalizationMap(cityLocalizationResult.rows);
    const localePublication = buildLocalePublicationMap(localePublicationResult.rows);

    const monthlyScores = scoreResult.rows.map((row) => ({
      cityId: row.city_id,
      cityName: row.city_name,
      country: row.country,
      citySlug: getCanonicalCitySlug(row.city_slug, row.city_name),
      month: monthNameByNumber[row.month],
      score: row.score,
      crowdLevel: row.crowd_level,
      priceLevel: row.price_level,
    }));

    const basePages = pageResult.rows.map((row) => ({
      ...canonicalizePagePayload(row.payload_json),
      generatedAt:
        row.payload_json.generatedAt ??
        row.generated_at?.toISOString?.() ??
        new Date().toISOString(),
    }));
    const slugByPageKey = new Map(
      basePages.map((page) => [`${page.cityId}:${monthNumberFromName(page.month)}`, page.slug]),
    );
    const pageCopyByLocale = buildPageCopyByLocale(copyResult.rows, slugByPageKey);
    const poiLocalizationsByLocale = buildPoiLocalizationMap(poiLocalizationResult.rows);
    const pages = basePages.map((page) =>
      applyPageLocalization(
        page,
        defaultLocale,
        pageCopyByLocale,
        poiLocalizationsByLocale,
        poiImages,
      ),
    );

    return {
      monthlyScores,
      pages,
      cityLocalizations,
      localePublication,
      pageCopyByLocale,
      poiLocalizationsByLocale,
    };
  } finally {
    await pool.end();
  }
}

function applyPageLocalization(
  page,
  locale,
  pageCopyByLocale,
  poiLocalizationsByLocale,
  poiImages,
) {
  const localizedPageCopy = pageCopyByLocale[locale]?.[page.slug];
  const localizedPoiNames = poiLocalizationsByLocale[locale] ?? {};
  const hydratedPage = {
    ...page,
    attractions: {
      outdoor: localizePoiItems(page.attractions?.outdoor, localizedPoiNames, poiImages),
      indoor: localizePoiItems(page.attractions?.indoor, localizedPoiNames, poiImages),
    },
  };

  if (!localizedPageCopy) {
    return hydratedPage;
  }

  return {
    ...hydratedPage,
    summary: localizedPageCopy.summary ?? hydratedPage.summary,
    verdict: localizedPageCopy.verdict
      ? {
          ...hydratedPage.verdict,
          ...localizedPageCopy.verdict,
        }
      : hydratedPage.verdict,
    recommendations: localizedPageCopy.recommendations ?? hydratedPage.recommendations,
    tips: localizedPageCopy.tips ?? hydratedPage.tips,
    editorial: localizedPageCopy.editorial
      ? {
          ...hydratedPage.editorial,
          ...localizedPageCopy.editorial,
        }
      : hydratedPage.editorial,
    copyMeta: localizedPageCopy.copyMeta ?? hydratedPage.copyMeta,
  };
}

function localizePoiItems(items = [], localizedPoiNames = {}, poiImages) {
  return items.map((item) => ({
    ...item,
    name: localizedPoiNames[item.id] ?? item.name,
    image: poiImages.get(item.id) ?? item.image,
  }));
}

function buildPageCopyByLocale(rows, slugByPageKey) {
  const map = Object.fromEntries(allLocales.map((locale) => [locale, {}]));

  for (const row of rows) {
    const slug = slugByPageKey.get(`${row.city_id}:${row.month}`);

    if (!slug) {
      continue;
    }

    map[row.locale][slug] = {
      ...row.copy_json,
      generatedAt:
        row.copy_json?.copyMeta?.generatedAt ??
        row.generated_at?.toISOString?.() ??
        new Date().toISOString(),
    };
  }

  return map;
}

function buildPoiLocalizationMap(rows) {
  const map = Object.fromEntries(allLocales.map((locale) => [locale, {}]));

  for (const row of rows) {
    map[row.locale][row.poi_id] = row.name;
  }

  return map;
}

function buildCityLocalizationMap(rows) {
  const map = {};

  for (const row of rows) {
    if (!map[row.city_id]) {
      map[row.city_id] = {};
    }

    map[row.city_id][row.locale] = {
      name: row.name,
      canonical: row.canonical_slug,
      aliases: Array.isArray(row.aliases_json) ? row.aliases_json : [],
    };
  }

  return map;
}

function buildLocalePublicationMap(rows) {
  if (!rows.length) {
    return buildDefaultLocalePublicationState();
  }

  return Object.fromEntries(
    rows.map((row) => [
      row.locale,
      {
        label: row.label,
        tier: row.tier,
        isDefault: row.is_default,
        published: row.published,
      },
    ]),
  );
}

function monthNumberFromName(monthName) {
  const entry = Object.entries(monthNameByNumber).find(([, value]) => value === monthName);
  return entry ? Number(entry[0]) : null;
}

async function main() {
  const neonData = await readGeneratedFromNeon();

  if (neonData) {
    await writeGeneratedFiles(
      neonData.monthlyScores,
      neonData.pages,
      neonData.cityLocalizations,
      neonData.localePublication,
      neonData.pageCopyByLocale,
      neonData.poiLocalizationsByLocale,
    );
    console.log(
      `Generated ${neonData.monthlyScores.length} monthly scores and ${neonData.pages.length} page payloads from Neon.`,
    );
    return;
  }

  if (disableLocalData) {
    throw new Error(
      "Local fallback is disabled and Neon page cache is not available. Run a successful live import first.",
    );
  }

  const localData = buildTravelCache(getLocalSeedData());
  await writeGeneratedFiles(
    localData.monthlyScores,
    localData.pages,
    {},
    buildDefaultLocalePublicationState(),
    Object.fromEntries(allLocales.map((locale) => [locale, {}])),
    Object.fromEntries(allLocales.map((locale) => [locale, {}])),
  );
  console.log(
    `Generated ${localData.monthlyScores.length} monthly scores and ${localData.pages.length} page payloads from local seed data.`,
  );
}

await main();
