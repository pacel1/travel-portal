import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createEmptyRunStats,
  enrichPagesWithAiCopy,
  finalizeRunStats,
  mergeAiCopyRunStats,
  printAiCopyRunSummary,
} from "./lib/ai-copy.mjs";
import {
  loadEuropeanCityCatalogWithMetadata,
  parseCsvEnv,
  selectCitiesFromCatalog,
} from "./lib/city-selection.mjs";
import { isTruthyEnv, loadLocalEnv } from "./lib/load-env.mjs";
import { applySchema, createNeonPool, syncDataToNeon } from "./lib/neon-sync.mjs";
import {
  fetchCachedPages,
  fetchLocalizedCopyMap,
  saveLocalizedPages,
} from "./lib/page-copy-sync.mjs";
import { buildTravelCache } from "./lib/travel-engine.mjs";
import { fetchLiveSeedData } from "./lib/live-sources.mjs";
import { defaultLocale, isKnownLocale } from "./lib/locales.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before running the country importer.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportPath = path.resolve(__dirname, "../src/data/generated/country-runner-report.json");

async function main() {
  const locale = process.env.COPY_LOCALE ?? defaultLocale;

  if (!isKnownLocale(locale)) {
    throw new Error(`Unsupported COPY_LOCALE "${locale}". Check config/locales.json.`);
  }

  const continueOnError = process.env.RUNNER_CONTINUE_ON_ERROR
    ? isTruthyEnv(process.env.RUNNER_CONTINUE_ON_ERROR)
    : true;
  const generateAiCopy = process.env.RUNNER_GENERATE_AI_COPY
    ? isTruthyEnv(process.env.RUNNER_GENERATE_AI_COPY)
    : true;
  const cityDelayMs = Number(process.env.RUNNER_CITY_DELAY_MS ?? 1500);
  const countryCodes = parseCsvEnv(process.env.IMPORT_COUNTRIES);
  const cityIds = parseCsvEnv(process.env.IMPORT_CITY_IDS);
  const limit = process.env.IMPORT_CITY_LIMIT;
  const offset = process.env.IMPORT_CITY_OFFSET;

  const { catalog, countryCodeByName } = await loadEuropeanCityCatalogWithMetadata();
  const selectedCities = selectCitiesFromCatalog(catalog, {
    countryCodes,
    cityIds,
    limit,
    offset,
    countryCodeByName,
  });

  if (!selectedCities.length) {
    throw new Error(
      "No cities matched the requested runner scope. Set IMPORT_COUNTRIES or IMPORT_CITY_IDS before running the runner.",
    );
  }

  const pool = createNeonPool(process.env.DATABASE_URL);
  const report = {
    startedAt: new Date().toISOString(),
    locale,
    generateAiCopy,
    continueOnError,
    selectedCities: selectedCities.map((city) => ({
      id: city.id,
      name: city.name,
      country: city.country,
    })),
    successes: [],
    failures: [],
  };
  const aiCopyRunStats = createEmptyRunStats();

  try {
    await applySchema(pool);

    for (const [index, city] of selectedCities.entries()) {
      console.log(`[${index + 1}/${selectedCities.length}] Importing ${city.name}, ${city.country}...`);

      try {
        const seedData = await fetchLiveSeedData({
          cities: [city],
          fallbackPoiRows: [],
        });
        const derivedData = buildTravelCache(seedData);
        await syncDataToNeon(pool, seedData, derivedData);

        let aiCopyPages = 0;

        if (generateAiCopy) {
          const pages = await fetchCachedPages(pool, { cityIds: [city.id] });
          const sourceCopyMap =
            locale === defaultLocale
              ? {}
              : await fetchLocalizedCopyMap(pool, defaultLocale, { cityIds: [city.id] });
          const { pages: localizedPages, stats } = await enrichPagesWithAiCopy(pages, locale, {
            sourceCopyMap,
          });
          mergeAiCopyRunStats(aiCopyRunStats, stats);
          await saveLocalizedPages(pool, localizedPages, locale);
          aiCopyPages = localizedPages.length;
        }

        report.successes.push({
          cityId: city.id,
          cityName: city.name,
          country: city.country,
          pages: derivedData.pages.length,
          aiCopyPages,
        });
      } catch (error) {
        const failure = {
          cityId: city.id,
          cityName: city.name,
          country: city.country,
          error: error instanceof Error ? error.message : String(error),
        };

        report.failures.push(failure);
        console.error(`Failed ${city.name}: ${failure.error}`);

        if (!continueOnError) {
          throw error;
        }
      }

      if (cityDelayMs > 0 && index < selectedCities.length - 1) {
        await sleep(cityDelayMs);
      }
    }
  } finally {
    report.finishedAt = new Date().toISOString();
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await pool.end();
  }

  if (generateAiCopy) {
    printAiCopyRunSummary(finalizeRunStats(aiCopyRunStats), `AI copy runner locale=${locale}`);
  }

  console.log(
    `Runner finished with ${report.successes.length} successes and ${report.failures.length} failures. Report written to ${reportPath}.`,
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await main();
