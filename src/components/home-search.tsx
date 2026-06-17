"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export type HomeSearchMonth = {
  href: string;
  label: string;
  month: string;
  score: number;
};

export type HomeSearchCity = {
  bestScore: number;
  cityName: string;
  citySlug: string;
  cityHref: string;
  country: string;
  countryLabel: string;
  months: HomeSearchMonth[];
};

export type HomeSearchLabels = {
  country: string;
  city: string;
  submit: string;
};

export function HomeSearch({
  cities,
  labels,
}: {
  cities: HomeSearchCity[];
  labels: HomeSearchLabels;
}) {
  const router = useRouter();
  const countries = useMemo(
    () => {
      const countryMap = new Map<string, { count: number; label: string; value: string }>();

      for (const city of cities) {
        const entry = countryMap.get(city.country);
        countryMap.set(city.country, {
          count: (entry?.count ?? 0) + 1,
          label: city.countryLabel,
          value: city.country,
        });
      }

      return Array.from(countryMap.values()).sort(
        (left, right) => right.count - left.count || left.label.localeCompare(right.label),
      );
    },
    [cities],
  );
  const [country, setCountry] = useState(countries[0]?.value ?? "");
  const visibleCities = useMemo(
    () => cities.filter((city) => city.country === country),
    [cities, country],
  );
  const [citySlug, setCitySlug] = useState(visibleCities[0]?.citySlug ?? cities[0]?.citySlug ?? "");
  const selectedCity = visibleCities.find((city) => city.citySlug === citySlug) ?? visibleCities[0] ?? cities[0];

  function handleCountryChange(nextCountry: string) {
    const nextCities = cities.filter((city) => city.country === nextCountry);
    const nextCity = nextCities[0];

    setCountry(nextCountry);
    setCitySlug(nextCity?.citySlug ?? "");
  }

  function handleCityChange(nextCitySlug: string) {
    setCitySlug(nextCitySlug);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedCity) {
      router.push(selectedCity.cityHref);
    }
  }

  return (
    <form className="home-search" onSubmit={handleSubmit}>
      <div className="home-search-fields">
        <label className="home-search-field">
          <span>{labels.country}</span>
          <select value={country} onChange={(event) => handleCountryChange(event.target.value)}>
            {countries.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label className="home-search-field">
          <span>{labels.city}</span>
          <select value={selectedCity?.citySlug ?? ""} onChange={(event) => handleCityChange(event.target.value)}>
            {visibleCities.map((city) => (
              <option key={city.citySlug} value={city.citySlug}>
                {city.cityName} · {city.bestScore}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button className="home-search-submit" type="submit" disabled={!selectedCity}>
        <Search aria-hidden="true" size={18} strokeWidth={2.4} />
        {labels.submit}
      </button>
    </form>
  );
}
