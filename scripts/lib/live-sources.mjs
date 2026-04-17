import {
  deriveSignalRows,
  getLocalSeedData,
  monthOrder,
} from "./travel-engine.mjs";
import { isTruthyEnv } from "./load-env.mjs";

export async function fetchLiveSeedData(options = {}) {
  const localSeedData = getLocalSeedData();
  const cities = options.cities ?? localSeedData.cities;
  const fallbackPoiRows = options.fallbackPoiRows ?? localSeedData.poiRows;

  const climateRows = await fetchClimateRows(cities);
  const poiRows = await fetchPoiRows(cities, fallbackPoiRows);
  const signalRows = deriveSignalRows(cities, climateRows);

  return {
    cities,
    climateRows,
    poiRows,
    signalRows,
  };
}

async function fetchClimateRows(cities) {
  const fullYears = 5;
  const currentYear = new Date().getUTCFullYear();
  const startYear = currentYear - fullYears;
  const endYear = currentYear - 1;
  const openMeteoBaseUrl =
    process.env.OPEN_METEO_ARCHIVE_BASE_URL ??
    "https://archive-api.open-meteo.com/v1/archive";

  const concurrency = Number(process.env.OPEN_METEO_CONCURRENCY ?? 1);
  const locationsPerRequest = Number(process.env.OPEN_METEO_LOCATIONS_PER_REQUEST ?? 1);
  const climateSets = await mapWithConcurrency(
    chunkArray(cities, Math.max(1, locationsPerRequest)),
    concurrency,
    async (cityChunk) => {
      const payload = await fetchClimateChunk(cityChunk, {
        baseUrl: openMeteoBaseUrl,
        startYear,
        endYear,
      });
      const climateDelayMs = Number(process.env.OPEN_METEO_DELAY_MS ?? 250);

      if (climateDelayMs > 0) {
        await sleep(climateDelayMs);
      }

      return normalizeClimatePayloads(cityChunk, payload).flatMap((entry) =>
        aggregateClimate(entry.cityId, entry.daily),
      );
    },
  );

  return climateSets.flat();
}

async function fetchClimateChunk(cities, options) {
  const url = new URL(options.baseUrl);
  url.searchParams.set(
    "latitude",
    cities.map((city) => city.latitude.toString()).join(","),
  );
  url.searchParams.set(
    "longitude",
    cities.map((city) => city.longitude.toString()).join(","),
  );
  url.searchParams.set(
    "daily",
    [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "precipitation_hours",
      "sunshine_duration",
      "relative_humidity_2m_mean",
    ].join(","),
  );
  url.searchParams.set(
    "timezone",
    cities.map(() => "auto").join(","),
  );
  url.searchParams.set("start_date", `${options.startYear}-01-01`);
  url.searchParams.set("end_date", `${options.endYear}-12-31`);

  return fetchJsonWithRetry(url, {
    label: `Open-Meteo request for ${cities[0].name}${cities.length > 1 ? ` and ${cities.length - 1} more cities` : ""}`,
    maxAttempts: Number(process.env.OPEN_METEO_MAX_ATTEMPTS ?? 5),
  });
}

function normalizeClimatePayloads(cities, payload) {
  if (Array.isArray(payload)) {
    return payload.map((entry, index) => ({
      cityId: cities[index].id,
      daily: entry.daily,
    }));
  }

  if (payload?.daily) {
    return [
      {
        cityId: cities[0].id,
        daily: payload.daily,
      },
    ];
  }

  throw new Error("Open-Meteo response format was not recognized for the requested climate batch.");
}

function aggregateClimate(cityId, daily) {
  const rainyDayThresholdMm = Number(process.env.RAINY_DAY_MM_THRESHOLD ?? 1);
  const buckets = new Map(
    monthOrder.map((month) => [
      month,
      {
        tempDayTotal: 0,
        tempNightTotal: 0,
        rainfallTotal: 0,
        rainyDaysTotal: 0,
        humidityTotal: 0,
        sunshineTotal: 0,
        count: 0,
        monthSamples: new Set(),
      },
    ]),
  );

  for (let index = 0; index < daily.time.length; index += 1) {
    const month = monthOrder[new Date(daily.time[index]).getUTCMonth()];
    const bucket = buckets.get(month);

    bucket.monthSamples.add(daily.time[index].slice(0, 7));
    bucket.tempDayTotal += daily.temperature_2m_max[index];
    bucket.tempNightTotal += daily.temperature_2m_min[index];
    bucket.rainfallTotal += daily.precipitation_sum[index];
    bucket.rainyDaysTotal += daily.precipitation_sum[index] >= rainyDayThresholdMm ? 1 : 0;
    bucket.humidityTotal += daily.relative_humidity_2m_mean[index];
    bucket.sunshineTotal += daily.sunshine_duration[index] / 3600;
    bucket.count += 1;
  }

  return monthOrder.map((month) => {
    const bucket = buckets.get(month);
    const sampleCount = bucket.monthSamples.size || 1;

    return {
      city_id: cityId,
      month,
      avg_temp_day: round(bucket.tempDayTotal / bucket.count, 1),
      avg_temp_night: round(bucket.tempNightTotal / bucket.count, 1),
      rainfall_mm: round(bucket.rainfallTotal / sampleCount, 1),
      rainy_days: round(bucket.rainyDaysTotal / sampleCount, 1),
      humidity: round(bucket.humidityTotal / bucket.count, 1),
      sunshine_hours: round(bucket.sunshineTotal / bucket.count, 1),
    };
  });
}

