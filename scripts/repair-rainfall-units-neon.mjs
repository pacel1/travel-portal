import { Pool } from "@neondatabase/serverless";

import { loadLocalEnv } from "./lib/load-env.mjs";
import {
  buildTravelCache,
  deriveSignalRows,
  monthNameByNumber,
  monthNumberByName,
} from "./lib/travel-engine.mjs";
import { refreshPageCacheInternalLinks } from "./lib/neon-sync.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before repairing rainfall units.");
}

const daysByMonth = {
  1: 31,
  2: 28.25,
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31,
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const stats = await client.query(`
      SELECT
        COUNT(*)::int AS rows,
        MIN(rainfall_mm)::float AS min_rainfall,
        MAX(rainfall_mm)::float AS max_rainfall,
        COUNT(*) FILTER (WHERE rainy_days >= 12 AND rainfall_mm < 5)::int AS suspicious_rows
      FROM monthly_climate
    `);
    const currentStats = stats.rows[0];

    if (!currentStats.rows) {
      throw new Error("monthly_climate is empty; nothing to repair.");
    }

    if (currentStats.max_rainfall > 10) {
      throw new Error(
        `Rainfall already looks monthly (max ${currentStats.max_rainfall} mm). Aborting to avoid double-conversion.`,
      );
    }

    for (const [month, days] of Object.entries(daysByMonth)) {
      await client.query(
        `
          UPDATE monthly_climate
          SET rainfall_mm = ROUND((rainfall_mm * $2)::numeric, 1)
          WHERE month = $1
        `,
        [Number(month), days],
      );
    }

    const [cityResult, climateResult, poiResult] = await Promise.all([
      client.query(`
        SELECT id, name, slug, country, latitude, longitude, population
        FROM cities
        ORDER BY slug
      `),
      client.query(`
        SELECT
          city_id,
          month,
          avg_temp_day,
          avg_temp_night,
          rainfall_mm,
          rainy_days,
          humidity,
          sunshine_hours
        FROM monthly_climate
        ORDER BY city_id, month
      `),
      client.query(`
        SELECT id, city_id, name, category, indoor, popularity_score, lat, lon
        FROM poi
        ORDER BY city_id, popularity_score DESC
      `),
    ]);

    const cities = cityResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      country: row.country,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      population: row.population == null ? null : Number(row.population),
    }));
    const climateRows = climateResult.rows.map((row) => ({
      city_id: row.city_id,
      month: monthNameByNumber[row.month],
      avg_temp_day: Number(row.avg_temp_day),
      avg_temp_night: Number(row.avg_temp_night),
      rainfall_mm: Number(row.rainfall_mm),
      rainy_days: Number(row.rainy_days),
      humidity: Number(row.humidity),
      sunshine_hours: Number(row.sunshine_hours),
    }));
    const poiRows = poiResult.rows.map((row) => ({
      id: row.id,
      city_id: row.city_id,
      name: row.name,
      category: row.category,
      indoor: row.indoor,
      popularity_score: Number(row.popularity_score),
      lat: Number(row.lat),
      lon: Number(row.lon),
    }));
    const signalRows = deriveSignalRows(cities, climateRows);
    const derivedData = buildTravelCache({
      cities,
      climateRows,
      signalRows,
      poiRows,
    });

    await client.query("DELETE FROM monthly_scores");
    await client.query("DELETE FROM page_cache");

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

    console.log(
      `Repaired rainfall units for ${climateRows.length} monthly climate rows and rebuilt ${derivedData.pages.length} page cache rows.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await main();
} finally {
  await pool.end();
}
