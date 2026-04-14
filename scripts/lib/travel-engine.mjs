import cities from "../../src/data/raw/cities.json" with { type: "json" };
import climateRows from "../../src/data/raw/monthly-climate.json" with { type: "json" };
import signalRows from "../../src/data/raw/monthly-signals.json" with { type: "json" };
import poiRows from "../../src/data/raw/poi.json" with { type: "json" };

export const monthOrder = [
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

export const monthNumberByName = Object.fromEntries(
  monthOrder.map((month, index) => [month, index + 1]),
);

export const monthNameByNumber = Object.fromEntries(
  monthOrder.map((month, index) => [index + 1, month]),
);

const crowdWeight = { low: 92, medium: 74, high: 52 };
const priceWeight = { low: 92, medium: 74, high: 56 };
const scoreWeights = {
  temperatureComfort: 0.3,
  precipitation: 0.3,
  sunshine: 0.2,
  crowd: 0.1,
  price: 0.1,
};
const seasonalCrowdDemandByMonth = {
  january: 0.5,
  february: 0.5,
  march: 1.0,
  april: 2.0,
  may: 3.0,
  june: 3.5,
  july: 4.0,
  august: 3.5,
  september: 3.0,
  october: 2.0,
  november: 1.0,
  december: 2.5,
};
const seasonalPriceDemandByMonth = {
  january: 0.5,
  february: 0.5,
  march: 1.0,
  april: 1.75,
  may: 2.75,
  june: 3.25,
  july: 3.75,
  august: 3.5,
  september: 2.5,
  october: 1.75,
  november: 1.0,
  december: 2.5,
};

export function monthLabel(month) {
  return month.charAt(0).toUpperCase() + month.slice(1);
}

export function getLocalSeedData() {
  return {
    cities,
    climateRows,
    signalRows,
    poiRows,
  };
}

export function deriveSignalRows(cityRows, climateRows) {
  return cityRows.flatMap((city) =>
    monthOrder.map((month) => {
      const climate = climateRows.find(
        (entry) => entry.city_id === city.id && entry.month === month,
      );

      if (!climate) {
        return null;
      }

      // Crowd and price remain heuristic signals, but they should describe
      // seasonal demand and city scale rather than re-counting the weather.
      const crowdScore =
        seasonalCrowdDemandByMonth[month] + getPopulationDemandBoost(city.population);
      const priceScore =
        seasonalPriceDemandByMonth[month] + getPopulationDemandBoost(city.population);

      return {
        city_id: city.id,
        month,
        crowd_level: toCrowdLevel(crowdScore),
        price_level: toPriceLevel(priceScore),
      };
    }).filter(Boolean),
  );
}

function getPopulationDemandBoost(population = 0) {
  if (population >= 2000000) {
    return 1.5;
  }

  if (population >= 1000000) {
    return 1.0;
  }

  if (population >= 400000) {
    return 0.5;
  }

  return 0;
}

function scoreTemperatureComfort(avgTempDay, avgTempNight) {
  const dayScore = scoreFromCurve(avgTempDay, [
    [-5, 0],
    [0, 12],
    [5, 35],
    [10, 60],
    [14, 82],
    [18, 95],
    [22, 100],
    [26, 96],
    [29, 86],
    [32, 70],
    [35, 50],
    [38, 25],
  ]);
  const nightScore = scoreFromCurve(avgTempNight, [
    [-10, 0],
    [-5, 10],
    [0, 28],
    [5, 55],
    [10, 82],
    [14, 100],
    [18, 92],
    [21, 72],
    [24, 50],
    [28, 20],
  ]);

  return clampScore(dayScore * 0.75 + nightScore * 0.25);
}

function scorePrecipitation(rainfallMm, rainyDays) {
  const rainyDayScore = scoreFromCurve(rainyDays, [
    [0, 100],
    [3, 93],
    [5, 85],
    [8, 72],
    [10, 62],
    [12, 50],
    [15, 35],
    [18, 20],
    [22, 5],
    [25, 0],
  ]);
  const rainfallScore = scoreFromCurve(rainfallMm, [
    [0, 100],
    [20, 95],
    [40, 85],
    [60, 74],
    [80, 58],
    [100, 42],
    [130, 18],
    [160, 5],
    [200, 0],
  ]);

  // For city trips, how often rain interrupts the day matters slightly more
  // than the monthly total in mm.
  return clampScore(rainyDayScore * 0.65 + rainfallScore * 0.35);
}

function scoreSunshine(sunshineHours) {
  return scoreFromCurve(sunshineHours, [
    [0, 0],
    [1, 10],
    [2, 22],
    [4, 42],
    [6, 62],
    [8, 78],
    [10, 90],
    [12, 100],
    [14, 100],
  ]);
}

function scoreFromCurve(value, points) {
  if (value <= points[0][0]) {
    return points[0][1];
  }

  for (let index = 1; index < points.length; index += 1) {
    const [rightX, rightY] = points[index];
    const [leftX, leftY] = points[index - 1];

    if (value <= rightX) {
      const range = rightX - leftX || 1;
      const ratio = (value - leftX) / range;
      return clampScore(leftY + (rightY - leftY) * ratio);
    }
  }

  return points.at(-1)[1];
}

function clampScore(value) {
  return Math.round(Math.max(0, Math.min(100, value)));
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

function pickAttractions(cityId, climate, poiSource) {
  const cityPois = poiSource
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

export function buildTravelCache(seedData) {
  const {
    cities: cityRows,
    climateRows,
    signalRows: sourceSignals,
    poiRows,
  } = seedData;
  const signalRows = sourceSignals?.length
    ? sourceSignals
    : deriveSignalRows(cityRows, climateRows);
  const monthlyScores = [];

  for (const city of cityRows) {
    for (const month of monthOrder) {
      const climate = climateRows.find(
        (entry) => entry.city_id === city.id && entry.month === month,
      );
      const signal = signalRows.find(
        (entry) => entry.city_id === city.id && entry.month === month,
      );

      if (!climate || !signal) {
        continue;
      }

      const temperatureComponent = scoreTemperatureComfort(
        climate.avg_temp_day,
        climate.avg_temp_night,
      );
      const precipitationComponent = scorePrecipitation(
        climate.rainfall_mm,
        climate.rainy_days,
      );
      const sunshineComponent = scoreSunshine(climate.sunshine_hours);

      const score = Math.round(
        temperatureComponent * scoreWeights.temperatureComfort +
          precipitationComponent * scoreWeights.precipitation +
          sunshineComponent * scoreWeights.sunshine +
          crowdWeight[signal.crowd_level] * scoreWeights.crowd +
          priceWeight[signal.price_level] * scoreWeights.price,
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
    const city = cityRows.find((entry) => entry.id === scoreRecord.cityId);
    const climate = climateRows.find(
      (entry) =>
        entry.city_id === scoreRecord.cityId && entry.month === scoreRecord.month,
    );
    const signal = signalRows.find(
      (entry) =>
        entry.city_id === scoreRecord.cityId && entry.month === scoreRecord.month,
    );
    const attractions = pickAttractions(scoreRecord.cityId, climate, poiRows);

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
      editorial: {
        bestFor: [],
        monthRead: "",
        bookingRead: "",
      },
      copyMeta: {
        source: "rules",
        generatedAt: new Date().toISOString(),
      },
    };
  });

  return {
    monthlyScores,
    pages,
  };
}

function toCrowdLevel(score) {
  if (score >= 4.5) {
    return "high";
  }

  if (score >= 2.5) {
    return "medium";
  }

  return "low";
}

function toPriceLevel(score) {
  if (score >= 4) {
    return "high";
  }

  if (score >= 2.25) {
    return "medium";
  }

  return "low";
}