async function fetchPoiRows(cities, fallbackPoiRows) {
  const disableLocalData = isTruthyEnv(process.env.DISABLE_LOCAL_DATA);
  const poiSets = [];

  for (const city of cities) {
    try {
      poiSets.push(await fetchCityPois(city));
    } catch (error) {
      if (disableLocalData) {
        throw error;
      }

      console.warn(
        `POI import fallback for ${city.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      poiSets.push(
        fallbackPoiRows.filter((poi) => poi.city_id === city.id),
      );
    }

    const poiDelayMs = Number(process.env.OVERPASS_DELAY_MS ?? 300);

    if (poiDelayMs > 0) {
      await sleep(poiDelayMs);
    }
  }

  return poiSets.flat();
}

async function fetchCityPois(city) {
  const radius = city.population >= 1500000 ? 9000 : 6500;
  const query = `
[out:json][timeout:90];
(
  nwr(around:${radius},${city.latitude},${city.longitude})[name]["tourism"~"museum|gallery|attraction|zoo|theme_park"];
  nwr(around:${radius},${city.latitude},${city.longitude})[name]["historic"];
  nwr(around:${radius},${city.latitude},${city.longitude})[name]["leisure"~"park|garden"];
);
out center tags;
  `.trim();
  const payload = await postOverpassQuery(query, city.name);
  const deduped = new Map();

  for (const element of payload.elements ?? []) {
    const poi = toPoiRecord(city, element);

    if (!poi) {
      continue;
    }

    const existing = deduped.get(poi.id);

    if (!existing || poi.popularity_score > existing.popularity_score) {
      deduped.set(poi.id, poi);
    }
  }

  return [...deduped.values()]
    .sort((left, right) => right.popularity_score - left.popularity_score)
    .slice(0, 24);
}

async function postOverpassQuery(query, cityName) {
  const endpoints = process.env.OVERPASS_API_URL
    ? [process.env.OVERPASS_API_URL]
    : [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
      ];
  const maxAttempts = Math.max(1, Number(process.env.OVERPASS_MAX_ATTEMPTS ?? 4));

  let lastError = null;

  for (const endpoint of endpoints) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) {
          if (response.status === 429 || response.status >= 500) {
            throw new RetryableHttpError(
              response.status,
              response.statusText,
              parseRetryAfterMs(response.headers.get("retry-after")),
            );
          }

          throw new Error(`${response.status} ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts && isRetryableError(error)) {
          await sleep(error.waitMs ?? 2000 * attempt);
          continue;
        }
      }
    }
  }

  throw new Error(
    `Overpass request failed for ${cityName}: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

function parseRetryAfterMs(value) {
  const retryAfterSeconds = Number(value);

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  return null;
}

function toPoiRecord(city, element) {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();

  if (!name) {
    return null;
  }

  const category = mapPoiCategory(tags);

  if (!category) {
    return null;
  }

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  if (typeof lat !== "number" || typeof lon !== "number") {
    return null;
  }

  return {
    id: `${city.id}-${element.type}-${element.id}`,
    city_id: city.id,
    name,
    category,
    indoor: category === "museum",
    popularity_score: popularityScore(tags, category),
    lat: round(lat, 6),
    lon: round(lon, 6),
  };
}

function mapPoiCategory(tags) {
  if (tags.tourism === "museum" || tags.tourism === "gallery") {
    return "museum";
  }

  if (tags.leisure === "park" || tags.leisure === "garden") {
    return "park";
  }

  if (tags.tourism === "attraction" || tags.historic || tags.tourism === "zoo") {
    return "landmark";
  }

  return null;
}

function popularityScore(tags, category) {
  let score = 45;

  if (category === "museum") score += 20;
  if (category === "park") score += 8;
  if (category === "landmark") score += 14;
  if (tags.wikipedia) score += 12;
  if (tags.wikidata) score += 10;
  if (tags.image) score += 5;
  if (tags.website || tags["contact:website"]) score += 4;
  if (tags.heritage) score += 7;
  if (tags.tourism === "attraction") score += 6;
  if (tags.historic === "monument" || tags.historic === "castle") score += 8;

  return Math.min(99, score);
}

function round(value, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, options = {}) {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 4);
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          const retryAfterSeconds = Number(response.headers.get("retry-after"));
          throw new RetryableHttpError(
            response.status,
            response.statusText,
            Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
              ? retryAfterSeconds * 1000
              : null,
          );
        }

        throw new Error(`${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts && isRetryableError(error)) {
        await sleep(error.waitMs ?? 1500 * attempt);
        continue;
      }

      throw new Error(
        `${options.label ?? "HTTP request"} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  throw new Error(
    `${options.label ?? "HTTP request"} failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

function isRetryableError(error) {
  return error instanceof RetryableHttpError;
}

class RetryableHttpError extends Error {
  constructor(status, statusText, waitMs = null) {
    super(`${status} ${statusText}`);
    this.name = "RetryableHttpError";
    this.waitMs = waitMs;
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length || 1));
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: safeConcurrency }, () => run()));

  return results;
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
