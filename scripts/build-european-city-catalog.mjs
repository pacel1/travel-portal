import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { strFromU8, unzipSync } from "fflate";

const COUNTRY_INFO_URL = "https://download.geonames.org/export/dump/countryInfo.txt";
const CITIES_500_URL = "https://download.geonames.org/export/dump/cities500.zip";
const COUNTRY_DUMP_URL = (countryCode) =>
  `https://download.geonames.org/export/dump/${countryCode}.zip`;
const PER_COUNTRY_LIMIT = 20;
const TARGET_COUNTRY_CODES = [
  "AL",
  "AD",
  "AM",
  "AT",
  "AZ",
  "BY",
  "BE",
  "BA",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "GE",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "XK",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "MA",
  "MD",
  "MC",
  "ME",
  "NL",
  "MK",
  "NO",
  "PL",
  "PT",
  "RO",
  "RU",
  "SM",
  "RS",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
  "TR",
  "UA",
  "GB",
  "VA",
];
const outputDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/raw",
);
const catalogPath = path.join(outputDir, "european-cities-top20.json");
const metadataPath = path.join(outputDir, "european-cities-top20.meta.json");

export async function buildEuropeanCityCatalog() {
  const countries = await fetchEuropeanCountries();
  const countryByCode = new Map(countries.map((country) => [country.countryCode, country]));
  const baselinePlaces = await fetchPlacesFromZip(CITIES_500_URL, countryByCode);
  const placesByCountry = groupPlacesByCountry(baselinePlaces, countryByCode);
  const shortfallCountries = countries.filter(
    (country) => (placesByCountry.get(country.countryCode)?.length ?? 0) < PER_COUNTRY_LIMIT,
  );

  for (const country of shortfallCountries) {
    let countryPlaces = await fetchPlacesFromZip(
      COUNTRY_DUMP_URL(country.countryCode),
      new Map([[country.countryCode, country]]),
    );

    if (countryPlaces.length < PER_COUNTRY_LIMIT) {
      countryPlaces = await fetchPlacesFromZip(
        COUNTRY_DUMP_URL(country.countryCode),
        new Map([[country.countryCode, country]]),
        { allowZeroPopulation: true },
      );
    }

    placesByCountry.set(country.countryCode, countryPlaces);
  }

  const usedSlugs = new Set();
  const cityRecords = [];
  const countriesSummary = [];

  for (const country of countries) {
    const rankedPlaces = rankPlaces(placesByCountry.get(country.countryCode) ?? []);
    const selectedPlaces = rankedPlaces.slice(0, PER_COUNTRY_LIMIT);

    countriesSummary.push({
      country: country.name,
      countryCode: country.countryCode,
      selectedCities: selectedPlaces.length,
      requestedCities: PER_COUNTRY_LIMIT,
      shortfall: Math.max(0, PER_COUNTRY_LIMIT - selectedPlaces.length),
    });

    for (const place of selectedPlaces) {
      const baseSlug = slugify(place.name || place.asciiName || `${country.name}-${place.geonameId}`);
      const slug = buildUniqueSlug(baseSlug, country.countryCode, place.geonameId, usedSlugs);

      cityRecords.push({
        id: slug,
        name: place.name,
        slug,
        country: country.name,
        latitude: place.latitude,
        longitude: place.longitude,
        population: place.population,
      });
    }
  }

  return {
    cities: cityRecords,
    metadata: {
      generatedAt: new Date().toISOString(),
      source: {
        provider: "GeoNames",
        countryInfoUrl: COUNTRY_INFO_URL,
        baselineCitiesUrl: CITIES_500_URL,
      },
      countryCount: countries.length,
      cityCount: cityRecords.length,
      requestedCitiesPerCountry: PER_COUNTRY_LIMIT,
      countriesWithShortfall: countriesSummary.filter((entry) => entry.shortfall > 0),
      countries: countriesSummary,
    },
  };
}

