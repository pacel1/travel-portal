import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const europeanCatalogPath = path.resolve(
  __dirname,
  "../../src/data/raw/european-cities-top20.json",
);

export async function loadEuropeanCityCatalog() {
  const text = await readFile(europeanCatalogPath, "utf8");
  return JSON.parse(text);
}

export function parseCsvEnv(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function selectCitiesFromCatalog(cities, options = {}) {
  const countryCodes = new Set((options.countryCodes ?? []).map((code) => code.toUpperCase()));
  const cityIds = new Set(options.cityIds ?? []);
  const offset = Number(options.offset ?? 0);
  const limit = options.limit ? Number(options.limit) : null;

  let selected = cities;

  if (countryCodes.size) {
    selected = selected.filter((city) =>
      countryCodes.has((options.countryCodeByName?.get(city.country) ?? "").toUpperCase()),
    );
  }

  if (cityIds.size) {
    selected = selected.filter((city) => cityIds.has(city.id));
  }

  if (offset > 0) {
    selected = selected.slice(offset);
  }

  if (limit && limit > 0) {
    selected = selected.slice(0, limit);
  }

  return selected;
}

export function buildCountryCodeByName(catalogMetadata) {
  return new Map(
    (catalogMetadata?.countries ?? []).map((entry) => [entry.country, entry.countryCode]),
  );
}

export async function loadEuropeanCityCatalogWithMetadata() {
  const catalog = await loadEuropeanCityCatalog();
  const metadataPath = path.resolve(
    __dirname,
    "../../src/data/raw/european-cities-top20.meta.json",
  );
  const metadataText = await readFile(metadataPath, "utf8");
  const metadata = JSON.parse(metadataText);

  return {
    catalog,
    metadata,
    countryCodeByName: buildCountryCodeByName(metadata),
  };
}
