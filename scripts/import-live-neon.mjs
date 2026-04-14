import { loadLocalEnv } from "./lib/load-env.mjs";
import { createNeonPool, applySchema, syncDataToNeon } from "./lib/neon-sync.mjs";
import { fetchLiveSeedData } from "./lib/live-sources.mjs";
import { buildTravelCache } from "./lib/travel-engine.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before importing live data.");
}

async function main() {
  const pool = createNeonPool(process.env.DATABASE_URL);

  try {
    const seedData = await fetchLiveSeedData();
    const derivedData = buildTravelCache(seedData);

    await applySchema(pool);
    await syncDataToNeon(pool, seedData, derivedData);

    console.log(
      `Imported live data for ${seedData.cities.length} cities, ${seedData.climateRows.length} monthly climate rows, ${seedData.poiRows.length} POIs, ${derivedData.monthlyScores.length} scores, and ${derivedData.pages.length} cached pages.`,
    );
  } finally {
    await pool.end();
  }
}

await main();