async function fetchEuropeanCountries() {
  const targetCountryCodes = new Set(TARGET_COUNTRY_CODES);
  const response = await fetch(COUNTRY_INFO_URL);

  if (!response.ok) {
    throw new Error(`GeoNames countryInfo request failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  return text
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("\t"))
    .filter((columns) => targetCountryCodes.has(columns[0]))
    .map((columns) => ({
      countryCode: columns[0],
      name: columns[4],
      capital: columns[5],
      geonameId: columns[16],
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function fetchPlacesFromZip(url, countryByCode, options = {}) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GeoNames zip request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const firstEntry = Object.values(archive)[0];

  if (!firstEntry) {
    throw new Error(`GeoNames archive ${url} did not contain a readable file.`);
  }

  return parseGeonamesPlaces(strFromU8(firstEntry), countryByCode, options);
}

function parseGeonamesPlaces(text, countryByCode, options = {}) {
  const allowZeroPopulation = options.allowZeroPopulation ?? false;

  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split("\t"))
    .filter((columns) => columns.length >= 15)
    .filter((columns) => countryByCode.has(columns[8]))
    .filter((columns) => columns[6] === "P")
    .map((columns) => ({
      geonameId: columns[0],
      name: columns[1],
      asciiName: columns[2],
      latitude: round(Number(columns[4]), 6),
      longitude: round(Number(columns[5]), 6),
      featureCode: columns[7],
      countryCode: columns[8],
      population: Number(columns[14]) || 0,
    }))
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
    .filter((place) => allowZeroPopulation || place.population > 0);
}

function groupPlacesByCountry(places, countryByCode) {
  const grouped = new Map([...countryByCode.keys()].map((code) => [code, []]));

  for (const place of places) {
    grouped.get(place.countryCode)?.push(place);
  }

  return grouped;
}

function rankPlaces(places) {
  const deduped = new Map();

  for (const place of places) {
    const key = `${place.countryCode}:${normalizeKey(place.name)}`;
    const existing = deduped.get(key);

    if (!existing || comparePlaces(place, existing) < 0) {
      deduped.set(key, place);
    }
  }

  return [...deduped.values()].sort(comparePlaces);
}

function comparePlaces(left, right) {
  return (
    featurePriority(right.featureCode) - featurePriority(left.featureCode) ||
    right.population - left.population ||
    left.name.localeCompare(right.name)
  );
}

function featurePriority(featureCode) {
  switch (featureCode) {
    case "PPLC":
      return 7;
    case "PPLA":
      return 6;
    case "PPLA2":
      return 5;
    case "PPLA3":
      return 4;
    case "PPLA4":
      return 3;
    case "PPLG":
      return 2;
    case "PPL":
      return 1;
    default:
      return 0;
  }
}

function slugify(value) {
  return value
    .replace(/\u0141/g, "L")
    .replace(/\u0142/g, "l")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildUniqueSlug(baseSlug, countryCode, geonameId, usedSlugs) {
  const fallbackSlug = baseSlug || `city-${countryCode.toLowerCase()}`;
  const slugCandidates = [
    fallbackSlug,
    `${fallbackSlug}-${countryCode.toLowerCase()}`,
    `${fallbackSlug}-${geonameId}`,
  ];

  for (const candidate of slugCandidates) {
    if (!usedSlugs.has(candidate)) {
      usedSlugs.add(candidate);
      return candidate;
    }
  }

  let index = 2;

  while (usedSlugs.has(`${fallbackSlug}-${geonameId}-${index}`)) {
    index += 1;
  }

  const slug = `${fallbackSlug}-${geonameId}-${index}`;
  usedSlugs.add(slug);
  return slug;
}

function normalizeKey(value) {
  return slugify(value);
}

function round(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

async function main() {
  const { cities, metadata } = await buildEuropeanCityCatalog();

  await mkdir(outputDir, { recursive: true });
  await writeFile(catalogPath, `${JSON.stringify(cities, null, 2)}\n`);
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

  console.log(
    `Built European city catalog with ${cities.length} cities across ${metadata.countryCount} countries.`,
  );

  if (metadata.countriesWithShortfall.length) {
    console.log(
      `Countries with fewer than ${PER_COUNTRY_LIMIT} cities in GeoNames population data: ${metadata.countriesWithShortfall
        .map((entry) => `${entry.countryCode} (${entry.selectedCities})`)
        .join(", ")}`,
    );
  }
}

await main();
