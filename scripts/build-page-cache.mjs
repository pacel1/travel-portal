import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import cities from "../src/data/raw/cities.json" with { type: "json" };
import climateRows from "../src/data/raw/monthly-climate.json" with { type: "json" };
import signalRows from "../src/data/raw/monthly-signals.json" with { type: "json" };
import poiRows from "../src/data/raw/poi.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, "../src/data/generated");

const monthOrder = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const crowdWeight = { low: 100, medium: 72, high: 40 };
const priceWeight = { low: 100, medium: 70, high: 42 };

function monthLabel(month) {
  return month.charAt(0).toUpperCase() + month.slice(1);
}

function scoreTemperature(avgTempDay) {
  const optimalMin = 18;
  const optimalMax = 26;

  if (avgTempDay >= optimalMin && avgTempDay <= optimalMax) {
    return 100;
  }

  if (avgTempDay < optimalMin) {
    return Math.max(0, 100 - (optimalMin - avgTempDay) * 6);
  }

  return Math.max(0, 100 - (avgTempDay - optimalMax) * 7);
}

function scoreRainfall(rainfallMm, rainyDays) {
  return Math.max(0, 100 - rainfallMm * 0.7 - rainyDays * 3.5);
}

function scoreLabel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 68) return "Very Good";
  if (score >= 55) return "Solid";
  if (score >= 45) return "Mixed";
  return "Only if the timing fits";
}

function buildPros(climate, signal, cityName) {
  const pros = [];

  if (climate.avg_temp_day >= 18 && climate.avg_temp_day <= 26) {
    pros.push(`Comfortable daytime temperatures make long walks around ${cityName} easy.`);
  }

  if (climate.rainfall_mm <= 60) {
    pros.push("Rainfall stays manageable for sightseeing-heavy itineraries.");
  }

  if (signal.crowd_level === "low") {
    pros.push("Queues and popular viewpoints are easier to handle than peak season.");
  }

  if (signal.price_level === "low") {
    pros.push("Accommodation pricing is more forgiving than the summer peak.");
  }

  if (climate.sunshine_hours >= 7) {
    pros.push("Longer, brighter days make it easier to fit more into each visit.");
  }

  return pros.slice(0, 3);
}

function buildCons(climate, signal, cityName) {
  const cons = [];

  if (climate.avg_temp_day < 10) {
    cons.push(`Cold spells can shorten outdoor time in ${cityName}.`);
  }

  if (climate.avg_temp_day > 29) {
    cons.push("Midday sightseeing can feel draining, especially on exposed routes.");
  }

  if (climate.rainfall_mm >= 80 || climate.rainy_days >= 10) {
    cons.push("A flexible plan helps because rain interruptions are fairly common.");
  }

  if (signal.crowd_level === "high") {
    cons.push("Top sights need early starts or advance booking to avoid long waits.");
  }

  if (signal.price_level === "high") {
    cons.push("Flights and central hotels are usually priced above shoulder-season levels.");
  }

  return cons.slice(0, 3);
}

function buildRecommendations(climate) {
  const recommendations = [];

  if (climate.avg_temp_day >= 20 && climate.rainfall_mm <= 70) {
    recommendations.push("Prioritize landmark-heavy walking routes and open-air viewpoints.");
  }

  if (climate.sunshine_hours >= 7) {
    recommendations.push("Use early mornings and late afternoons for the most photogenic light.");
  }

  if (climate.rainfall_mm > 70 || climate.rainy_days >= 9) {
    recommendations.push("Keep a museum-focused backup plan for wetter afternoons.");
  }

  if (climate.avg_temp_day < 10) {
    recommendations.push("Lean into shorter outdoor loops with cafe or museum breaks between them.");
  }

  return recommendations.slice(0, 3);
}

function buildTips(climate, signal) {
  const tips = [];

  tips.push(
    climate.avg_temp_day >= 24
      ? "Pack breathable layers, water, and one shaded lunch stop each day."
      : climate.avg_temp_day <= 8
        ? "Bring insulated layers, comfortable boots, and gloves for morning starts."
        : "Light layers work best because mornings and evenings still shift noticeably.",
  );

  tips.push(
    climate.rainfall_mm >= 70 || climate.rainy_days >= 9
      ? "A compact umbrella matters more than a heavy rain jacket for city sightseeing."
      : "Comfortable walking shoes matter more than weather gear on most days.",
  );

  tips.push(
    signal.crowd_level === "high"
      ? "Reserve the headline attraction first and build the rest of the day around that slot."
      : "You can usually keep the itinerary flexible and still fit in major highlights.",
  );

  return tips;
}

function buildSummary(city, month, climate, score, signal) {
  const temperatureLine =
    climate.avg_temp_day >= 20
      ? `warm ${climate.avg_temp_day}C days`
      : climate.avg_temp_day >= 10
        ? `mild ${climate.avg_temp_day}C days`
        : `cool ${climate.avg_temp_day}C days`;

  const rainLine =
    climate.rainfall_mm <= 55
      ? "limited rain risk"
      : climate.rainfall_mm <= 80
        ? "some rain interruptions"
        : "noticeably wetter conditions";

  return `${city.name} in ${monthLabel(month)} is a ${scoreLabel(score).toLowerCase()} pick, with ${temperatureLine}, ${rainLine}, and ${signal.crowd_level} crowds. Expect ${climate.sunshine_hours.toFixed(1)} daily sunshine hours on average, which keeps the month useful for practical trip planning without relying on generic filler content.`;
}

