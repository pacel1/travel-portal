import { loadLocalEnv } from "./lib/load-env.mjs";
import {
  applySchema,
  createNeonPool,
  refreshPageCacheInternalLinks,
} from "./lib/neon-sync.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before repairing internal links.");
}

async function main() {
  const pool = createNeonPool(process.env.DATABASE_URL);
  const client = await pool.connect();

  try {
    await applySchema(pool);
    await client.query("BEGIN");
    await refreshPageCacheInternalLinks(client);
    await client.query("COMMIT");
    console.log("Rebuilt page_cache internal links for all cached city-month pages.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

await main();
