import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadLocalEnv } from "./lib/load-env.mjs";
import { applySchema, createNeonPool } from "./lib/neon-sync.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before syncing the European city catalog.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, "../src/data/raw/european-cities-top20.json");

async function loadCatalog() {
  const catalogText = await readFile(catalogPath, "utf8");
  return JSON.parse(catalogText);
}

async function syncCities(pool, cities) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const city of cities) {
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

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const cities = await loadCatalog();
  const pool = createNeonPool(process.env.DATABASE_URL);

  try {
    await applySchema(pool);
    await syncCities(pool, cities);

    const stats = await pool.query(
      `
        SELECT COUNT(*)::int AS city_count, COUNT(DISTINCT country)::int AS country_count
        FROM cities
        WHERE id = ANY($1::text[])
      `,
      [cities.map((city) => city.id)],
    );

    const row = stats.rows[0];
    console.log(
      `Synced ${cities.length} European catalog cities to Neon. Catalog now covers ${row.country_count} countries and ${row.city_count} rows in the cities table for this import set.`,
    );
  } finally {
    await pool.end();
  }
}

await main();
