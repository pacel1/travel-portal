import { isTruthyEnv, loadLocalEnv } from "./lib/load-env.mjs";
import { createNeonPool, applySchema, syncDataToNeon } from "./lib/neon-sync.mjs";
import { buildTravelCache, getLocalSeedData } from "./lib/travel-engine.mjs";

loadLocalEnv();

if (isTruthyEnv(process.env.DISABLE_LOCAL_DATA)) {
  throw new Error(
    "DISABLE_LOCAL_DATA is enabled, so db:sync is blocked because it writes local seed data. Use db:import-live instead.",
  );
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before syncing Neon.");
}

async function main() {
  const pool = createNeonPool(process.env.DATABASE_URL);
  const seedData = getLocalSeedData();
  const derivedData = buildTravelCache(seedData);
  try {
    await applySchema(pool);
    await syncDataToNeon(pool, seedData, derivedData);
    console.log(
      `Synced ${seedData.cities.length} cities, ${derivedData.monthlyScores.length} scores, and ${derivedData.pages.length} cached pages to Neon.`,
    );
  } finally {
    await pool.end();
  }
}

await main();
