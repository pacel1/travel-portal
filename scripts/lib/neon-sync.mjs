import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { Pool } from "@neondatabase/serverless";

import { monthNameByNumber, monthNumberByName } from "./travel-engine.mjs";
import { getLocalizedEntityData } from "./localized-entity-data.mjs";
import { buildCanonicalPageSlug, getCanonicalCitySlug } from "./slug-utils.mjs";
import {
  allLocales,
  buildDefaultLocalePublicationState,
} from "./locales.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function canonicalizeLinkEntry(entry) {
  const slugMatch = entry.slug?.match(/^(.*)-in-([a-z]+)$/u);

  if (!slugMatch) {
    return entry;
  }

  return {
    ...entry,
    slug: buildCanonicalPageSlug(slugMatch[1], slugMatch[2]),
  };
}

function canonicalizePagePayload(page, monthNumber) {
  const month = page.month ?? monthNameByNumber[monthNumber];
  const canonicalCitySlug = getCanonicalCitySlug(page.citySlug, page.cityName);

  return {
    ...page,
    slug: buildCanonicalPageSlug(page.citySlug, month, page.cityName),
    citySlug: canonicalCitySlug,
    internalLinks: page.internalLinks
      ? {
          sameCity: (page.internalLinks.sameCity ?? []).map(canonicalizeLinkEntry),
          similarCities: (page.internalLinks.similarCities ?? []).map(canonicalizeLinkEntry),
        }
      : page.internalLinks,
  };
}

export function createNeonPool(connectionString) {
  return new Pool({ connectionString });
}

