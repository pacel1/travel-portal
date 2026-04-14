import { loadLocalEnv } from "./lib/load-env.mjs";
import { applySchema, createNeonPool, syncDataToNeon } from "./lib/neon-sync.mjs";
import { buildTravelCache } from "./lib/travel-engine.mjs";
import { fetchLiveSeedData } from "./lib/live-sources.mjs";
import {
  loadEuropeanCityCatalogWithMetadata,
  parseCsvEnv,
  selectCitiesFromCatalog,
} from "./lib/city-selection.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before importing a live city batch.");
}

async function main() {
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
      "No cities matched the requested batch. Set IMPORT_COUNTRIES or IMPORT_CITY_IDS before running this importer.",
    );
  }

  const seedData = await fetchLiveSeedData({
    cities: selectedCities,
    fallbackPoiRows: [],
  });
  const derivedData = buildTravelCache(seedData);
  const pool = createNeonPool(process.env.DATABASE_URL);

  try {
    await applySchema(pool);
    await syncDataToNeon(pool, seedData, derivedData);

    const countries = [...new Set(selectedCities.map((city) => city.country))];
    console.log(
      `Imported live batch for ${selectedCities.length} cities across ${countries.length} countries. Wrote ${seedData.climateRows.length} climate rows, ${seedData.poiRows.length} POIs, ${derivedData.monthlyScores.length} scores, and ${derivedData.pages.length} pages.`,
    );
    console.log(`Countries: ${countries.join(", ")}`);
  } finally {
    await pool.end();
  }
}

await main();
