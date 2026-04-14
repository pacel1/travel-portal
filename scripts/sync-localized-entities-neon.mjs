import { loadLocalEnv } from "./lib/load-env.mjs";
import { createNeonPool, applySchema, syncLocalizedEntityData } from "./lib/neon-sync.mjs";
import { getLocalizedEntityData } from "./lib/localized-entity-data.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before syncing localized entities.");
}

async function main() {
  const pool = createNeonPool(process.env.DATABASE_URL);

  try {
    await applySchema(pool);
    const localizedEntityData = getLocalizedEntityData();
    await syncLocalizedEntityData(pool, localizedEntityData);
    console.log(
      `Synchronized ${localizedEntityData.poiLocalizations.length} local POI overrides to Neon. City localizations remain managed in Neon as the source of truth.`,
    );
  } finally {
    await pool.end();
  }
}

await main();
