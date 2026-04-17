import { normalizeTravelSlug } from "./slug-utils.ts";

const SUPPORTED_TIQETS_CITIES = [
  { cityId: "barcelona", cityName: "Barcelona", tiqetsCityId: "66342" },
  { cityId: "berlin", cityName: "Berlin", tiqetsCityId: "65144" },
  { cityId: "dresden", cityName: "Dresden", tiqetsCityId: "65042" },
  { cityId: "dusseldorf", cityName: "Dusseldorf", tiqetsCityId: "65037" },
  { cityId: "hamburg", cityName: "Hamburg", tiqetsCityId: "64886" },
  { cityId: "kiel", cityName: "Kiel", tiqetsCityId: "64775" },
  { cityId: "krakow", cityName: "Krakow", tiqetsCityId: "46" },
  { cityId: "madrid", cityName: "Madrid", tiqetsCityId: "66254" },
  { cityId: "munich", cityName: "Munich", tiqetsCityId: "31" },
  { cityId: "potsdam", cityName: "Potsdam", tiqetsCityId: "64529" },
  { cityId: "toledo", cityName: "Toledo", tiqetsCityId: "170113" },
  { cityId: "valencia", cityName: "Valencia", tiqetsCityId: "65847" },
  { cityId: "warsaw", cityName: "Warsaw", tiqetsCityId: "485" },
] as const;

const tiqetsCityIdsByInternalCityId = Object.fromEntries(
  SUPPORTED_TIQETS_CITIES.map(({ cityId, tiqetsCityId }) => [cityId, tiqetsCityId]),
) as Record<string, string>;

const tiqetsCityIdsByNormalizedName = Object.fromEntries(
  SUPPORTED_TIQETS_CITIES.map(({ cityName, tiqetsCityId }) => [
    normalizeTravelSlug(cityName),
    tiqetsCityId,
  ]),
) as Record<string, string>;

export function getTiqetsCityId(cityId: string, cityName?: string) {
  const fromCityId = tiqetsCityIdsByInternalCityId[cityId];

  if (fromCityId) {
    return fromCityId;
  }

  if (!cityName) {
    return null;
  }

  return tiqetsCityIdsByNormalizedName[normalizeTravelSlug(cityName)] ?? null;
}

export function shouldRenderTiqetsWidget(cityId: string, cityName?: string) {
  return getTiqetsCityId(cityId, cityName) !== null;
}