function pickAttractions(cityId, climate) {
  const cityPois = poiRows
    .filter((poi) => poi.city_id === cityId)
    .sort((left, right) => right.popularity_score - left.popularity_score);

  const outdoor = cityPois
    .filter((poi) => !poi.indoor)
    .slice(0, climate.avg_temp_day >= 10 ? 3 : 2);
  const indoor = cityPois
    .filter((poi) => poi.indoor)
    .slice(0, climate.rainy_days >= 9 ? 3 : 2);

  return {
    outdoor: outdoor.map((poi) => ({
      id: poi.id,
      cityId: poi.city_id,
      name: poi.name,
      category: poi.category,
      indoor: poi.indoor,
      popularityScore: poi.popularity_score,
      lat: poi.lat,
      lon: poi.lon,
    })),
    indoor: indoor.map((poi) => ({
      id: poi.id,
      cityId: poi.city_id,
      name: poi.name,
      category: poi.category,
      indoor: poi.indoor,
      popularityScore: poi.popularity_score,
      lat: poi.lat,
      lon: poi.lon,
    })),
  };
}

const monthlyScores = [];

for (const city of cities) {
  for (const month of monthOrder) {
    const climate = climateRows.find(
      (entry) => entry.city_id === city.id && entry.month === month,
    );
    const signal = signalRows.find(
      (entry) => entry.city_id === city.id && entry.month === month,
    );

    const temperatureComponent = scoreTemperature(climate.avg_temp_day);
    const rainfallComponent = scoreRainfall(climate.rainfall_mm, climate.rainy_days);

    const score = Math.round(
      temperatureComponent * 0.4 +
        rainfallComponent * 0.2 +
        crowdWeight[signal.crowd_level] * 0.2 +
        priceWeight[signal.price_level] * 0.2,
    );

    monthlyScores.push({
      cityId: city.id,
      cityName: city.name,
      country: city.country,
      citySlug: city.slug,
      month,
      score,
      crowdLevel: signal.crowd_level,
      priceLevel: signal.price_level,
    });
  }
}

function getSameCityLinks(cityId, month) {
  return monthlyScores
    .filter((entry) => entry.cityId === cityId && entry.month !== month)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => ({
      slug: `${entry.citySlug}-in-${entry.month}`,
      label: `${entry.cityName} in ${monthLabel(entry.month)}`,
      score: entry.score,
    }));
}

function getSimilarCityLinks(cityId, month) {
  return monthlyScores
    .filter((entry) => entry.cityId !== cityId && entry.month === month)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((entry) => ({
      slug: `${entry.citySlug}-in-${entry.month}`,
      label: `${entry.cityName} in ${monthLabel(entry.month)}`,
      score: entry.score,
    }));
}

const pages = monthlyScores.map((scoreRecord) => {
  const city = cities.find((entry) => entry.id === scoreRecord.cityId);
  const climate = climateRows.find(
    (entry) =>
      entry.city_id === scoreRecord.cityId && entry.month === scoreRecord.month,
  );
  const signal = signalRows.find(
    (entry) =>
      entry.city_id === scoreRecord.cityId && entry.month === scoreRecord.month,
  );
  const attractions = pickAttractions(scoreRecord.cityId, climate);

  return {
    slug: `${scoreRecord.citySlug}-in-${scoreRecord.month}`,
    cityId: scoreRecord.cityId,
    cityName: city.name,
    citySlug: city.slug,
    country: city.country,
    month: scoreRecord.month,
    summary: buildSummary(city, scoreRecord.month, climate, scoreRecord.score, signal),
    generatedAt: new Date().toISOString(),
    score: scoreRecord.score,
    scoreLabel: scoreLabel(scoreRecord.score),
    climate: {
      avgTempDay: climate.avg_temp_day,
      avgTempNight: climate.avg_temp_night,
      rainfallMm: climate.rainfall_mm,
      rainyDays: climate.rainy_days,
      humidity: climate.humidity,
      sunshineHours: climate.sunshine_hours,
    },
    verdict: {
      heading: `${city.name} in ${monthLabel(scoreRecord.month)} is best for travelers who want a ${
        scoreRecord.score >= 68 ? "well-balanced city break" : "more situational city break"
      }.`,
      pros: buildPros(climate, signal, city.name),
      cons: buildCons(climate, signal, city.name),
    },
    attractions,
    recommendations: buildRecommendations(climate),
    tips: buildTips(climate, signal),
    travelSignals: {
      crowdLevel: signal.crowd_level,
      priceLevel: signal.price_level,
    },
    internalLinks: {
      sameCity: getSameCityLinks(scoreRecord.cityId, scoreRecord.month),
      similarCities: getSimilarCityLinks(scoreRecord.cityId, scoreRecord.month),
    },
  };
});

await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, "monthly-scores.json"),
  `${JSON.stringify(monthlyScores, null, 2)}\n`,
);
await writeFile(
  path.join(outputDir, "page-cache.json"),
  `${JSON.stringify(pages, null, 2)}\n`,
);

console.log(`Generated ${monthlyScores.length} monthly scores and ${pages.length} page payloads.`);
