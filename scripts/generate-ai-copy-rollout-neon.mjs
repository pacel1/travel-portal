import { loadLocalEnv } from "./lib/load-env.mjs";
import { createNeonPool, applySchema } from "./lib/neon-sync.mjs";
import {
  createEmptyRunStats,
  enrichPagesWithAiCopy,
  finalizeRunStats,
  mergeAiCopyRunStats,
  printAiCopyRunSummary,
} from "./lib/ai-copy.mjs";
import { parseCsvEnv } from "./lib/city-selection.mjs";
import {
  fetchCachedPages,
  fetchLocalizedCopyMap,
  saveLocalizedPages,
} from "./lib/page-copy-sync.mjs";
import { allLocales, defaultLocale, localeTiers } from "./lib/locales.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before generating rollout AI copy.");
}

const targetTier = String(process.env.COPY_TIER ?? "").trim().toLowerCase();
const explicitLocales = parseCsvEnv(process.env.COPY_LOCALES);
const targetCityIds = parseCsvEnv(process.env.COPY_CITY_IDS);
const batchSize = Math.max(1, Number(process.env.COPY_BATCH_SIZE ?? 24));
const initialConcurrency = process.env.COPY_CONCURRENCY
  ? Math.max(1, Number(process.env.COPY_CONCURRENCY))
  : undefined;

function getTargetLocales() {
  if (explicitLocales.length) {
    return explicitLocales.filter((locale) => allLocales.includes(locale) && locale !== defaultLocale);
  }

  if (targetTier === "tier1" || targetTier === "tier2") {
    return localeTiers[targetTier];
  }

  return allLocales.filter((locale) => locale !== defaultLocale);
}

async function main() {
  const locales = getTargetLocales();

  if (!locales.length) {
    throw new Error("No rollout locales selected. Set COPY_TIER=tier1|tier2 or COPY_LOCALES=de,es.");
  }

  const pool = createNeonPool(process.env.DATABASE_URL);

  try {
    await applySchema(pool);
    const pages = await fetchCachedPages(pool, { cityIds: targetCityIds });
    const sourceCopyMap = await fetchLocalizedCopyMap(pool, defaultLocale, { cityIds: targetCityIds });
    const rolloutStats = createEmptyRunStats();

    for (const locale of locales) {
      let processed = 0;
      const localeStats = createEmptyRunStats();

      for (let index = 0; index < pages.length; index += batchSize) {
        const batch = pages.slice(index, index + batchSize);
        const { pages: updatedPages, stats } = await enrichPagesWithAiCopy(batch, locale, {
          initialConcurrency,
          sourceCopyMap,
        });
        mergeAiCopyRunStats(localeStats, stats);
        mergeAiCopyRunStats(rolloutStats, stats);
        await saveLocalizedPages(pool, updatedPages, locale);
        processed += updatedPages.length;
        console.log(`Saved ${processed}/${pages.length} localized pages for locale ${locale}.`);
      }

      printAiCopyRunSummary(finalizeRunStats(localeStats), `AI copy locale=${locale}`);
      console.log(
        `Generated AI copy for ${pages.length} cached pages in locale ${locale}${targetCityIds.length ? ` for ${targetCityIds.length} selected cities` : ""}.`,
      );
    }

    printAiCopyRunSummary(finalizeRunStats(rolloutStats), "AI copy rollout");
  } finally {
    await pool.end();
  }
}

await main();
