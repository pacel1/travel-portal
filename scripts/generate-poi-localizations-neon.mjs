import { loadLocalEnv } from "./lib/load-env.mjs";
import { createNeonPool, applySchema } from "./lib/neon-sync.mjs";
import { defaultLocale, isKnownLocale } from "./lib/locales.mjs";
import { parseCsvEnv } from "./lib/city-selection.mjs";
import { localizePois } from "./lib/ai-poi-localization.mjs";
import {
  fetchPoisForLocalization,
  savePoiLocalizations,
} from "./lib/poi-localization-sync.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before generating POI localizations.");
}

const targetLocale = process.env.POI_LOCALE ?? defaultLocale;
const targetCityIds = parseCsvEnv(process.env.POI_CITY_IDS);
const targetPoiIds = parseCsvEnv(process.env.POI_IDS);
const onlyMissing = process.env.POI_ONLY_MISSING !== "false";
const batchSize = Number(process.env.POI_BATCH_SIZE ?? 20);

if (!isKnownLocale(targetLocale)) {
  throw new Error(`Unsupported POI_LOCALE "${targetLocale}". Check config/locales.json.`);
}

async function main() {
  const pool = createNeonPool(process.env.DATABASE_URL);

  try {
    await applySchema(pool);

    const pois = await fetchPoisForLocalization(pool, targetLocale, {
      cityIds: targetCityIds,
      poiIds: targetPoiIds,
      onlyMissing,
    });

    if (!pois.length) {
      console.log(`No POIs matched the localization filter for locale ${targetLocale}.`);
      return;
    }

    const localizedRows = await localizePois(pois, targetLocale, { batchSize });
    await savePoiLocalizations(pool, localizedRows, targetLocale);

    console.log(
      `Generated ${localizedRows.length} POI localizations for locale ${targetLocale}${targetCityIds.length ? ` across ${targetCityIds.length} selected cities` : ""}${targetPoiIds.length ? ` for ${targetPoiIds.length} selected POIs` : ""}.`,
    );
  } finally {
    await pool.end();
  }
}

await main();