export async function applySchema(pool) {
  const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  const statements = schemaSql
    .split(/;\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function replaceCitySlices(pool, cityIds) {
  if (!cityIds.length) {
    return;
  }

  await pool.query(`DELETE FROM page_copy WHERE city_id = ANY($1::text[])`, [cityIds]);
  await pool.query(`DELETE FROM page_cache WHERE city_id = ANY($1::text[])`, [cityIds]);
  await pool.query(`DELETE FROM monthly_scores WHERE city_id = ANY($1::text[])`, [cityIds]);
  await pool.query(`DELETE FROM monthly_climate WHERE city_id = ANY($1::text[])`, [cityIds]);
  await pool.query(`DELETE FROM poi WHERE city_id = ANY($1::text[])`, [cityIds]);
}

async function upsertLocalizedEntityData(pool, localizedEntityData) {
  for (const localization of localizedEntityData.cityLocalizations) {
    await pool.query(
      `
        INSERT INTO city_localizations (
          city_id,
          locale,
          name,
          canonical_slug,
          aliases_json,
          generated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
        ON CONFLICT (city_id, locale) DO UPDATE
        SET
          name = EXCLUDED.name,
          canonical_slug = EXCLUDED.canonical_slug,
          aliases_json = EXCLUDED.aliases_json,
          generated_at = NOW()
      `,
      [
        localization.cityId,
        localization.locale,
        localization.name,
        localization.canonicalSlug,
        JSON.stringify(localization.aliases),
      ],
    );
  }

  for (const localization of localizedEntityData.poiLocalizations) {
    await pool.query(
      `
        INSERT INTO poi_localizations (
          poi_id,
          locale,
          name,
          generated_at
        )
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (poi_id, locale) DO UPDATE
        SET
          name = EXCLUDED.name,
          generated_at = NOW()
      `,
      [localization.poiId, localization.locale, localization.name],
    );
  }
}

export async function syncLocalePublication(pool) {
  const localePublicationState = buildDefaultLocalePublicationState();

  for (const locale of allLocales) {
    const state = localePublicationState[locale];

    await pool.query(
      `
        INSERT INTO locale_publication (
          locale,
          label,
          tier,
          is_default,
          published,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (locale) DO UPDATE
        SET
          label = EXCLUDED.label,
          tier = EXCLUDED.tier,
          is_default = EXCLUDED.is_default,
          updated_at = NOW()
      `,
      [locale, state.label, state.tier, state.isDefault, state.published],
    );
  }
}

export async function syncLocalizedEntityData(pool, localizedEntityData = getLocalizedEntityData()) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await syncLocalePublication(client);
    await upsertLocalizedEntityData(client, localizedEntityData);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function buildInternalLinks(scoreRows) {
  function getSameCityLinks(cityId, monthNumber) {
    return scoreRows
      .filter((entry) => entry.cityId === cityId && entry.month !== monthNumber)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map((entry) => ({
        slug: buildCanonicalPageSlug(entry.citySlug, entry.monthName, entry.cityName),
        label: `${entry.cityName} in ${capitalizeMonth(entry.monthName)}`,
        score: entry.score,
      }));
  }

  function getSimilarCityLinks(cityId, monthNumber) {
    return scoreRows
      .filter((entry) => entry.cityId !== cityId && entry.month === monthNumber)
      .sort((left, right) => right.score - left.score)
      .slice(0, 2)
      .map((entry) => ({
        slug: buildCanonicalPageSlug(entry.citySlug, entry.monthName, entry.cityName),
        label: `${entry.cityName} in ${capitalizeMonth(entry.monthName)}`,
        score: entry.score,
      }));
  }

  return { getSameCityLinks, getSimilarCityLinks };
}

function capitalizeMonth(month) {
  return month.charAt(0).toUpperCase() + month.slice(1);
}

export async function refreshPageCacheInternalLinks(pool) {
  const scoreResult = await pool.query(`
      SELECT
        ms.city_id,
        ms.month,
        ms.score,
        c.name AS city_name,
        c.slug AS city_slug
      FROM monthly_scores ms
      JOIN cities c ON c.id = ms.city_id
    `);
  const pageCacheResult = await pool.query(`
      SELECT city_id, month, payload_json
      FROM page_cache
    `);

  if (!scoreResult.rows.length || !pageCacheResult.rows.length) {
    return;
  }

  const scoreRows = scoreResult.rows.map((row) => ({
    cityId: row.city_id,
    month: row.month,
    monthName: monthNameByNumber[row.month],
    score: row.score,
    cityName: row.city_name,
    citySlug: getCanonicalCitySlug(row.city_slug, row.city_name),
  }));
  const { getSameCityLinks, getSimilarCityLinks } = buildInternalLinks(scoreRows);

  for (const row of pageCacheResult.rows) {
    const refreshedPayload = {
      ...canonicalizePagePayload(row.payload_json, row.month),
      internalLinks: {
        sameCity: getSameCityLinks(row.city_id, row.month),
        similarCities: getSimilarCityLinks(row.city_id, row.month),
      },
    };

    await pool.query(
      `
        UPDATE page_cache
        SET payload_json = $3::jsonb
        WHERE city_id = $1 AND month = $2
      `,
      [row.city_id, row.month, JSON.stringify(refreshedPayload)],
    );
  }
}

export async function syncDataToNeon(pool, seedData, derivedData, options = {}) {
  const cityIds = seedData.cities.map((city) => city.id);
  const replaceCityData = options.replaceCityData ?? true;
  const localizedEntityData = options.localizedEntityData ?? getLocalizedEntityData();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await syncLocalePublication(client);

    if (replaceCityData) {
      await replaceCitySlices(client, cityIds);
    }

    for (const city of seedData.cities) {
      await client.query(
        `
          INSERT INTO cities (id, name, slug, country, latitude, longitude, population)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE
          SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            country = EXCLUDED.country,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            population = EXCLUDED.population
        `,
        [
          city.id,
          city.name,
          city.slug,
          city.country,
          city.latitude,
          city.longitude,
          city.population,
        ],
      );
    }

    for (const climate of seedData.climateRows) {
      await client.query(
        `
          INSERT INTO monthly_climate (
            city_id,
            month,
            avg_temp_day,
            avg_temp_night,
            rainfall_mm,
            rainy_days,
            humidity,
            sunshine_hours
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          climate.city_id,
          monthNumberByName[climate.month],
          climate.avg_temp_day,
          climate.avg_temp_night,
          climate.rainfall_mm,
          climate.rainy_days,
          climate.humidity,
          climate.sunshine_hours,
        ],
      );
    }

    for (const poi of seedData.poiRows) {
      await client.query(
        `
          INSERT INTO poi (id, city_id, name, category, indoor, popularity_score, lat, lon)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          poi.id,
          poi.city_id,
          poi.name,
          poi.category,
          poi.indoor,
          poi.popularity_score,
          poi.lat,
          poi.lon,
        ],
      );
    }

    await upsertLocalizedEntityData(client, localizedEntityData);

    for (const score of derivedData.monthlyScores) {
      await client.query(
        `
          INSERT INTO monthly_scores (city_id, month, score, crowd_level, price_level)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          score.cityId,
          monthNumberByName[score.month],
          score.score,
          score.crowdLevel,
          score.priceLevel,
        ],
      );
    }

    for (const page of derivedData.pages) {
      await client.query(
        `
          INSERT INTO page_cache (city_id, month, payload_json, generated_at)
          VALUES ($1, $2, $3::jsonb, $4::timestamptz)
        `,
        [
          page.cityId,
          monthNumberByName[page.month],
          JSON.stringify(page),
          page.generatedAt,
        ],
      );
    }

    await refreshPageCacheInternalLinks(client);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
