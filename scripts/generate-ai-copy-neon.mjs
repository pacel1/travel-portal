import { loadLocalEnv } from "./lib/load-env.mjs";
import { createNeonPool, applySchema } from "./lib/neon-sync.mjs";
import {
  createEmptyRunStats,
  enrichPagesWithAiCopy,
  finalizeRunStats,
  mergeAiCopyRunStats,
  printAiCopyRunSummary,
} from "./lib/ai-copy.mjs";
import { defaultLocale, isKnownLocale } from "./lib/locales.mjs";
import { parseCsvEnv } from "./lib/city-selection.mjs";
import {
  fetchCachedPages,
  fetchLocalizedCopyMap,
  saveLocalizedPages,
} from "./lib/page-copy-sync.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before generating AI copy.");
}

const targetLocale = process.env.COPY_LOCALE ?? defaultLocale;
const targetCityIds = parseCsvEnv(process.env.COPY_CITY_IDS);
const batchSize = Math.max(1, Number(process.env.COPY_BATCH_SIZE ?? 24));
const initialConcurrency = process.env.COPY_CONCURRENCY
  ? Math.max(1, Number(process.env.COPY_CONCURRENCY))
  : undefined;

if (!isKnownLocale(targetLocale)) {
  throw new Error(`Unsupported COPY_LOCALE "${targetLocale}". Check config/locales.json.`);
}

async function main() {
  const pool = createNeonPool(process.env.DATABASE_URL);

  try {
    await applySchema(pool);
    const pages = await fetchCachedPages(pool, { cityIds: targetCityIds });
    const sourceCopyMap =
      targetLocale === defaultLocale
        ? {}
        : await fetchLocalizedCopyMap(pool, defaultLocale, { cityIds: targetCityIds });

    let processed = 0;
    const runStats = createEmptyRunStats();

    for (let index = 0; index < pages.length; index += batchSize) {
      const batch = pages.slice(index, index + batchSize);
      const { pages: updatedPages, stats } = await enrichPagesWithAiCopy(batch, targetLocale, {
        initialConcurrency,
        sourceCopyMap,
      });
      mergeAiCopyRunStats(runStats, stats);
      await saveLocalizedPages(pool, updatedPages, targetLocale);
      processed += updatedPages.length;
      console.log(`Saved ${processed}/${pages.length} localized pages for locale ${targetLocale}.`);
    }

    printAiCopyRunSummary(finalizeRunStats(runStats), `AI copy locale=${targetLocale}`);
    console.log(
      `Generated AI copy for ${pages.length} cached pages in locale ${targetLocale}${targetCityIds.length ? ` for ${targetCityIds.length} selected cities` : ""}.`,
    );
  } finally {
    await pool.end();
  }
}

await main();
